import type { Resume } from "@/types";

export function ResumeSelect({
  resumes, value, onChange, id,
}: { resumes: Resume[]; value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {resumes.map((r) => (
        <option key={r.id} value={r.id}>{r.filename}</option>
      ))}
    </select>
  );
}