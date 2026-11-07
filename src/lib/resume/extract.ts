import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import type { Kind } from "./validate";

const MAX_CHARS = 60_000;
export const MIN_CHARS = 50;

export async function extractResumeText(
  kind: Kind,
  bytes: Uint8Array
): Promise<string> {
  let raw = "";

  if (kind.ext === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    raw = text;
  } else {
    const { value } = await mammoth.extractRawText({
      buffer: Buffer.from(bytes),
    });
    raw = value;
  }

  return raw
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CHARS);
}