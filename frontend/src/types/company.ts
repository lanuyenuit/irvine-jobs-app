export interface Company {
  id: number;
  name: string;
  website_url?: string;
  careers_url?: string;
  industry?: string;
  company_size?: string;
  location_city?: string;
  location_state?: string;
  is_target?: boolean;
  notes?: string;
  job_count?: number;
}