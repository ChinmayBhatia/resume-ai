import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { evaluateInterviewAnswers } from "@/lib/ai/evaluate-answers";
import { AiError } from "@/lib/ai/errors";
import type { StoredEvaluation } from "@/lib/ai/evaluation-schemas";
import { consumeAiQuota } from "@/lib/rate-limit";

export const maxDuration = 60;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
const round = (n: number) => Math.round(Math.min(100, Math.max(0, n)));

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return fail("Please log in again.", 401);

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return fail("Interview not found.", 404);

  const supabase = await createClient();
  const { data: interview } = await supabase
    .from("interviews")
    .select("id, resume_id, interview_type, difficulty, job_title, job_description, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!interview) return fail("Interview not found.", 404);

  // Already evaluated (double submit, or a retry after a half-finished attempt): just finish up.
  const { data: existing } = await supabase
    .from("interview_reports")
    .select("id")
    .eq("interview_id", id)
    .maybeSingle();
  if (existing) {
    if (interview.status !== "completed") {
      await supabase.from("interviews").update({ status: "completed" }).eq("id", id).eq("user_id", user.id);
    }
    return NextResponse.json({ ok: true });
  }

  const [{ data: questions }, { data: answers }, { data: resume }] = await Promise.all([
    supabase.from("interview_questions").select("id, question_text, category, question_order")
      .eq("interview_id", id).order("question_order", { ascending: true }),
    supabase.from("interview_answers").select("question_id, answer_text").eq("interview_id", id),
    supabase.from("resumes").select("extracted_text").eq("id", interview.resume_id).maybeSingle(),
  ]);
  if (!questions || questions.length === 0) return fail("This interview has no questions.", 422);

  const answerMap = new Map<string, string>();
  for (const a of answers ?? []) {
    const text = a.answer_text.trim();
    if (text) answerMap.set(a.question_id, text);
  }
  if (answerMap.size === 0) return fail("Answer at least one question before submitting.", 400);

  const quota = await consumeAiQuota(supabase, "interview_evaluate");
  if (!quota.ok) {
    return quota.reason === "limit"
      ? fail("You have reached your AI usage limit for now. Your answers are saved. Please submit again later.", 429)
      : fail("Could not check usage limits. Please try again.", 500);
  }

  let result;
  try {
    result = await evaluateInterviewAnswers({
      resumeText: resume?.extracted_text ?? "",
      type: interview.interview_type,
      difficulty: interview.difficulty,
      jobTitle: interview.job_title ?? undefined,
      jobDescription: interview.job_description ?? undefined,
      items: questions
        .filter((q) => answerMap.has(q.id))
        .map((q) => ({
          number: q.question_order,
          category: q.category,
          question: q.question_text,
          answer: answerMap.get(q.id) as string,
        })),
    });
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("unknown");
    console.error("Interview evaluation failed:", err.code); // never log answers
    return fail(`${err.message} Your answers are saved, so you can submit again.`, err.status);
  }

  const byNumber = new Map(result.questions.map((q) => [q.number, q]));
  const feedback = questions.map((q) => {
    const answer = answerMap.get(q.id) ?? "";
    const ev = answer ? byNumber.get(q.question_order) : undefined;
    if (!ev) {
      return {
        questionId: q.id, score: 0, answer: "",
        explanation: "No answer was submitted for this question, so it scores zero.",
        missingPoints: [] as string[], improvedAnswer: "",
      };
    }
    return {
      questionId: q.id, score: round(ev.score), answer,
      explanation: ev.explanation, missingPoints: ev.missingPoints, improvedAnswer: ev.improvedAnswer,
    };
  });

  // The server computes the overall score. Unanswered questions count as zero.
  const overall = round(feedback.reduce((sum, f) => sum + f.score, 0) / feedback.length);

  const evaluation: StoredEvaluation = {
    subscores: [
      { label: "Relevance", value: round(result.subscores.relevance) },
      { label: "Technical accuracy", value: round(result.subscores.technicalAccuracy) },
      { label: "Communication", value: round(result.subscores.communication) },
      { label: "Structure", value: round(result.subscores.structure) },
    ],
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    topics: result.topics,
    feedback,
  };

  const { error: reportError } = await supabase
    .from("interview_reports")
    .insert({ interview_id: id, overall_score: overall, evaluation_json: evaluation });
  if (reportError && reportError.code !== "23505") { // 23505 = a parallel request already saved it
    return fail("The evaluation finished but could not be saved. Please submit again.", 500);
  }

  const { error: statusError } = await supabase
    .from("interviews")
    .update({ status: "completed" })
    .eq("id", id)
    .eq("user_id", user.id);
  if (statusError) return fail("Your report was saved, but the interview could not be marked complete. Press Submit again.", 500);

  return NextResponse.json({ ok: true });
}