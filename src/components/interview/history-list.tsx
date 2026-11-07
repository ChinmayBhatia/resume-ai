"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, scoreTone } from "@/lib/format";
import type { InterviewSummary, Resume } from "@/types";

export function HistoryList({ interviews, resumes }: { interviews: InterviewSummary[]; resumes: Resume[] }) {
  const router = useRouter();
  const [items, setItems] = useState(interviews);
  const [filter, setFilter] = useState("all");
  const [toDelete, setToDelete] = useState<InterviewSummary | null>(null);

  const shown = filter === "all" ? items : items.filter((i) => i.resumeId === filter);
  const nameOf = (id: string) => resumes.find((r) => r.id === id)?.filename ?? "Deleted resume";

  async function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    const t = toast.loading("Deleting interview…");
    try {
      const res = await fetch(`/api/interviews/${target.id}`, { method: "DELETE" });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "Delete failed.");
      setItems((prev) => prev.filter((i) => i.id !== target.id));
      toast.success("Interview deleted.", { id: t });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.", { id: t });
    }
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="filter">Filter by resume</Label>
        <select
          id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All resumes</option>
          {resumes.map((r) => <option key={r.id} value={r.id}>{r.filename}</option>)}
        </select>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          {items.length === 0 ? "No interviews yet. Start your first one." : "No interviews for this resume yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((i) => (
            <li key={i.id} className="flex items-center gap-1 rounded-xl border bg-card pr-2 transition-colors hover:bg-muted">
              <Link
                href={i.status === "completed" ? `/interviews/${i.id}/results` : `/interviews/${i.id}`}
                className="flex min-w-0 flex-1 flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{nameOf(i.resumeId)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(i.createdAt)} · {i.questionCount} questions</p>
                </div>
                <Badge variant="secondary">{i.type}</Badge>
                <Badge variant="outline">{i.difficulty}</Badge>
                {i.score === null
                  ? <Badge>In progress</Badge>
                  : <span className={`w-10 text-right font-serif text-2xl ${scoreTone(i.score)}`}>{i.score}</span>}
              </Link>
              <Button size="icon" variant="ghost" aria-label="Delete interview" onClick={() => setToDelete(i)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this interview?</AlertDialogTitle>
            <AlertDialogDescription>
              Its questions, your answers and its report will be permanently deleted. This cannot be undone.
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