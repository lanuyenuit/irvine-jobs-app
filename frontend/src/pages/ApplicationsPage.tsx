import { useEffect, useRef, useState } from "react";
import { ExternalLink, Trash2, PencilLine, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/layouts/Header";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import { fetchApplications, updateApplication, deleteApplication } from "../api/applicationsApi";
import { useToast } from "../context/ToastContext";
import { relativeDate } from "../utils/dateUtils";
import type { Application, ApplicationStatus } from "../types/application";

const STATUSES: ApplicationStatus[] = ["saved", "applied", "interviewing", "offer", "rejected"];

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-indigo-100 text-indigo-700",
  applied: "bg-blue-100 text-blue-700",
  interviewing: "bg-yellow-100 text-yellow-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-slate-100 text-slate-500",
};

const PIPELINE_STEPS: ApplicationStatus[] = ["saved", "applied", "interviewing", "offer"];

function NoteEditor({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (notes: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  async function save() {
    await onSave(text);
    setEditing(false);
  }

  function cancel() {
    setText(value ?? "");
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setEditing(true); setTimeout(() => ref.current?.focus(), 0); }}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500"
      >
        <PencilLine className="h-3 w-3" />
        {value ? <span className="truncate max-w-[200px]">{value}</span> : "Add note"}
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Interview notes, contacts, deadlines…"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
        >
          <Check className="h-3 w-3" /> Save
        </button>
        <button
          type="button"
          onClick={cancel}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
        >
          <X className="h-3 w-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  useEffect(() => {
    fetchApplications()
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(app: Application, status: ApplicationStatus) {
    try {
      const updates: Parameters<typeof updateApplication>[1] = { status };
      if (status === "applied" && !app.applied_at) {
        updates.applied_at = new Date().toISOString();
      }
      const updated = await updateApplication(app.id, updates);
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast(`Moved to ${STATUS_LABELS[status]}`);
    } catch {
      toast("Failed to update status", "error");
    }
  }

  async function handleNoteSave(app: Application, notes: string) {
    try {
      const updated = await updateApplication(app.id, { notes });
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast("Note saved");
    } catch {
      toast("Failed to save note", "error");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      toast("Application removed");
    } catch {
      toast("Failed to remove application", "error");
    }
  }

  const visible =
    filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const counts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: applications.filter((a) => a.status === s).length }),
    {} as Record<ApplicationStatus, number>
  );

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Header />

      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {applications.length} total · {counts.applied ?? 0} applied · {counts.interviewing ?? 0} interviewing
          </p>
        </div>

        {/* Pipeline funnel */}
        {applications.length > 0 && (
          <div className="mb-6 grid grid-cols-4 gap-3">
            {PIPELINE_STEPS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(filter === s ? "all" : s)}
                className={`rounded-2xl border p-3 text-left transition-colors ${
                  filter === s
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="text-2xl font-bold text-slate-900">{counts[s] ?? 0}</div>
                <div className="mt-0.5 text-xs text-slate-500">{STATUS_LABELS[s]}</div>
              </button>
            ))}
          </div>
        )}

        {/* Status filter pills */}
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            All ({applications.length})
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === s
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {STATUS_LABELS[s]} ({counts[s] ?? 0})
            </button>
          ))}
        </div>

        {loading && <LoadingState message="Loading applications…" />}

        {!loading && visible.length === 0 && (
          <EmptyState
            title={
              filter === "all"
                ? "No applications yet"
                : `No ${STATUS_LABELS[filter as ApplicationStatus].toLowerCase()} applications`
            }
            description={
              filter === "all"
                ? "Save or apply to jobs from the Discover page."
                : undefined
            }
            action={
              filter === "all" ? (
                <Link
                  to="/"
                  className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Browse jobs
                </Link>
              ) : undefined
            }
          />
        )}

        {!loading && visible.length > 0 && (
          <div className="space-y-3">
            {visible.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/jobs/${app.job_posting_id}`}
                        className="truncate text-base font-semibold text-slate-900 hover:underline"
                      >
                        {app.title ?? "Untitled"}
                      </Link>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </div>

                    <p className="mt-0.5 text-sm text-slate-500">
                      {app.company_name ? (
                        <span className="font-medium text-slate-700">{app.company_name}</span>
                      ) : "Unknown"}
                      {app.location_text && ` · ${app.location_text}`}
                      {app.is_remote && (
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          Remote
                        </span>
                      )}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                      {app.employment_type && <span>{app.employment_type}</span>}
                      {app.applied_at && (
                        <span>Applied {relativeDate(app.applied_at)}</span>
                      )}
                      {!app.applied_at && (
                        <span>Saved {relativeDate(app.created_at)}</span>
                      )}
                    </div>

                    <NoteEditor
                      value={app.notes}
                      onSave={(notes) => handleNoteSave(app, notes)}
                    />
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {app.job_url && (
                        <a
                          href={app.job_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(app.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app, e.target.value as ApplicationStatus)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
