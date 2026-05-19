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
  // Unix seconds from gl.message.timestamp — present on jobs posted after the timestamp update.
  // Absent on older jobs that were posted before the field was added to the contract.
  created_at?: number;
  updated_at?: number;
}
