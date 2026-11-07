import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return fail("Please log in again.", 401);

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return fail("Interview not found.", 404);

  const supabase = await createClient();
  // Questions, answers and the report are removed by the database cascade.
  const { data, error } = await supabase
    .from("interviews")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error) return fail("Could not delete the interview. Please try again.", 500);
  if (!data || data.length === 0) return fail("Interview not found.", 404);

  return NextResponse.json({ ok: true });
}