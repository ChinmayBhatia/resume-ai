import "server-only";
import { generateJson } from "./gemini";
import { ATS_SYSTEM, atsPrompt } from "./prompts";
import { atsAnalysisSchema, type AtsAnalysis } from "./schemas";

export async function analyzeResume(resumeText: string): Promise<AtsAnalysis> {
  const result = await generateJson({
    system: ATS_SYSTEM,
    prompt: atsPrompt(resumeText),
    schema: atsAnalysisSchema,
  });
  return { ...result, score: Math.round(result.score) };
}