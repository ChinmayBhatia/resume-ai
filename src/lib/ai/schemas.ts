import { z } from "zod";

// ---------- ATS analysis ----------
const items = z.array(z.string());

export const atsAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  skills: items,
  strengths: items,
  weaknesses: items,
  missingKeywords: items,
  education: z.string(),
  experience: z.string(),
  projectTips: items,
  formatting: items,
  recommendations: items,
});

export type AtsAnalysis = z.infer<typeof atsAnalysisSchema>;

// ---------- Interview questions ----------
export const QUESTION_CATEGORIES = [
  "Technical", "Project", "Problem-solving", "Behavioral", "HR", "Experience",
] as const;

// Difficulty is not asked of the model. The server stamps the user's chosen level on every question.
export const questionsSchema = (count: number) =>
  z.object({
    questions: z
      .array(z.object({ text: z.string(), category: z.enum(QUESTION_CATEGORIES) }))
      .min(count)
      .max(count + 3),
  });