import type { Job } from "./job";
import type { Company } from "./company";

export interface JobsResponse {
  total: number;
  limit: number;
  offset: number;
  jobs: Job[];
}

export interface CompaniesResponse {
  companies: Company[];
}