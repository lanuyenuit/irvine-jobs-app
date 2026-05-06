import { http } from "./http";

export interface Stats {
  jobs: {
    total_active: number;
    new_this_week: number;
    new_today: number;
  };
  applications: Partial<Record<string, number>>;
  top_companies: Array<{ id: number; name: string; industry: string | null; job_count: number }>;
  top_industries: Array<{ industry: string; job_count: number }>;
}

export async function fetchStats(): Promise<Stats> {
  const res = await http("/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}
