import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

const bodySchema = z.object({
  questionId: z.uuid(),
  text: z.string().max(5000),
  method: z.enum(["text", "voice"]),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return fail("Please log in again.", 401);

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return fail("Interview not found.", 404);

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail("Invalid answer.", 400);
  const { questionId, text, method } = body.data;

  const supabase = await createClient();

  const { data: interview } = await supabase
    .from("interviews")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!interview) return fail("Interview not found.", 404);
  if (interview.status === "completed") return fail("This interview was already submitted.", 409);

  // The question must belong to this interview.
  const { data: question } = await supabase
    .from("interview_questions")
    .select("id")
    .eq("id", questionId)
    .eq("interview_id", id)
    .maybeSingle();
  if (!question) return fail("Question not found.", 404);

  // One row per question: the unique constraint on question_id makes this an upsert.
  const { error } = await supabase.from("interview_answers").upsert(
    {
      interview_id: id,
      question_id: questionId,
      answer_text: text,
      input_method: method,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "question_id" }
  );
  if (error) return fail("Could not save your answer.", 500);

  return NextResponse.json({ ok: true });
}