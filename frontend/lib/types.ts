export type JobStatus =
  | "open"
  | "active"
  | "delivered"
  | "completed"
  | "disputed"
  | "cancelled"   // client cancelled an open job, or reclaimed an expired one
  | "refunded";   // dispute unresolved after max resubmits → escrow returned

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
  // Remaining escrow held by the contract for this job (decremented as the
  // freelancer is paid; 0 after full payout or refund).
  escrow_remaining?: number;
  deadline: string;
  // Parsed deadline as unix seconds (0 when unparseable / non-enforcing).
  deadline_ts?: number;
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
  // Client → freelancer rating on completion (one per job)
  rated?: boolean;
  rating?: number;          // 1–5 stars
  review?: string;
  // Unix seconds from on-chain block time
  created_at?: number;
  updated_at?: number;
}

export interface Proposal {
  freelancer: string;
  note: string;
  bid: number;              // informational; 0 = at budget
  created_at: number;
}

export interface FreelancerProfile {
  address: string;
  display_name: string;
  bio: string;
  skills: string[];
  jobs_completed: number;
  jobs_disputed: number;
  total_earned: number;     // wei (same unit as job.budget)
  reputation_score: number; // 0–100 integer
  rating_sum: number;
  rating_count: number;
  avg_rating: number;       // 0–5, rounded to 2 dp
}
