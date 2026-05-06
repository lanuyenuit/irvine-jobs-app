import type { CV, TailoredCV } from "../types/cv";
import { http, httpUpload } from "./http";

export async function uploadCV(file: File): Promise<CV> {
  const form = new FormData();
  form.append("cv", file);
  const res = await httpUpload("/cv", form);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload CV");
  }
  return res.json();
}

export async function getLatestCV(): Promise<CV | null> {
  const res = await http("/cv/latest");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch CV");
  return res.json();
}

export async function tailorCV(jobId: number): Promise<{ job_id: number; tailored_cv: TailoredCV }> {
  const res = await http(`/jobs/${jobId}/tailor`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to tailor CV");
  }
  return res.json();
}
