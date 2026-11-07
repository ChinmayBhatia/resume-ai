import { notFound, redirect } from "next/navigation";
import { InterviewSession } from "@/components/interview/interview-session";
import { getInterview } from "@/lib/data/interviews";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const interview = await getInterview(id);
  if (!interview || interview.questions.length === 0) notFound();
  if (interview.status === "completed") redirect(`/interviews/${id}/results`);
  return <InterviewSession id={interview.id} questions={interview.questions} initialAnswers={interview.answers} />;
}