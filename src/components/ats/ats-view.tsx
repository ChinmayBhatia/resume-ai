"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ResumeSelect } from "@/components/shared/resume-select";
import { ReportView } from "./report-view";
import { formatDate, scoreTone } from "@/lib/format";
import type { AtsReport, Resume } from "@/types";

export function AtsView({
  resumes, reports, defaultResumeId,
}: { resumes: Resume[]; reports: AtsReport[]; defaultResumeId?: string }) {
  const router = useRouter();
  const [resumeId, setResumeId] = useState(defaultResumeId ?? resumes[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<AtsReport | null>(null);
  const [history, setHistory] = useState(reports);
  const [toDelete, setToDelete] = useState<AtsReport | null>(null);

  if (resumes.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
        Upload a resume first.{" "}
        <Link href="/resumes" className="text-primary underline-offset-4 hover:underline">Go to Resumes</Link>
      </p>
    );
  }

  async function analyze() {
    setLoading(true);
    setActive(null);
    try {
      const res = await fetch("/api/ats/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });
      const body = (await res.json().catch(() => null)) as { report?: AtsReport; error?: string } | null;
      if (!res.ok || !body?.report) throw new Error(body?.error ?? "Analysis failed. Please try again.");
      const report = body.report;
      setActive(report);
      setHistory((prev) => [report, ...prev]);
      toast.success("Analysis complete.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    const t = toast.loading("Deleting report…");
    try {
      const res = await fetch(`/api/ats/${target.id}`, { method: "DELETE" });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "Delete failed.");
      setHistory((prev) => prev.filter((r) => r.id !== target.id));
      setActive((a) => (a?.id === target.id ? null : a));
      toast.success("Report deleted.", { id: t });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.", { id: t });
    }
  }

  const nameOf = (id: string) => resumes.find((r) => r.id === id)?.filename ?? "Deleted resume";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-6">
        <div className="min-w-64 flex-1 space-y-1.5">
          <Label htmlFor="resume">Resume</Label>
          <ResumeSelect id="resume" resumes={resumes} value={resumeId} onChange={setResumeId} />
        </div>
        <Button onClick={analyze} disabled={loading}>{loading ? "Analyzing…" : "Analyze resume"}</Button>
      </div>

      {loading && (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <p className="text-sm text-muted-foreground">Reading your resume. This usually takes 10 to 30 seconds.</p>
          <div className="h-36 animate-pulse rounded-xl bg-muted" />
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
        </div>
      )}

      {active && <ReportView report={active} />}

      <section>
        <h2 className="mb-3 font-serif text-2xl">Previous reports</h2>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            No analyses yet. Run your first one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {history.map((r) => (
              <li key={r.id} className="flex items-center gap-1 rounded-xl border bg-card pr-2 transition-colors hover:bg-muted">
                <button
                  onClick={() => { setActive(r); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="flex min-w-0 flex-1 items-center justify-between px-4 py-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{nameOf(r.resumeId)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                  </span>
                  <span className={`font-serif text-2xl ${scoreTone(r.score)}`}>{r.score}</span>
                </button>
                <Button size="icon" variant="ghost" aria-label="Delete report" onClick={() => setToDelete(r)}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              The analysis will be permanently deleted. Your resume is not affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}