export type ApplicationStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected";

export interface Application {
  id: number;
  job_posting_id: number;
  status: ApplicationStatus;
  applied_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  title?: string;
  company_name?: string;
  location_text?: string;
  is_remote?: boolean;
  employment_type?: string;
  job_url?: string;
  department?: string;
  industry?: string;
  tailored_cv?: unknown;
}
