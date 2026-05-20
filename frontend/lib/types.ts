export type JobStatus =
  | "open"
  | "active"
  | "delivered"
  | "completed"
  | "disputed";

export interface Milestone {
  title: string;
  amount: number;
  status: "pending" | "delivered" | "approved";
  evidence_url: string;
  evidence_note: string;
  approved: boolean;
}

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
  // AI rubric scores from auto_evaluate (present after rubric upgrade)
  ai_scores?: {
    relevance: number;
    completeness: number;
    quality: number;
    meets_spec: number;
    professional: number;
  };
  ai_confidence?: string;
  // Appeal / resubmit tracking
  resubmit_count?: number;
  // Milestone payment support
  has_milestones?: boolean;
  milestones?: Milestone[];
  // Unix seconds from gl.message.timestamp
  created_at?: number;
  updated_at?: number;
}

export interface FreelancerProfile {
  address: string;
  jobs_completed: number;
  jobs_disputed: number;
  total_earned: number;     // wei (same unit as job.budget)
  reputation_score: number; // 0–100 integer
}
