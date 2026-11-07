import { createClient } from "@/lib/supabase/server";
import { atsAnalysisSchema } from "@/lib/ai/schemas";
import type { AtsReport } from "@/types";

export type AtsRow = {
  id: string;
  resume_id: string;
  score: number;
  analysis_json: unknown;
  created_at: string;
};

export const ATS_COLUMNS = "id, resume_id, score, analysis_json, created_at";

// Re-validates stored JSON, so a malformed old row can never crash the page.
export function rowToReport(r: AtsRow): AtsReport | null {
  const parsed = atsAnalysisSchema.safeParse(r.analysis_json);
  if (!parsed.success) return null;
  return { ...parsed.data, id: r.id, resumeId: r.resume_id, score: r.score, createdAt: r.created_at };
}

export async function listAtsReports(limit = 50): Promise<AtsReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ats_reports")
    .select(ATS_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Could not load reports.");
  return (data as AtsRow[]).map(rowToReport).filter((r): r is AtsReport => r !== null);
}