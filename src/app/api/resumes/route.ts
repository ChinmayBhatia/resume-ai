import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cleanFilename, MAX_RESUMES_PER_USER, maxUploadMb, validateFile } from "@/lib/resume/validate";
import { extractResumeText, MIN_CHARS } from "@/lib/resume/extract";
import { RESUME_COLUMNS, rowToResume, type ResumeRow } from "@/lib/resume/map";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return fail("Please log in again.", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Could not read the upload.", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return fail("No file was uploaded.", 400);

  const maxMb = maxUploadMb();
  if (file.size > maxMb * 1024 * 1024) return fail(`File is larger than ${maxMb} MB.`, 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateFile(file.name, bytes);
  if (!check.ok) return fail(check.error, 400);
  const { kind } = check;

  const supabase = await createClient();

  const { count } = await supabase.from("resumes").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= MAX_RESUMES_PER_USER) {
    return fail(`You can store up to ${MAX_RESUMES_PER_USER} resumes. Delete one first.`, 409);
  }

  let text: string;
  try {
    text = await extractResumeText(kind, bytes);
  } catch {
    return fail("We could not read this file. It may be corrupted or password-protected.", 422);
  }
  if (text.length < MIN_CHARS) {
    return fail("No readable text was found. Scanned or image-only resumes are not supported yet.", 422);
  }

  const id = crypto.randomUUID();
  const path = `${user.id}/${id}.${kind.ext}`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(path, file, { contentType: kind.mime, upsert: false });
  if (uploadError) return fail("Could not store the file. Please try again.", 500);

  const { data, error: insertError } = await supabase
    .from("resumes")
    .insert({
      id,
      filename: cleanFilename(file.name),
      storage_path: path,
      file_type: kind.fileType,
      file_size: file.size,
      extracted_text: text,
    })
    .select(RESUME_COLUMNS)
    .single();

  if (insertError || !data) {
    await supabase.storage.from("resumes").remove([path]); // no orphaned file
    return fail("Could not save the resume. Please try again.", 500);
  }

  return NextResponse.json({ resume: rowToResume(data as ResumeRow) }, { status: 201 });
}