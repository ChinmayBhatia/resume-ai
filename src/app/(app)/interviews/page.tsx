import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { HistoryList } from "@/components/interview/history-list";
import { Button } from "@/components/ui/button";
import { listInterviews } from "@/lib/data/interviews";
import { listResumes } from "@/lib/data/resumes";

export default async function InterviewHistoryPage() {
  const [interviews, resumes] = await Promise.all([listInterviews(), listResumes()]);
  return (
    <>
      <PageHeader
        title="Interview history"
        description="Revisit past sessions and reports."
        action={<Button asChild><Link href="/interviews/new">New interview</Link></Button>}
      />
      <HistoryList interviews={interviews} resumes={resumes} />
    </>
  );
}