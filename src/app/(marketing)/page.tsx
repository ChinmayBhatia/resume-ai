import Link from "next/link";
import {
  ScanSearch, Mic, ShieldCheck, FileUp, Sparkles, LineChart,
  Target, Clock, Lock,
} from "lucide-react";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#benefits", label: "Benefits" },
];

const FEATURES = [
  {
    icon: ScanSearch,
    title: "ATS resume analysis",
    text: "Upload a PDF or DOCX and get a compatibility estimate, keyword gaps, and clear fixes based on what your resume actually says.",
  },
  {
    icon: Mic,
    title: "Personalized mock interviews",
    text: "Questions drawn from your own skills and projects. Answer by typing or speaking, at the difficulty you choose.",
  },
  {
    icon: LineChart,
    title: "Constructive evaluation",
    text: "Per-question scores, what you missed, and a stronger sample answer for each, so every session teaches something.",
  },
];

const STEPS = [
  { icon: FileUp, title: "Upload", text: "Add your resume. It is stored privately, visible only to you." },
  { icon: Sparkles, title: "Analyze", text: "Get your ATS estimate and a list of concrete improvements." },
  { icon: Mic, title: "Practice", text: "Run a mock interview built from your own background." },
  { icon: Target, title: "Improve", text: "Review feedback, revisit past sessions, and track progress." },
];

const BENEFITS = [
  { icon: Target, title: "Grounded in your resume", text: "Feedback never invents skills or achievements you did not list." },
  { icon: Clock, title: "Practice anytime", text: "Short sessions on your schedule, 10 to 20 questions at a time." },
  { icon: Lock, title: "Private by design", text: "Your files and reports are only accessible to your account." },
];

function ScoreRing({ value }: { value: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--l-line)" strokeWidth="5" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="var(--l-red)" strokeWidth="5"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
      />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="landing scroll-smooth bg-[var(--l-bg)] text-[var(--l-text)]">
      {/* HERO */}
      <section className="landing-hero relative overflow-hidden">
        <div className="hero-rays pointer-events-none absolute inset-0" />

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="font-serif text-2xl tracking-wide text-[var(--l-silver)]">Resume AI</span>
          <nav className="hidden gap-10 text-[11px] uppercase tracking-[0.25em] text-[var(--l-muted)] md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-[var(--l-silver)]">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.2em]">
            <Link href="/login" className="text-[var(--l-muted)] transition-colors hover:text-[var(--l-silver)]">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-[var(--l-silver)]/60 px-4 py-2 text-[var(--l-silver)] transition-colors hover:bg-[var(--l-silver)] hover:text-[var(--l-bg)]"
            >
              Sign up
            </Link>
          </div>
        </header>
        <div className="relative z-10 mx-auto h-px max-w-6xl bg-[var(--l-line)]" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-32">
          <div>
            <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-[var(--l-muted)]">
              A quieter way to prepare
            </p>
            <h1 className="font-serif text-6xl font-normal leading-[0.95] text-[var(--l-silver)] md:text-8xl">
              Know your resume.
              <br />
              Own the interview.
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-[var(--l-muted)]">
              Analyze your resume with AI and practice interviews built from your own experience.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-[var(--l-red)] px-7 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
              >
                Get started
              </Link>
              <a
                href="#how"
                className="rounded-full border border-[var(--l-silver)]/50 px-7 py-3 text-xs uppercase tracking-[0.2em] text-[var(--l-silver)] transition-colors hover:bg-[var(--l-silver)]/10"
              >
                Explore
              </a>
            </div>
          </div>

          {/* Sample card: the space where a hero image can go later */}
          <div className="mx-auto w-full max-w-sm rounded-2xl border border-[var(--l-line)] bg-black/20 p-6 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--l-muted)]">Sample report</p>
            <div className="mt-4 flex items-center gap-5">
              <div className="relative">
                <ScoreRing value={82} />
                <span className="absolute inset-0 flex items-center justify-center font-serif text-3xl text-[var(--l-silver)]">
                  82
                </span>
              </div>
              <div>
                <p className="font-serif text-xl text-[var(--l-silver)]">ATS estimate</p>
                <p className="text-xs text-[var(--l-muted)]">AI-generated, not a real ATS score</p>
              </div>
            </div>
            <div className="mt-5 space-y-2 border-t border-[var(--l-line)] pt-4 text-sm text-[var(--l-muted)]">
              <p>+ Clear project impact</p>
              <p>+ Relevant skills section</p>
              <p>− Add measurable results</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[var(--l-muted)]">Features</p>
        <h2 className="mb-12 max-w-xl font-serif text-4xl text-[var(--l-silver)] md:text-5xl">
          Everything you need, nothing you do not.
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-[var(--l-line)] p-7 transition-colors hover:bg-white/[0.03]">
              <Icon className="mb-5 size-6 text-[var(--l-red)]" />
              <h3 className="mb-2 font-serif text-2xl text-[var(--l-silver)]">{title}</h3>
              <p className="text-sm leading-relaxed text-[var(--l-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-[var(--l-line)] bg-black/15">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[var(--l-muted)]">How it works</p>
          <h2 className="mb-12 font-serif text-4xl text-[var(--l-silver)] md:text-5xl">Four simple steps.</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-serif text-3xl text-[var(--l-red)]">0{i + 1}</span>
                  <Icon className="size-4 text-[var(--l-muted)]" />
                </div>
                <h3 className="mb-1 font-serif text-xl text-[var(--l-silver)]">{title}</h3>
                <p className="text-sm leading-relaxed text-[var(--l-muted)]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[var(--l-muted)]">Benefits</p>
        <h2 className="mb-12 font-serif text-4xl text-[var(--l-silver)] md:text-5xl">Built to be trusted.</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="border-t border-[var(--l-line)] pt-6">
              <Icon className="mb-4 size-5 text-[var(--l-red)]" />
              <h3 className="mb-2 font-serif text-2xl text-[var(--l-silver)]">{title}</h3>
              <p className="text-sm leading-relaxed text-[var(--l-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-hero">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <ShieldCheck className="mx-auto mb-6 size-6 text-[var(--l-red)]" />
          <h2 className="font-serif text-5xl text-[var(--l-silver)] md:text-6xl">Ready when you are.</h2>
          <p className="mx-auto mt-4 max-w-md text-[var(--l-muted)]">
            Create a free account and analyze your first resume in minutes.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-full bg-[var(--l-red)] px-8 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
          >
            Create account
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--l-line)] px-6 py-8 text-center text-xs text-[var(--l-muted)]">
        © 2026 Resume AI. ATS scores are AI-generated estimates, not guarantees.
      </footer>
    </div>
  );
}