import type {
  AtsReport, InterviewReport, InterviewSummary, Question, Resume,
} from "@/types";

export const resumes: Resume[] = [
  { id: "r1", filename: "Software_Engineer_Resume.pdf", fileType: "PDF", sizeKb: 182, uploadedAt: "2026-10-28" },
  { id: "r2", filename: "Data_Analyst_CV.docx", fileType: "DOCX", sizeKb: 96, uploadedAt: "2026-10-15" },
  { id: "r3", filename: "Internship_Resume_2026.pdf", fileType: "PDF", sizeKb: 143, uploadedAt: "2026-09-30" },
];

const baseReport: AtsReport = {
  id: "a1",
  resumeId: "r1",
  score: 78,
  createdAt: "2026-11-01",
  summary:
    "A software engineering candidate with experience in web development, cloud deployment and REST API design. The resume is well organised but several achievements lack measurable results.",
  skills: ["Python", "React", "TypeScript", "AWS", "PostgreSQL", "Docker", "REST APIs", "Git"],
  strengths: [
    "Clear skills section with relevant technologies.",
    "Projects describe the tools used and the problem solved.",
    "Consistent section order and readable headings.",
  ],
  weaknesses: [
    "Few bullet points include numbers or measurable outcomes.",
    "The summary at the top is generic.",
    "Older experience takes space that recent projects could use.",
  ],
  missingKeywords: ["CI/CD", "Unit testing", "System design", "Agile", "Kubernetes"],
  education:
    "Bachelor's degree listed with dates. Adding relevant coursework or a final-year project would strengthen this section.",
  experience:
    "Two roles with responsibilities listed. Rewrite responsibilities as accomplishments, such as what improved and by how much, but only where it is true.",
  projectTips: [
    "State your own contribution on each project, not just the team's.",
    "Add the outcome, such as users, performance or a deployed link.",
    "Name the stack in the first line of each project.",
  ],
  formatting: [
    "Keep to a single column; tables and text boxes can confuse parsers.",
    "Use standard headings such as Experience, Education and Skills.",
    "Limit the resume to one or two pages.",
  ],
  recommendations: [
    "Add measurable results to your three strongest bullet points.",
    "Include testing and CI/CD experience if you have it.",
    "Tailor the skills list to each job description.",
    "Replace the generic summary with two specific sentences about your focus.",
  ],
};

export const atsReports: AtsReport[] = [
  baseReport,
  { ...baseReport, id: "a2", resumeId: "r2", score: 64, createdAt: "2026-10-16" },
];
export const mockAtsReport = baseReport;

export const questions: Question[] = [
  { id: "q1", text: "You list Python and PostgreSQL on your resume. How would you design the schema for an app that stores user resumes and analysis history?", category: "Technical", difficulty: "Intermediate" },
  { id: "q2", text: "Tell me about the most challenging project on your resume. What was your specific role?", category: "Project", difficulty: "Intermediate" },
  { id: "q3", text: "How do you decide between server-side and client-side rendering in a React application?", category: "Technical", difficulty: "Intermediate" },
  { id: "q4", text: "Describe a time you disagreed with a teammate. How did you resolve it?", category: "Behavioral", difficulty: "Intermediate" },
  { id: "q5", text: "Your resume mentions AWS. Walk me through how you would deploy and monitor a small web service.", category: "Technical", difficulty: "Intermediate" },
  { id: "q6", text: "Why are you interested in this role, and where do you want to be in three years?", category: "HR", difficulty: "Intermediate" },
];

export const interviews: InterviewSummary[] = [
  { id: "i1", resumeId: "r1", type: "Mixed", difficulty: "Intermediate", questionCount: 15, status: "completed", score: 71, createdAt: "2026-11-02" },
  { id: "i2", resumeId: "r1", type: "Technical", difficulty: "Advanced", questionCount: 20, status: "completed", score: 58, createdAt: "2026-10-27" },
  { id: "i3", resumeId: "r2", type: "HR", difficulty: "Beginner", questionCount: 10, status: "completed", score: 84, createdAt: "2026-10-18" },
  { id: "i4", resumeId: "r3", type: "Mixed", difficulty: "Beginner", questionCount: 10, status: "in_progress", score: null, createdAt: "2026-10-05" },
];

export const interviewReport: InterviewReport = {
  interviewId: "i1",
  overallScore: 71,
  subscores: [
    { label: "Relevance", value: 80 },
    { label: "Technical accuracy", value: 68 },
    { label: "Communication", value: 74 },
    { label: "Structure", value: 62 },
  ],
  strengths: [
    "Answers stayed on topic and referred to your own projects.",
    "Clear, calm explanations of technical choices.",
  ],
  weaknesses: [
    "Behavioral answers lacked a clear situation, action and result structure.",
    "Some technical answers skipped trade-offs and failure cases.",
  ],
  topics: ["Database indexing and normalization", "Rendering strategies in React", "Monitoring and logging basics", "STAR method for behavioral answers"],
  feedback: questions.map((q, i) => ({
    questionId: q.id,
    score: [78, 72, 65, 55, 70, 80][i],
    answer: "Sample answer text appears here. In the real app this is what you typed or dictated for the question.",
    explanation:
      "Relevant and understandable. The answer covered the main idea but did not go into trade-offs or give a concrete example.",
    missingPoints: ["A concrete example", "Trade-offs or alternatives considered", "The measurable outcome"],
    improvedAnswer:
      "A stronger answer opens with a one-sentence summary, walks through the approach step by step using a real example from your resume, names one trade-off, and closes with the result.",
  })),
};