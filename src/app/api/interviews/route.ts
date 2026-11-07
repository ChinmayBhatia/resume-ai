import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { generateInterviewQuestions } from "@/lib/ai/generate-questions";
import { AiError } from "@/lib/ai/errors";
import { consumeAiQuota } from "@/lib/rate-limit";
import { MIN_CHARS } from "@/lib/resume/extract";

export const maxDuration = 60;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

const bodySchema = z.object({
  resumeId: z.uuid(),
  type: z.enum(["Technical", "HR", "Mixed"]),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  count: z.union([z.literal(10), z.literal(15), z.literal(20)]),
  jobTitle: z.string().trim().max(120).optional(),
  jobDescription: z.string().trim().max(4000).optional(),
});

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return fail("Please log in again.", 401);

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail("Check your interview settings and try again.", 400);
  const input = body.data;

  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, extracted_text")
    .eq("id", input.resumeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!resume) return fail("Resume not found.", 404);
  if (!resume.extracted_text || resume.extracted_text.length < MIN_CHARS) {
    return fail("This resume has no readable text to build questions from.", 422);
  }

  const quota = await consumeAiQuota(supabase, "interview_generate");
  if (!quota.ok) {
    return quota.reason === "limit"
      ? fail("You have reached your AI usage limit for now. Please try again later.", 429)
      : fail("Could not check usage limits. Please try again.", 500);
  }

  let questions;
  try {
    questions = await generateInterviewQuestions({
      resumeText: resume.extracted_text,
      type: input.type,
      difficulty: input.difficulty,
      count: input.count,
      jobTitle: input.jobTitle || undefined,
      jobDescription: input.jobDescription || undefined,
    });
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("unknown");
    console.error("Question generation failed:", err.code); // never log resume content
    return fail(err.message, err.status);
  }

  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .insert({
      resume_id: resume.id,
      interview_type: input.type,
      difficulty: input.difficulty,
      question_count: input.count,
      job_title: input.jobTitle || null,
      job_description: input.jobDescription || null,
    })
    .select("id")
    .single();
  if (interviewError || !interview) return fail("Could not create the interview. Please try again.", 500);

  const { error: questionsError } = await supabase.from("interview_questions").insert(
    questions.map((q, i) => ({
      interview_id: interview.id,
      question_text: q.text,
      category: q.category,
      difficulty: input.difficulty,
      question_order: i + 1,
    }))
  );
  if (questionsError) {
    await supabase.from("interviews").delete().eq("id", interview.id); // no half-built interview
    return fail("Could not save the questions. Please try again.", 500);
  }

  return NextResponse.json({ id: interview.id }, { status: 201 });
}