export type AiErrorCode =
  | "config" | "rate_limited" | "unavailable" | "timeout"
  | "empty" | "invalid" | "blocked" | "unknown";

const MESSAGES: Record<AiErrorCode, string> = {
  config: "The AI service is not configured correctly. Please contact support.",
  rate_limited: "The AI service is busy right now. Please try again in a minute.",
  unavailable: "The AI service is temporarily unavailable. Please try again shortly.",
  timeout: "The analysis took too long. Please try again.",
  empty: "The AI returned no result. Please try again.",
  invalid: "The AI returned an unusable result. Please try again.",
  blocked: "The AI could not process this document.",
  unknown: "Something went wrong during analysis. Please try again.",
};

export class AiError extends Error {
  constructor(public code: AiErrorCode) {
    super(MESSAGES[code]);
  }
  get status() {
    return this.code === "config" ? 500
      : this.code === "rate_limited" ? 503
      : this.code === "timeout" ? 504
      : 502;
  }
}