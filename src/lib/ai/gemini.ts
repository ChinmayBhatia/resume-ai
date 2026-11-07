import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AiError } from "./errors";

let client: GoogleGenAI | null = null;
function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiError("config");
  client ??= new GoogleGenAI({ apiKey: key });
  return client;
}
function getModel() {
  const model = process.env.GEMINI_MODEL;
  if (!model) throw new AiError("config");
  return model;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function classify(e: unknown): AiError {
  if (e instanceof AiError) return e;
  const err = e as { status?: number; name?: string };
  if (err?.name === "TimeoutError" || err?.name === "AbortError") return new AiError("timeout");
  if (err?.status === 429) return new AiError("rate_limited");
  if (err?.status === 400 || err?.status === 401 || err?.status === 403) return new AiError("config");
  if (typeof err?.status === "number" && err.status >= 500) return new AiError("unavailable");
  return new AiError("unknown");
}

// Calls Gemini, forces JSON output, and validates it against a Zod schema.
// Retries once on transient errors or unusable output, within one total time budget.
export async function generateJson<S extends z.ZodType>(opts: {
  system: string;
  prompt: string;
  schema: S;
  maxOutputTokens?: number;
  timeoutMs?: number;
}): Promise<z.infer<S>> {
  const ai = getClient();
  const model = getModel();
  const jsonSchema = z.toJSONSchema(opts.schema);
  const budget = opts.timeoutMs ?? 50_000;
  const started = Date.now();
  let last = new AiError("unknown");

  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = budget - (Date.now() - started);
    if (remaining < 8_000) break; // not enough time for a useful retry

    try {
      const res = await ai.models.generateContent({
        model,
        contents: opts.prompt,
        config: {
          systemInstruction: opts.system,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
          temperature: 0.3,
          maxOutputTokens: opts.maxOutputTokens ?? 8192,
          abortSignal: AbortSignal.timeout(remaining),
        },
      });

      if (res.promptFeedback?.blockReason) throw new AiError("blocked");
      const text = res.text?.trim();
      if (!text) { last = new AiError("empty"); continue; }

      let json: unknown;
      try { json = JSON.parse(text); } catch { last = new AiError("invalid"); continue; }

      const parsed = opts.schema.safeParse(json);
      if (!parsed.success) { last = new AiError("invalid"); continue; }
      return parsed.data;
    } catch (e) {
      last = classify(e);
      const retryable = last.code === "rate_limited" || last.code === "unavailable";
      if (retryable && attempt === 0) { await sleep(1500); continue; }
      throw last;
    }
  }
  throw last;
}
