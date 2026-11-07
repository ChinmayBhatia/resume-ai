"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResumeSelect } from "@/components/shared/resume-select";
import { Segmented } from "@/components/shared/segmented";
import type { Difficulty, InterviewType, Resume } from "@/types";

const MAX_JD = 4000;

export function InterviewSetup({
  resumes,
  defaultResumeId,
}: {
  resumes: Resume[];
  defaultResumeId?: string;
}) {
  const router = useRouter();

  const [resumeId, setResumeId] = useState(defaultResumeId ?? resumes[0]?.id ?? "");
  const [type, setType] = useState<InterviewType>("Mixed");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [count, setCount] = useState<number>(10);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [starting, setStarting] = useState(false);

  if (resumes.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
        Upload a resume to start an interview.{" "}
        <Link href="/resumes" className="text-primary underline-offset-4 hover:underline">
          Go to Resumes
        </Link>
      </p>
    );
  }

  async function start() {
    if (!resumeId) return;
    setStarting(true);
    const t = toast.loading("Writing your questions. This can take up to 30 seconds…");

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          type,
          difficulty,
          count,
          jobTitle: jobTitle.trim() || undefined,
          jobDescription: jobDesc.trim() || undefined,
        }),
      });

      const body = (await res.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;

      if (!res.ok || !body?.id) {
        throw new Error(body?.error ?? "Could not start the interview.");
      }

      toast.success("Your interview is ready.", { id: t });
      router.push(`/interviews/${body.id}`); // button stays disabled until the page changes
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the interview.", { id: t });
      setStarting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Configure your interview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose your resume and customize your practice session.
        </p>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void start();
          }}
          className="space-y-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="resume">Resume</Label>
            <ResumeSelect id="resume" resumes={resumes} value={resumeId} onChange={setResumeId} />
          </div>

          <div className="space-y-1.5">
            <Label>Interview type</Label>
            <div>
              <Segmented<InterviewType>
                label="Interview type"
                value={type}
                onChange={setType}
                options={["Technical", "HR", "Mixed"]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <div>
              <Segmented<Difficulty>
                label="Difficulty"
                value={difficulty}
                onChange={setDifficulty}
                options={["Beginner", "Intermediate", "Advanced"]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Number of questions</Label>
            <div>
              <Segmented<number>
                label="Number of questions"
                value={count}
                onChange={setCount}
                options={[10, 15, 20]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Job title (optional)</Label>
            <Input
              id="title"
              value={jobTitle}
              maxLength={120}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jd">Job description (optional)</Label>
            <Textarea
              id="jd"
              rows={6}
              value={jobDesc}
              maxLength={MAX_JD}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job description to tailor the questions."
            />
            <p className="text-right text-xs text-muted-foreground">
              {jobDesc.length}/{MAX_JD}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={!resumeId || starting}>
            {starting ? "Generating questions…" : "Start mock interview"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}