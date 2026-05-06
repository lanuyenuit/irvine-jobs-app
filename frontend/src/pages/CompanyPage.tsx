import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Globe, Briefcase, MapPin, Building2, Bookmark, BookmarkCheck, ExternalLink, Loader2,
} from "lucide-react";
import Header from "../components/layouts/Header";
import { fetchApplications, saveApplication } from "../api/applicationsApi";
import { useToast } from "../context/ToastContext";
import { relativeDate, isNew } from "../utils/dateUtils";
import type { Job } from "../types/job";
import type { Company } from "../types/company";
import type { Application } from "../types/application";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Map<number, Application>>(new Map());
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [companiesRes, jobsRes, appsData] = await Promise.all([
          fetch(`${API_BASE_URL}/companies`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/companies/${id}/jobs?limit=50`).then((r) => r.json()),
          fetchApplications(),
        ]);
        const found = companiesRes.companies?.find((c: Company) => String(c.id) === id);
        setCompany(found ?? null);
        setJobs(jobsRes.jobs ?? []);
        setTotal(jobsRes.total ?? 0);
        setApplications(new Map(appsData.map((a: Application) => [a.job_posting_id, a])));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave(jobId: number) {
    try {
      const app = await saveApplication(jobId, "saved");
      setApplications((prev) => new Map(prev).set(jobId, app));
      toast("Job saved");
    } catch {
      toast("Failed to save job", "error");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50">
        <Header />
        <main className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Company header */}
        {company && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{company.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {company.industry && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> {company.industry}
                    </span>
                  )}
                  {(company.location_city || company.location_state) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[company.location_city, company.location_state].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {company.company_size && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {company.company_size}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {company.website_url && (
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {company.careers_url && (
                  <a
                    href={company.careers_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Careers
                  </a>
                )}
              </div>
            </div>
            {company.notes && (
              <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {company.notes}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600">
                {total} open {total === 1 ? "role" : "roles"}
              </span>
              {company.is_target && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Target company
                </span>
              )}
            </div>
          </div>
        )}

        {/* Jobs list */}
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Open Roles</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-400">No active openings found.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const app = applications.get(job.id);
              const fresh = isNew(job.discovered_at ?? job.posted_at ?? null);
              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="truncate text-sm font-semibold text-slate-900 hover:underline"
                        >
                          {job.title}
                        </Link>
                        {fresh && (
                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            New
                          </span>
                        )}
                        {app && (
                          <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize">
                            {app.status}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {job.location_text || "Location N/A"}
                        {job.is_remote && " · Remote"}
                        {job.employment_type && ` · ${job.employment_type}`}
                        {job.department && ` · ${job.department}`}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {relativeDate(job.discovered_at ?? job.posted_at)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSave(job.id)}
                        disabled={!!app}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                          app
                            ? "border-indigo-200 bg-indigo-50 text-indigo-500"
                            : "border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
                        }`}
                      >
                        {app ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                      {job.job_url && (
                        <a
                          href={job.job_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
