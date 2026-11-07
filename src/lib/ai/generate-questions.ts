import "server-only";
import { AiError } from "./errors";
import { generateJson } from "./gemini";
import { QUESTIONS_SYSTEM, questionsPrompt, type QuestionParams } from "./prompts";
import { questionsSchema } from "./schemas";

export async function generateInterviewQuestions(params: QuestionParams) {
  const { questions } = await generateJson({
    system: QUESTIONS_SYSTEM,
    prompt: questionsPrompt(params),
    schema: questionsSchema(params.count),
  });

  // Drop duplicates, even ones that differ only in punctuation or capitalization.
  const seen = new Set<string>();
  const unique: { text: string; category: string }[] = [];
  for (const q of questions) {
    const text = q.text.trim();
    const key = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push({ text, category: q.category });
  }
  if (unique.length < params.count) throw new AiError("invalid");
  return unique.slice(0, params.count);
}