import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return fail("Please log in again.", 401);

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return fail("Resume not found.", 404);

  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!resume) return fail("Resume not found.", 404);

  // File first, then the row. If the row delete fails, the user can retry,
  // because removing an already-missing file is not an error.
  const { error: fileError } = await supabase.storage.from("resumes").remove([resume.storage_path]);
  if (fileError) return fail("Could not delete the file. Please try again.", 500);

  const { error: rowError } = await supabase.from("resumes").delete().eq("id", id).eq("user_id", user.id);
  if (rowError) return fail("Could not finish deleting. Please try again.", 500);

  return NextResponse.json({ ok: true });
}