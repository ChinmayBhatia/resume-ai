import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return fail("Please log in again.", 401);

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return fail("Resume not found.", 404);

  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("storage_path, filename")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!resume) return fail("Resume not found.", 404);

  // The link expires after 60 seconds and is only created for the file's owner.
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(resume.storage_path, 60, { download: resume.filename });
  if (error || !data) return fail("Could not create the download link.", 500);

  return NextResponse.json({ url: data.signedUrl });
}