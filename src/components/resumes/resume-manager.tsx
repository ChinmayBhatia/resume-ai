"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, FileText, Mic, ScanSearch, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Resume } from "@/types";

// XMLHttpRequest, because fetch cannot report upload progress.
function uploadResume(file: File, onProgress: (pct: number) => void): Promise<Resume> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/resumes");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const body = xhr.response as { resume?: Resume; error?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.resume) resolve(body.resume);
      else reject(new Error(body?.error ?? "Upload failed. Please try again."));
    };
    xhr.onerror = () => reject(new Error("Network error. Please try again."));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function ResumeManager({ initial, maxMb }: { initial: Resume[]; maxMb: number }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [toDelete, setToDelete] = useState<Resume | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = progress !== null;

  async function startUpload(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") return toast.error("Only PDF and DOCX files are supported.");
    if (file.size > maxMb * 1024 * 1024) return toast.error(`File is larger than ${maxMb} MB.`);

    setProgress(0);
    try {
      const resume = await uploadResume(file, setProgress);
      setItems((prev) => [resume, ...prev]);
      toast.success("Resume uploaded.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  function onFiles(files: FileList | null) {
    if (files?.[0] && !busy) void startUpload(files[0]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function download(r: Resume) {
    try {
      const res = await fetch(`/api/resumes/${r.id}/download`);
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Download failed.");
      window.location.assign(body.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed.");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    const t = toast.loading(`Deleting ${target.filename}…`);
    try {
      const res = await fetch(`/api/resumes/${target.id}`, { method: "DELETE" });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Delete failed.");
      setItems((prev) => prev.filter((r) => r.id !== target.id));
      toast.success(`Deleted ${target.filename}`, { id: t });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.", { id: t });
    }
  }

  return (
    <div className="space-y-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
        className={cn(
          "rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border"
        )}
      >
        <UploadCloud className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="font-medium">Drag and drop your resume here</p>
        <p className="mb-4 text-sm text-muted-foreground">PDF or DOCX, up to {maxMb} MB</p>
        <input
          ref={inputRef} type="file" className="hidden"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => onFiles(e.target.files)}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={busy}>Choose file</Button>
        {busy && (
          <div className="mx-auto mt-5 max-w-xs space-y-1" aria-live="polite">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">
              {progress === 100 ? "Reading your resume…" : `Uploading… ${progress}%`}
            </p>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No resumes yet. Upload one above to get started.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
              <FileText className="size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.filename}</p>
                <p className="text-xs text-muted-foreground">
                  Uploaded {formatDate(r.uploadedAt)} · {r.sizeKb} KB
                </p>
              </div>
              <Badge variant="secondary">{r.fileType}</Badge>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/ats?resume=${r.id}`}><ScanSearch className="size-4" /> Analyze</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/interviews/new?resume=${r.id}`}><Mic className="size-4" /> Interview</Link>
                </Button>
                <Button size="icon" variant="ghost" aria-label={`Download ${r.filename}`} onClick={() => download(r)}>
                  <Download className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label={`Delete ${r.filename}`} onClick={() => setToDelete(r)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.filename}, its stored file, and its related analyses and interviews will be deleted.
              This cannot be undone.
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