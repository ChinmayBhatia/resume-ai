
import Link from "next/link";
import { FileText, ScanSearch, Mic, Trophy } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listResumes } from "@/lib/data/resumes";
import { listAtsReports } from "@/lib/data/ats";
import { listInterviews } from "@/lib/data/interviews";
import { formatDate, scoreTone } from "@/lib/format";

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-xs text-muted-foreground">
      {text}
    </p>
  );
}

export default async function DashboardPage() {
  const [resumes, reports, interviews] = await Promise.all([
    listResumes(),
    listAtsReports(3),
    listInterviews(50),
  ]);

  const scored = interviews.filter((i) => i.score !== null);

  const avg = scored.length
    ? Math.round(
        scored.reduce((s, i) => s + (i.score ?? 0), 0) /
          scored.length
      )
    : "—";

  const stats = [
    { label: "Resumes", value: resumes.length, icon: FileText },
    { label: "ATS analyses", value: reports.length, icon: ScanSearch },
    { label: "Interviews", value: interviews.length, icon: Mic },
    { label: "Average interview score", value: avg, icon: Trophy },
  ];

  return (
    <>
      <PageHeader
        title="Welcome back"
        description="Here is where your preparation stands."
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/resumes">Upload resume</Link>
            </Button>

            <Button asChild>
              <Link href="/interviews/new">Start interview</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border bg-card p-5"
          >
            <Icon className="mb-3 size-4 text-primary" />

            <p className="font-serif text-4xl">{value}</p>

            <p className="text-xs text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Resumes */}
        <section>
          <h2 className="mb-3 font-serif text-2xl">
            Recent resumes
          </h2>

          {resumes.length === 0 ? (
            <Empty text="No resumes yet. Upload your first one." />
          ) : (
            <ul className="space-y-2">
              {resumes.slice(0, 3).map((resume) => (
                <li
                  key={resume.id}
                  className="rounded-xl border bg-card px-4 py-3"
                >
                  <p className="truncate text-sm font-medium">
                    {resume.filename}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {formatDate(resume.uploadedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent ATS Analyses */}
        <section>
          <h2 className="mb-3 font-serif text-2xl">
            Recent analyses
          </h2>

          {reports.length === 0 ? (
            <Empty text="No analyses yet. Analyze your first resume." />
          ) : (
            <ul className="space-y-2">
              {reports.map((report) => (
                <li
                  key={report.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {resumes.find(
                        (resume) => resume.id === report.resumeId
                      )?.filename ?? "Deleted resume"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 font-serif text-2xl ${scoreTone(report.score)}`}
                  >
                    {report.score}/100
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/ats"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            View all analyses
          </Link>
        </section>

        {/* Recent Interviews */}
        <section>
          <h2 className="mb-3 font-serif text-2xl">
            Recent interviews
          </h2>

          {interviews.length === 0 ? (
            <Empty text="No interviews yet." />
          ) : (
            <ul className="space-y-2">
              {interviews.slice(0, 3).map((i) => (
                <li key={i.id}>
                  <Link
                    href={
                      i.status === "completed"
                        ? `/interviews/${i.id}/results`
                        : `/interviews/${i.id}`
                    }
                    className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-muted"
                  >
                    <span>
                      <span className="block text-sm font-medium">
                        {i.type} · {i.difficulty}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {formatDate(i.createdAt)}
                      </span>
                    </span>

                    {i.score === null ? (
                      <span className="text-xs text-primary">
                        In progress
                      </span>
                    ) : (
                      <span
                        className={`font-serif text-2xl ${scoreTone(i.score)}`}
                      >
                        {i.score}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/interviews"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            View interviews
          </Link>
        </section>
      </div>
    </>
  );
}
