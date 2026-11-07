import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Notice | Resume AI" };

const CONTACT = "";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-16">
      <div>
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
        <h1 className="mt-4 font-serif text-5xl">Privacy Notice</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Resume AI is a personal portfolio project. Please read this before uploading a resume.
        </p>
      </div>

      <Section title="What we store">
        <p>
          Your name and email; the resume files you upload and the text extracted from them; the ATS analyses and
          interview questions, answers and reports generated for you; and a log of AI requests (the time and type of
          request, with no content) used to apply usage limits.
        </p>
      </Section>

      <Section title="Who processes your data">
        <p>
          Accounts, the database and file storage run on Supabase. The website runs on Vercel. To analyze your resume,
          write interview questions and evaluate your answers, the text of your resume, any job title and description
          you enter, and your interview answers are sent to Google through the Gemini API. Google processes that text
          under its own terms, which differ between free and paid usage, so please read Google&apos;s current Gemini API
          terms before uploading sensitive information.
        </p>
      </Section>

      <Section title="Voice input">
        <p>
          Dictation uses your browser&apos;s built-in speech recognition. Depending on your browser, your audio may be
          processed by the browser provider&apos;s service. This app receives only the resulting text, never the audio.
          Voice input is optional, and you can always type.
        </p>
      </Section>

      <Section title="Who can see your data">
        <p>
          Your resumes and reports are private to your account. Access rules in the database and storage prevent other
          users from reading them, and downloads use short-lived private links. The person who runs this service can
          technically access the database, and does not read your content except to fix a problem you report.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Until you delete it. You can delete individual resumes, analyses and interviews at any time. Deleting a
          resume also deletes its analyses and interviews. In Settings you can delete your whole account, which erases
          everything listed above.
        </p>
      </Section>

      <Section title="AI limitations">
        <p>
          ATS scores and interview evaluations are AI-generated estimates and guidance. They are not guarantees and do
          not predict the result of any real application or interview.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions or requests about your data:{" "}
          <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>
        </p>
      </Section>
    </main>
  );
}