import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return fail("Please log in again.", 401);

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return fail("Report not found.", 404);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ats_reports")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error) return fail("Could not delete the report. Please try again.", 500);
  if (!data || data.length === 0) return fail("Report not found.", 404);

  return NextResponse.json({ ok: true });
}