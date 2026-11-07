import "server-only";
import { generateJson } from "./gemini";
import { evaluationSchema } from "./evaluation-schemas";
import { EVAL_SYSTEM, evalPrompt, type EvalParams } from "./evaluation-prompts";

export async function evaluateInterviewAnswers(params: EvalParams) {
  return generateJson({
    system: EVAL_SYSTEM,
    prompt: evalPrompt(params),
    schema: evaluationSchema(params.items.map((i) => i.number)),
    maxOutputTokens: 16_000,
    timeoutMs: 55_000,
  });
}