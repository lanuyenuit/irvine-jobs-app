export interface Job {
  id: number;
  title: string;
  location_text?: string;
  location_city?: string;
  location_state?: string;
  is_remote?: boolean;
  employment_type?: string;
  department?: string;
  job_url?: string;
  discovered_at?: string;
  posted_at?: string;
  company_id?: number;
  company_name?: string;
  industry?: string;
  source_name?: string;
  source_type?: string;
  description_text?: string;
  company_website?: string;
}