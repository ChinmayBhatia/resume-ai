import { z } from "zod";

const items = z.array(z.string());
const pct = z.number().min(0).max(100);

// What Gemini must return. `expected` is the list of question numbers it was given.
export const evaluationSchema = (expected: number[]) =>
  z
    .object({
      questions: z.array(
        z.object({
          number: z.number(),
          score: pct,
          explanation: z.string(),
          missingPoints: items,
          improvedAnswer: z.string(),
        })
      ),
      subscores: z.object({
        relevance: pct,
        technicalAccuracy: pct,
        communication: pct,
        structure: pct,
      }),
      strengths: items,
      weaknesses: items,
      topics: items,
    })
    .superRefine((v, ctx) => {
      const got = v.questions.map((q) => q.number).sort((a, b) => a - b).join(",");
      if (got !== [...expected].sort((a, b) => a - b).join(",")) {
        ctx.addIssue({ code: "custom", message: "Question numbers do not match." });
      }
    });

// What we store in interview_reports.evaluation_json.
export const storedEvaluationSchema = z.object({
  subscores: z.array(z.object({ label: z.string(), value: z.number() })),
  strengths: items,
  weaknesses: items,
  topics: items,
  feedback: z.array(
    z.object({
      questionId: z.string(),
      score: z.number(),
      answer: z.string(),
      explanation: z.string(),
      missingPoints: items,
      improvedAnswer: z.string(),
    })
  ),
});

export type StoredEvaluation = z.infer<typeof storedEvaluationSchema>;