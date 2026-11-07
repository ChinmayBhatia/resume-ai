import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { analyzeResume } from "@/lib/ai/analyze-resume";
import { AiError } from "@/lib/ai/errors";
import { consumeAiQuota } from "@/lib/rate-limit";
import { ATS_COLUMNS, rowToReport, type AtsRow } from "@/lib/data/ats";
import { MIN_CHARS } from "@/lib/resume/extract";

export const maxDuration = 60; // Gemini can take a while; check your Vercel plan's limit

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
const bodySchema = z.object({ resumeId: z.uuid() });

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return fail("Please log in again.", 401);

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail("Choose a resume to analyze.", 400);

  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, extracted_text")
    .eq("id", body.data.resumeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!resume) return fail("Resume not found.", 404);
  if (!resume.extracted_text || resume.extracted_text.length < MIN_CHARS) {
    return fail("This resume has no readable text to analyze.", 422);
  }

  const quota = await consumeAiQuota(supabase, "ats_analyze");
  if (!quota.ok) {
    return quota.reason === "limit"
      ? fail("You have reached your analysis limit for now. Please try again later.", 429)
      : fail("Could not check usage limits. Please try again.", 500);
  }

  let analysis;
  try {
    analysis = await analyzeResume(resume.extracted_text);
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("unknown");
    console.error("ATS analysis failed:", err.code); // never log resume content
    return fail(err.message, err.status);
  }

  const { data, error } = await supabase
    .from("ats_reports")
    .insert({ resume_id: resume.id, score: analysis.score, analysis_json: analysis })
    .select(ATS_COLUMNS)
    .single();
  if (error || !data) return fail("The analysis finished but could not be saved. Please try again.", 500);

  const report = rowToReport(data as AtsRow);
  if (!report) return fail("Could not read the saved report.", 500);
  return NextResponse.json({ report }, { status: 201 });
}