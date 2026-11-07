import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Difficulty, InterviewSummary, InterviewType, Question } from "@/types";

// Row Level Security means a user can only ever load their own interviews.
export async function getInterview(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();

  const { data: interview } = await supabase
    .from("interviews")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (!interview) return null;

  const [{ data, error }, { data: saved }] = await Promise.all([
    supabase
      .from("interview_questions")
      .select("id, question_text, category, difficulty, question_order")
      .eq("interview_id", id)
      .order("question_order", { ascending: true }),
    supabase
      .from("interview_answers")
      .select("question_id, answer_text, input_method")
      .eq("interview_id", id),
  ]);
  if (error) throw new Error("Could not load questions.");

  const questions: Question[] = (data ?? []).map((q) => ({
    id: q.id,
    text: q.question_text,
    category: q.category,
    difficulty: q.difficulty as Difficulty,
  }));

  const answers: Record<string, { text: string; method: "text" | "voice" }> = {};
  for (const a of saved ?? []) {
    answers[a.question_id] = { text: a.answer_text, method: a.input_method === "voice" ? "voice" : "text" };
  }

  return { id: interview.id as string, status: interview.status as "in_progress" | "completed", questions, answers };
}

type Row = {
  id: string;
  resume_id: string;
  interview_type: string;
  difficulty: string;
  question_count: number;
  status: string;
  created_at: string;
  interview_reports: { overall_score: number } | { overall_score: number }[] | null;
};

export async function listInterviews(limit = 50): Promise<InterviewSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select("id, resume_id, interview_type, difficulty, question_count, status, created_at, interview_reports(overall_score)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Could not load interviews.");

  return ((data ?? []) as unknown as Row[]).map((r) => {
    const rep = Array.isArray(r.interview_reports) ? r.interview_reports[0] : r.interview_reports;
    return {
      id: r.id,
      resumeId: r.resume_id,
      type: r.interview_type as InterviewType,
      difficulty: r.difficulty as Difficulty,
      questionCount: r.question_count,
      status: r.status === "completed" ? "completed" : "in_progress",
      score: rep?.overall_score ?? null,
      createdAt: r.created_at,
    };
  });
}