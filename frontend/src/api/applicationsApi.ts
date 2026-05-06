import type { Application, ApplicationStatus } from "../types/application";
import { http } from "./http";

export async function fetchApplications(): Promise<Application[]> {
  const res = await http("/applications");
  if (!res.ok) throw new Error("Failed to fetch applications");
  const data = await res.json();
  return data.applications;
}

export async function saveApplication(
  job_posting_id: number,
  status: ApplicationStatus = "saved"
): Promise<Application> {
  const res = await http("/applications", {
    method: "POST",
    body: JSON.stringify({ job_posting_id, status }),
  });
  if (!res.ok) throw new Error("Failed to save application");
  return res.json();
}

export async function updateApplication(
  id: number,
  updates: Partial<{ status: ApplicationStatus; notes: string; applied_at: string }>
): Promise<Application> {
  const res = await http(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update application");
  return res.json();
}

export async function deleteApplication(id: number): Promise<void> {
  const res = await http(`/applications/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete application");
}
