import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Loader2,
  Sparkles,
  Download,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import Header from "../components/layouts/Header";
import CVModal from "../components/cv/CVModal";
import CoverLetterModal from "../components/cv/CoverLetterModal";
import { fetchJobById } from "../api/jobsApi";
import { fetchApplications, saveApplication, updateApplication } from "../api/applicationsApi";
import { tailorCV } from "../api/cvApi";
import { downloadTailoredCV, downloadCoverLetter } from "../utils/downloadCV";
import type { Job } from "../types/job";
import type { Application } from "../types/application";
import type { TailoredCV } from "../types/cv";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [tailored, setTailored] = useState<TailoredCV | null>(null);
  const [loading, setLoading] = useState(true);
  const [tailoring, setTailoring] = useState(false);
  const [tailorError, setTailorError] = useState("");
  const [error, setError] = useState("");
  const [showCVModal, setShowCVModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [jobData, apps] = await Promise.all([
          fetchJobById(id!),
          fetchApplications(),
        ]);
        setJob(jobData);
        const existing = apps.find((a) => a.job_posting_id === jobData.id);
        if (existing) {
          setApplication(existing);
          if (existing.tailored_cv) setTailored(existing.tailored_cv as unknown as TailoredCV);
        }
      } catch {
        setError("Could not load job.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    if (!job) return;
    try {
      const app = await saveApplication(job.id, "saved");
      setApplication(app);
    } catch { /* ignore */ }
  }

  async function handleApply() {
    if (!job?.job_url) return;
    window.open(job.job_url, "_blank", "noreferrer");
    try {
      if (application) {
        if (application.status === "saved") {
          const updated = await updateApplication(application.id, {
            status: "applied",
            applied_at: new Date().toISOString(),
          });
          setApplication(updated);
        }
      } else {
        const app = await saveApplication(job.id, "applied");
        setApplication(app);
      }
    } catch { /* ignore */ }
  }

  async function handleTailor() {
    if (!job) return;
    setTailorError("");
    setTailoring(true);
    try {
      const result = await tailorCV(job.id);
      setTailored(result.tailored_cv);
      const apps = await fetchApplications();
      const updated = apps.find((a) => a.job_posting_id === job.id);
      if (updated) setApplication(updated);
    } catch (err: unknown) {
      setTailorError(err instanceof Error ? err.message : "Tailoring failed");
    } finally {
      setTailoring(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50">
        <Header />
        <main className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen w-full bg-slate-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="text-sm text-red-600">{error || "Job not found."}</p>
        </main>
      </div>
    );
  }

  const isSaved = !!application;

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Job Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {job.company_name}
                {job.location_text ? ` · ${job.location_text}` : ""}
                {job.industry ? ` · ${job.industry}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {job.is_remote && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Remote
                </span>
              )}
              {application && (
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 capitalize">
                  {application.status}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
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
            {job.source_name && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                via {job.source_name}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaved}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                isSaved
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {isSaved ? "Saved" : "Save"}
            </button>

            {job.job_url && (
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <ExternalLink className="h-4 w-4" />
                {application?.status === "applied" ||
                application?.status === "interviewing" ||
                application?.status === "offer"
                  ? "View Posting"
                  : "Apply Now"}
              </button>
            )}

            <button
              type="button"
              onClick={handleTailor}
              disabled={tailoring}
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-60"
            >
              {tailoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {tailoring ? "Tailoring CV…" : tailored ? "Re-tailor CV" : "Tailor My CV"}
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            {job.posted_at
              ? `Posted ${new Date(job.posted_at).toLocaleDateString()}`
              : job.discovered_at
                ? `Discovered ${new Date(job.discovered_at).toLocaleDateString()}`
                : "Recently added"}
          </p>
        </div>

        {tailorError && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {tailorError}
          </div>
        )}

        {/* Tailored CV */}
        {tailored && (
          <div className="mt-6 space-y-4">
            {/* Match Score */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">AI Match Analysis</h2>
                <div className="flex items-center gap-3">
                  {tailored.full_cv && (
                    <button
                      type="button"
                      onClick={() => setShowCVModal(true)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                      Preview CV
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => downloadTailoredCV(job, tailored)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-indigo-600">{tailored.match_score}%</span>
                    <span className="text-sm text-slate-400">match</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${tailored.match_score}%` }}
                />
              </div>
            </div>

            {/* Professional Summary */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Tailored Summary</h2>
              <p className="text-sm leading-relaxed text-slate-700">{tailored.summary}</p>
            </div>

            {/* Cover Letter */}
            {(tailored.cover_letter || tailored.cover_letter_intro) && (
              <div className="rounded-3xl border border-violet-100 bg-violet-50 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-violet-900">
                    <Sparkles className="h-4 w-4" />
                    Cover Letter
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCoverLetterModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const name = tailored.full_cv?.name ?? "";
                        const contact = tailored.full_cv?.contact ?? "";
                        downloadCoverLetter(job, tailored, name, contact);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = tailored.cover_letter || tailored.cover_letter_intro;
                        navigator.clipboard.writeText(text).then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-violet-800 line-clamp-6">
                  {tailored.cover_letter || tailored.cover_letter_intro}
                </p>
              </div>
            )}

            {/* Key Skills */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Key Skills to Highlight</h2>
              <div className="flex flex-wrap gap-2">
                {tailored.key_skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience Bullets */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Suggested Experience Bullets</h2>
              <ul className="space-y-2">
                {tailored.experience_bullets.map((bullet, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            {/* Keywords */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-slate-900">ATS Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {tailored.keywords.map((kw) => (
                  <span key={kw} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-amber-900">Improvement Suggestions</h2>
              <ul className="space-y-2">
                {tailored.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-800">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      {showCVModal && tailored?.full_cv && (
        <CVModal
          cv={tailored.full_cv}
          tailored={tailored}
          job={job}
          onClose={() => setShowCVModal(false)}
        />
      )}

      {showCoverLetterModal && tailored && (
        <CoverLetterModal
          tailored={tailored}
          job={job}
          senderName={tailored.full_cv?.name ?? ""}
          senderContact={tailored.full_cv?.contact ?? ""}
          onClose={() => setShowCoverLetterModal(false)}
        />
      )}
    </div>
  );
}

