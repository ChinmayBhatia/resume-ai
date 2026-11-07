import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/shared/score-ring";
import type { AtsReport } from "@/types";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <h3 className="mb-3 font-serif text-2xl">{title}</h3>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
      {items.map((i) => <li key={i}>{i}</li>)}
    </ul>
  );
}

export function ReportView({ report }: { report: AtsReport }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6 rounded-xl border bg-card p-6">
        <ScoreRing value={report.score} size={128} />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-3xl">ATS compatibility estimate</h2>
          <p className="mt-1 text-sm text-muted-foreground">{report.summary}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            This score is an AI-generated estimate, not a guaranteed score from any company&apos;s real ATS.
          </p>
        </div>
      </div>

      <Block title="Skills identified">
        <div className="flex flex-wrap gap-2">
          {report.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
        </div>
      </Block>

      <div className="grid gap-4 md:grid-cols-2">
        <Block title="Strengths"><List items={report.strengths} /></Block>
        <Block title="Weaknesses"><List items={report.weaknesses} /></Block>
      </div>

      <Block title="Missing or recommended keywords">
        <div className="flex flex-wrap gap-2">
          {report.missingKeywords.map((k) => <Badge key={k} variant="outline">{k}</Badge>)}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Only add keywords that truthfully describe your experience.</p>
      </Block>

      <div className="grid gap-4 md:grid-cols-2">
        <Block title="Education"><p className="text-sm text-muted-foreground">{report.education}</p></Block>
        <Block title="Experience"><p className="text-sm text-muted-foreground">{report.experience}</p></Block>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Block title="Project descriptions"><List items={report.projectTips} /></Block>
        <Block title="Formatting and readability"><List items={report.formatting} /></Block>
      </div>

      <Block title="Recommendations"><List items={report.recommendations} /></Block>
    </div>
  );
}