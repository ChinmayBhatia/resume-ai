import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { storedEvaluationSchema } from "@/lib/ai/evaluation-schemas";
import type { Difficulty, InterviewReport, InterviewType } from "@/types";

// Row Level Security means this only returns the signed-in user's own interview.
export async function getInterviewReport(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();

  const { data: interview } = await supabase
    .from("interviews")
    .select("id, interview_type, difficulty, job_title, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!interview) return null;

  const [{ data: row }, { data: qs }] = await Promise.all([
    supabase.from("interview_reports").select("overall_score, evaluation_json").eq("interview_id", id).maybeSingle(),
    supabase.from("interview_questions").select("id, question_text, category, question_order")
      .eq("interview_id", id).order("question_order", { ascending: true }),
  ]);

  const meta = {
    type: interview.interview_type as InterviewType,
    difficulty: interview.difficulty as Difficulty,
    jobTitle: (interview.job_title as string | null) ?? null,
    createdAt: interview.created_at as string,
  };
  const questions = (qs ?? []).map((q) => ({ id: q.id as string, text: q.question_text as string, category: q.category as string }));

  if (!row) return { meta, questions, report: null };

  const parsed = storedEvaluationSchema.safeParse(row.evaluation_json);
  if (!parsed.success) throw new Error("This report could not be read.");

  const report: InterviewReport = { interviewId: id, overallScore: row.overall_score, ...parsed.data };
  return { meta, questions, report };
}