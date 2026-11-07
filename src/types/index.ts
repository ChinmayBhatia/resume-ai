export type FileType = "PDF" | "DOCX";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type InterviewType = "Technical" | "HR" | "Mixed";

export type Resume = {
  id: string;
  filename: string;
  fileType: FileType;
  sizeKb: number;
  uploadedAt: string; // ISO date
};

export type AtsReport = {
  id: string;
  resumeId: string;
  score: number;
  createdAt: string;
  summary: string;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  education: string;
  experience: string;
  projectTips: string[];
  formatting: string[];
  recommendations: string[];
};

export type Question = {
  id: string;
  text: string;
  category: string;
  difficulty: Difficulty;
};

export type InterviewSummary = {
  id: string;
  resumeId: string;
  type: InterviewType;
  difficulty: Difficulty;
  questionCount: number;
  status: "completed" | "in_progress";
  score: number | null;
  createdAt: string;
};

export type QuestionFeedback = {
  questionId: string;
  score: number;
  answer: string;
  explanation: string;
  missingPoints: string[];
  improvedAnswer: string;
};

export type InterviewReport = {
  interviewId: string;
  overallScore: number;
  subscores: { label: string; value: number }[];
  strengths: string[];
  weaknesses: string[];
  topics: string[];
  feedback: QuestionFeedback[];
};