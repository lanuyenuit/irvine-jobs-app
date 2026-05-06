import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, TrendingUp, Building2, Briefcase } from "lucide-react";
import Header from "../components/layouts/Header";
import { useAuth } from "../context/AuthContext";
import SideBarFilters from "../components/layouts/SideBarFilters";
import RightInsightsPanel from "../components/layouts/RightInsightsPanel";
import JobCard from "../components/jobs/JobCard";
import Pagination from "../components/common/Pagination";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { fetchJobs, fetchCompanies } from "../api/jobsApi";
import { fetchApplications, saveApplication, updateApplication } from "../api/applicationsApi";
import { getLatestCV, tailorCV } from "../api/cvApi";
import { useToast } from "../context/ToastContext";
import type { Job } from "../types/job";
import type { Company } from "../types/company";
import type { Application } from "../types/application";

export default function DiscoverPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Map<number, Application>>(new Map());
  const [hasCv, setHasCv] = useState(false);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: searchParams.get("search") ?? "",
    location: "",
    company_id: "",
    employmentTypes: [] as string[],
    techStack: [] as string[],
    locationRadius: 0,
    minMatchScore: 70,
  });

  // Sync search param when header search navigates here
  useEffect(() => {
    const q = searchParams.get("search") ?? "";
    setFilters((prev) => (prev.search === q ? prev : { ...prev, search: q }));
    setOffset(0);
  }, [searchParams]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [companiesData, appsData, cv] = await Promise.all([
          fetchCompanies(),
          fetchApplications(),
          getLatestCV(),
        ]);
        setCompanies(companiesData);
        setApplications(new Map(appsData.map((a) => [a.job_posting_id, a])));
        setHasCv(!!cv);
      } catch (err) {
        console.error(err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchJobs({
          search: filters.search,
          location: filters.location,
          company_id: filters.company_id,
          radius: filters.locationRadius,
          employment_type: filters.employmentTypes,
          tech_stack: filters.techStack,
          limit,
          offset,
        });
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
        setError("Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [filters, limit, offset]);

  const handleSave = useCallback(async (jobId: number) => {
    if (applications.get(jobId)) return;
    try {
      const app = await saveApplication(jobId, "saved");
      setApplications((prev) => new Map(prev).set(jobId, app));
      toast("Job saved to applications");
      if (hasCv) {
        toast("Tailoring your CV in the background…");
        tailorCV(jobId).catch(() => {});
      }
    } catch {
      toast("Failed to save job", "error");
    }
  }, [applications, hasCv, toast]);

  const handleApply = useCallback(async (jobId: number, jobUrl: string) => {
    window.open(jobUrl, "_blank", "noreferrer");
    try {
      const existing = applications.get(jobId);
      if (existing) {
        if (existing.status === "saved") {
          const updated = await updateApplication(existing.id, {
            status: "applied",
            applied_at: new Date().toISOString(),
          });
          setApplications((prev) => new Map(prev).set(jobId, updated));
          toast("Marked as applied");
        }
      } else {
        const app = await saveApplication(jobId, "applied");
        setApplications((prev) => new Map(prev).set(jobId, app));
        toast("Marked as applied");
      }
    } catch {
      toast("Failed to track application", "error");
    }
  }, [applications, toast]);

  const activeFiltersCount = [
    filters.search,
    filters.location,
    filters.company_id,
    filters.employmentTypes.length > 0,
    filters.techStack.length > 0,
    filters.locationRadius > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Header />

      {/* Welcome bar */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)" }}>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10"
          style={{ background: "radial-gradient(ellipse at 80% 50%, #fff 0%, transparent 70%)" }} />

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">

          {/* Left: greeting */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-base">
              {new Date().getHours() < 12 ? "🌤" : new Date().getHours() < 17 ? "☀️" : "🌙"}
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "15px", lineHeight: 1.2 }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
                <span style={{ color: "#c7d2fe" }}>{user?.name?.split(" ")[0] ?? "there"}</span>
              </div>
              <div style={{ color: "#a5b4fc", fontSize: "12px", marginTop: "2px" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                {activeFiltersCount > 0 && (
                  <span style={{ color: "#fbbf24", marginLeft: "8px" }}>
                    · {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: stat chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { icon: Briefcase,  label: total > 0 ? `${total.toLocaleString()} open roles` : "Loading…" },
              { icon: Building2,  label: companies.length > 0 ? `${companies.length} companies` : "Companies" },
              { icon: TrendingUp, label: "Updated daily" },
              { icon: Sparkles,   label: "AI tailoring on" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
                <Icon style={{ width: 13, height: 13, color: "#c7d2fe", flexShrink: 0 }} />
                <span style={{ color: "#e0e7ff", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          <aside className="lg:col-span-3">
            <SideBarFilters
              filters={filters}
              setFilters={setFilters}
              companies={companies}
              setOffset={setOffset}
            />
          </aside>

          <section className="space-y-4 lg:col-span-6">
            {loading && <LoadingState message="Finding jobs…" />}

            {!loading && error && (
              <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!loading && !error && jobs.length === 0 && (
              <EmptyState
                title="No jobs match your filters"
                description="Try adjusting your search or clearing some filters."
              />
            )}

            {!loading && !error && jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                application={applications.get(job.id)}
                onSave={handleSave}
                onApply={handleApply}
              />
            ))}

            {!loading && !error && total > limit && (
              <Pagination
                total={total}
                limit={limit}
                offset={offset}
                setOffset={setOffset}
              />
            )}
          </section>

          <aside className="lg:col-span-3">
            <RightInsightsPanel applications={applications} />
          </aside>
        </div>
      </main>
    </div>
  );
}
