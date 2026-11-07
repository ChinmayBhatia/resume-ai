import { createClient } from "@/lib/supabase/server";
import { RESUME_COLUMNS, rowToResume } from "@/lib/resume/map";

// Row Level Security returns only the signed-in user's rows.
export async function listResumes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select(RESUME_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load resumes.");
  return (data ?? []).map(rowToResume);
}