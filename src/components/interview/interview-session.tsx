
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";
import type { Question } from "@/types";

type Answer = {
  text: string;
  method: "text" | "voice";
};

type SaveState = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;
const MAX_ANSWER = 5000;
const EMPTY: Answer = { text: "", method: "text" };

export function InterviewSession({
  id,
  questions,
  initialAnswers,
}: {
  id: string;
  questions: Question[];
  initialAnswers: Record<string, Answer>;
}) {
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Refs hold the latest values so the debounced and queued saves never use stale data.
  const answersRef = useRef(initialAnswers);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const dirty = useRef<Set<string>>(new Set());
  const chain = useRef<Promise<void>>(Promise.resolve());
  const speechTarget = useRef(questions[0].id);

  const q = questions[index];
  const current = answers[q.id] ?? EMPTY;

  const answeredCount = questions.filter(
    (x) => answers[x.id]?.text.trim()
  ).length;

  // Saves run one at a time, in order, so an older save can never overwrite a newer one.
  const persist = useCallback(
    (qid: string) => {
      chain.current = chain.current.then(async () => {
        if (!dirty.current.has(qid)) return;

        const a = answersRef.current[qid] ?? EMPTY;

        dirty.current.delete(qid);
        setSaveState("saving");

        try {
          const res = await fetch(`/api/interviews/${id}/answers`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              questionId: qid,
              text: a.text,
              method: a.method,
            }),
          });

          if (!res.ok) throw new Error("save failed");

          if (dirty.current.size === 0) {
            setSaveState("saved");
          }
        } catch {
          dirty.current.add(qid);
          setSaveState("error");
        }
      });

      return chain.current;
    },
    [id]
  );

  const schedule = useCallback(
    (qid: string) => {
      dirty.current.add(qid);
      setSaveState("saving");

      clearTimeout(timers.current[qid]);

      timers.current[qid] = setTimeout(
        () => void persist(qid),
        DEBOUNCE_MS
      );
    },
    [persist]
  );

  // Saves everything pending right now.
  // Returns true if nothing is left unsaved.
  const flush = useCallback(async () => {
    Object.values(timers.current).forEach(clearTimeout);

    for (const qid of [...dirty.current]) {
      void persist(qid);
    }

    await chain.current;

    return dirty.current.size === 0;
  }, [persist]);

  const update = useCallback(
    (qid: string, fn: (old: Answer) => Answer) => {
      const next = fn(answersRef.current[qid] ?? EMPTY);

      answersRef.current = {
        ...answersRef.current,
        [qid]: next,
      };

      setAnswers(answersRef.current);
      schedule(qid);
    },
    [schedule]
  );

  // Voice appends to whatever is already typed, so nothing is lost.
  const speech = useSpeechRecognition((chunk) => {
    if (!chunk) return;

    update(speechTarget.current, (old) => ({
      text: (
        old.text
          ? `${old.text.trimEnd()} ${chunk}`
          : chunk
      ).slice(0, MAX_ANSWER),
      method: "voice",
    }));
  });

  // Warn before closing the tab with unsaved answers, and save on leaving the page.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current.size > 0) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    const pending = dirty.current;
    const timerMap = timers.current;

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);

      Object.values(timerMap).forEach(clearTimeout);

      [...pending].forEach((qid) => void persist(qid));
    };
  }, [persist]);

  function startDictation() {
    speechTarget.current = q.id;
    speech.start();
  }

  function go(next: number) {
    if (speech.listening) speech.stop();

    void persist(q.id);

    setIndex(
      Math.min(
        Math.max(next, 0),
        questions.length - 1
      )
    );
  }

  async function saveNow() {
    const ok = await flush();

    if (ok) {
      toast.success("Answer saved");
    } else {
      toast.error(
        "Could not save. Check your connection and try again."
      );
    }
  }

  // Submit answers for real AI evaluation.
  async function submit() {
    if (speech.listening) speech.stop();

    setSubmitting(true);

    const t = toast.loading(
      "Evaluating your answers. This can take up to a minute…"
    );

    try {
      const saved = await flush();

      if (!saved) {
        throw new Error(
          "Some answers could not be saved. Check your connection and try again."
        );
      }

      const res = await fetch(
        `/api/interviews/${id}/submit`,
        {
          method: "POST",
        }
      );

      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        throw new Error(
          body?.error ?? "Evaluation failed. Please try again."
        );
      }

      toast.success("Evaluation complete.", {
        id: t,
      });

      router.push(`/interviews/${id}/results`);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Evaluation failed.",
        {
          id: t,
        }
      );

      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {answeredCount} of {questions.length} answered
          </span>

          <span
            aria-live="polite"
            className={cn(
              saveState === "error" && "text-destructive"
            )}
          >
            {saveState === "saving" && "Saving…"}

            {saveState === "saved" && "All changes saved"}

            {saveState === "error" && (
              <>
                Not saved.{" "}
                <button
                  className="underline underline-offset-2"
                  onClick={() => void saveNow()}
                >
                  Retry
                </button>
              </>
            )}
          </span>
        </div>

        <Progress
          value={(answeredCount / questions.length) * 100}
        />
      </div>

      <div className="space-y-5 rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Question {index + 1} of {questions.length}
          </span>

          <Badge variant="secondary">
            {q.category}
          </Badge>

          <Badge variant="outline">
            {q.difficulty}
          </Badge>
        </div>

        <h2 className="font-serif text-3xl leading-snug">
          {q.text}
        </h2>

        <Textarea
          rows={9}
          value={current.text}
          maxLength={MAX_ANSWER}
          onChange={(e) =>
            update(q.id, (old) => ({
              text: e.target.value,
              method: old.method,
            }))
          }
          placeholder="Type your answer, or use the microphone to dictate."
          aria-label="Your answer"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="italic">
            {speech.interim && `Hearing: ${speech.interim}`}
          </span>

          <span>
            {current.text.length}/{MAX_ANSWER}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {speech.supported ? (
            <Button
              type="button"
              variant={speech.listening ? "default" : "outline"}
              onClick={
                speech.listening
                  ? speech.stop
                  : startDictation
              }
              className={cn(
                speech.listening && "animate-pulse"
              )}
            >
              {speech.listening ? (
                <>
                  <Square className="size-4" />
                  Stop dictation
                </>
              ) : (
                <>
                  <Mic className="size-4" />
                  Dictate answer
                </>
              )}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Voice input is not supported in this browser.
              You can keep typing.
            </p>
          )}

          {speech.listening && (
            <span className="text-sm text-primary">
              Listening… speak now
            </span>
          )}

          <Button
            type="button"
            variant="ghost"
            className="ml-auto"
            onClick={() => void saveNow()}
          >
            Save answer
          </Button>
        </div>

        {speech.error && (
          <p role="alert" className="text-sm text-destructive">
            {speech.error}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Answers save automatically. Dictation uses your browser&apos;s
          speech recognition, which may process audio through your
          browser provider&apos;s service. This app stores only the
          text, and you can edit it before moving on.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => go(index - 1)}
          disabled={index === 0}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        <div className="flex flex-wrap justify-center gap-1.5">
          {questions.map((x, i) => (
            <button
              key={x.id}
              onClick={() => go(i)}
              aria-label={`Go to question ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "size-8 rounded-md border text-xs transition-colors",
                i === index &&
                  "border-primary bg-primary text-primary-foreground",
                i !== index &&
                  answers[x.id]?.text.trim() &&
                  "bg-muted text-foreground",
                i !== index &&
                  !answers[x.id]?.text.trim() &&
                  "text-muted-foreground hover:bg-muted"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {index < questions.length - 1 ? (
          <Button onClick={() => go(index + 1)}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={() => setConfirmOpen(true)}>
            Submit interview
          </Button>
        )}
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Submit for evaluation?
            </AlertDialogTitle>

            <AlertDialogDescription>
              You answered {answeredCount} of {questions.length} questions.

              {answeredCount < questions.length &&
                " Unanswered questions will score zero."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Keep editing
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              {submitting ? "Evaluating…" : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
