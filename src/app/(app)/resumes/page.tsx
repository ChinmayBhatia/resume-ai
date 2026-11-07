import { PageHeader } from "@/components/shared/page-header";
import { ResumeManager } from "@/components/resumes/resume-manager";
import { listResumes } from "@/lib/data/resumes";
import { maxUploadMb } from "@/lib/resume/validate";

export default async function ResumesPage() {
  const resumes = await listResumes();
  return (
    <>
      <PageHeader title="Resumes" description="Upload, download, delete, analyze or practice with a resume." />
      <ResumeManager initial={resumes} maxMb={maxUploadMb()} />
    </>
  );
}