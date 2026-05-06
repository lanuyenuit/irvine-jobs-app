import type { Job } from "../../types/job";

interface FeaturedJobCardProps {
  job: Job;
}

export default function FeaturedJobCard({ job }: FeaturedJobCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600">Featured Match</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            {job.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {job.company_name || "Unknown company"} • {job.location_text || "Location not specified"}
          </p>
        </div>

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          New
        </span>
      </div>

      <p className="text-sm leading-6 text-slate-600">
        A highlighted opportunity from your latest results.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.employment_type && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            {job.employment_type}
          </span>
        )}
        {job.source_name && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            {job.source_name}
          </span>
        )}
        {job.is_remote && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            Remote
          </span>
        )}
      </div>
    </div>
  );
}