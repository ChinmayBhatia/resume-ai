import { PageHeader } from "@/components/shared/page-header";
import { AtsView } from "@/components/ats/ats-view";
import { listResumes } from "@/lib/data/resumes";
import { listAtsReports } from "@/lib/data/ats";

export default async function AtsPage({
  searchParams,
}: { searchParams: Promise<{ resume?: string }> }) {
  const [{ resume }, resumes, reports] = await Promise.all([searchParams, listResumes(), listAtsReports()]);
  return (
    <>
      <PageHeader title="ATS Analysis" description="Get an AI estimate of how well your resume reads to applicant tracking systems." />
      <AtsView resumes={resumes} reports={reports} defaultResumeId={resume} />
    </>
  );
}