import type { JobsResponse } from "../types/api";
import type { Company } from "../types/company";
import type { CompaniesResponse } from "../types/api";
import type { Job } from "../types/job";
import { http } from "./http";

export interface FetchJobsParams {
  search?: string;
  company_id?: string | number;
  location?: string;
  radius?: number;
  employment_type?: string[];
  tech_stack?: string[];
  limit?: number;
  offset?: number;
}

export async function fetchJobs(params: FetchJobsParams = {}): Promise<JobsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.company_id) query.append("company_id", String(params.company_id));
  if (params.location) query.append("location", params.location);
  if (params.radius) query.append("radius", String(params.radius));
  if (params.employment_type?.length) query.append("employment_type", params.employment_type.join(","));
  if (params.tech_stack?.length) query.append("tech_stack", params.tech_stack.join(","));
  if (params.limit !== undefined) query.append("limit", String(params.limit));
  if (params.offset !== undefined) query.append("offset", String(params.offset));

  const res = await http(`/jobs?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function fetchCompanies(): Promise<Company[]> {
  const res = await http("/companies");
  if (!res.ok) throw new Error("Failed to fetch companies");
  const data: CompaniesResponse = await res.json();
  return data.companies;
}

export async function fetchJobById(id: string | number): Promise<Job> {
  const res = await http(`/jobs/${id}`);
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}
