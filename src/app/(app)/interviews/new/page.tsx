import { PageHeader } from "@/components/shared/page-header";
import { InterviewSetup } from "@/components/interview/interview-setup";
import { listResumes } from "@/lib/data/resumes";

export default async function NewInterviewPage({
  searchParams,
}: { searchParams: Promise<{ resume?: string }> }) {
  const [{ resume }, resumes] = await Promise.all([searchParams, listResumes()]);
  return (
    <>
      <PageHeader title="Mock Interview" description="Questions are generated from your resume." />
      <InterviewSetup resumes={resumes} defaultResumeId={resume} />
    </>
  );
}