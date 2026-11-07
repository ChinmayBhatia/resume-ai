import type { Resume } from "@/types";

export type ResumeRow = {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

export const RESUME_COLUMNS = "id, filename, file_type, file_size, created_at";

export function rowToResume(r: ResumeRow): Resume {
  return {
    id: r.id,
    filename: r.filename,
    fileType: r.file_type === "DOCX" ? "DOCX" : "PDF",
    sizeKb: Math.max(1, Math.round(r.file_size / 1024)),
    uploadedAt: r.created_at,
  };
}