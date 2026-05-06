import { Bookmark, BookmarkCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { Job } from "../../types/job";
import type { Application } from "../../types/application";
import { relativeDate, isNew } from "../../utils/dateUtils";

interface JobCardProps {
  job: Job;
  application?: Application;
  onSave: (jobId: number) => void;
  onApply: (jobId: number, jobUrl: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  saved: "bg-indigo-100 text-indigo-700",
  applied: "bg-blue-100 text-blue-700",
  interviewing: "bg-yellow-100 text-yellow-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function JobCard({ job, application, onSave, onApply }: JobCardProps) {
  const isSaved = !!application;
  const fresh = isNew(job.discovered_at ?? job.posted_at ?? null);

  return (
    <div className={`rounded-3xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
      fresh ? "border-indigo-100" : "border-slate-200"
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/jobs/${job.id}`} className="hover:underline">
              <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
            </Link>
            {fresh && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                New
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {job.company_id ? (
              <Link
                to={`/companies/${job.company_id}`}
                className="font-medium text-slate-700 hover:text-indigo-600 hover:underline"
              >
                {job.company_name || "Unknown company"}
              </Link>
            ) : (
              <span>{job.company_name || "Unknown company"}</span>
            )}
            {" "}·{" "}{job.location_text || "Location not specified"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {application && (
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[application.status] ?? "bg-slate-100 text-slate-700"}`}>
              {STATUS_LABELS[application.status] ?? application.status}
            </span>
          )}
          {job.is_remote ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Remote
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              On-site
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {job.employment_type && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {job.employment_type}
          </span>
        )}
        {job.department && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {job.department}
          </span>
        )}
        {job.industry && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {job.industry}
          </span>
        )}
        {job.source_name && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-400">
            via {job.source_name}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {relativeDate(job.posted_at ?? job.discovered_at)}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSave(job.id)}
            title={isSaved ? "Saved" : "Save job"}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              isSaved
                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                : "border-slate-200 text-slate-400 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>

          {job.job_url && (
            <button
              type="button"
              onClick={() => onApply(job.id, job.job_url!)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                application?.status === "applied" ||
                application?.status === "interviewing" ||
                application?.status === "offer"
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {application?.status === "applied" ||
              application?.status === "interviewing" ||
              application?.status === "offer"
                ? "View Posting"
                : "Apply"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
