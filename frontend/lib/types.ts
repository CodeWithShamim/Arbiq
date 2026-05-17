export type JobStatus =
  | "open"
  | "active"
  | "delivered"
  | "completed"
  | "disputed";

export interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  client: string;
  freelancer: string;
  status: JobStatus;
  evidence_url: string;
  evidence_note: string;
  ai_reasoning: string;
  created_at: string;
  updated_at: string;
}
