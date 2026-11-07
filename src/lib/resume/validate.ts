export const MAX_RESUMES_PER_USER = 20;

export function maxUploadMb() {
  const n = Number(process.env.MAX_UPLOAD_MB);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

export type Kind = { ext: "pdf" | "docx"; fileType: "PDF" | "DOCX"; mime: string };

const KINDS: Record<string, Kind> = {
  pdf: { ext: "pdf", fileType: "PDF", mime: "application/pdf" },
  docx: {
    ext: "docx",
    fileType: "DOCX",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
};

const startsWith = (bytes: Uint8Array, sig: number[]) => sig.every((b, i) => bytes[i] === b);

// The extension and the browser's MIME type can be faked, so we also check the file's first bytes.
export function validateFile(
  name: string,
  bytes: Uint8Array
): { ok: true; kind: Kind } | { ok: false; error: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const kind = KINDS[ext];
  if (!kind) return { ok: false, error: "Only PDF and DOCX files are supported." };
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };

  const isPdf = startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-"
  const isZip = startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]); // DOCX is a ZIP container
  if (kind.ext === "pdf" && !isPdf) return { ok: false, error: "This file is not a valid PDF." };
  if (kind.ext === "docx" && !isZip) return { ok: false, error: "This file is not a valid DOCX." };
  return { ok: true, kind };
}

// Display name only. The storage path never uses it.
export function cleanFilename(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "resume";
  // eslint-disable-next-line no-control-regex
  return base.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 150) || "resume";
}