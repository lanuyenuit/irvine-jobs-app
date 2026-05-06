import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Briefcase, Building2, Loader2 } from "lucide-react";
import { fetchStats } from "../../api/statsApi";
import type { Stats } from "../../api/statsApi";
import type { Application } from "../../types/application";

const APP_STATUS_ORDER = ["saved", "applied", "interviewing", "offer"] as const;
const APP_STATUS_LABELS: Record<string, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
};
const APP_STATUS_COLORS: Record<string, string> = {
  saved: "bg-indigo-400",
  applied: "bg-blue-400",
  interviewing: "bg-yellow-400",
  offer: "bg-green-400",
};

interface Props {
  applications?: Map<number, Application>;
}

export default function RightInsightsPanel({ applications }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const appCounts = applications
    ? APP_STATUS_ORDER.reduce((acc, s) => {
        acc[s] = [...applications.values()].filter((a) => a.status === s).length;
        return acc;
      }, {} as Record<string, number>)
    : stats?.applications ?? {};

  const totalApps = Object.values(appCounts).reduce((s, n) => s + (n ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Live job market stats */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Market Pulse
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        ) : stats ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">Active jobs</span>
              <span className="text-lg font-bold text-slate-900">
                {stats.jobs.total_active.toLocaleString()}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">New this week</span>
              <span className="text-sm font-semibold text-indigo-600">
                +{stats.jobs.new_this_week}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">New today</span>
              <span className="text-sm font-semibold text-green-600">
                +{stats.jobs.new_today}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Application pipeline */}
      {totalApps > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              My Pipeline
            </h2>
          </div>

          <div className="space-y-2.5">
            {APP_STATUS_ORDER.map((s) => {
              const count = appCounts[s] ?? 0;
              const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
              return (
                <div key={s}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{APP_STATUS_LABELS[s]}</span>
                    <span className="font-semibold text-slate-700">{count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${APP_STATUS_COLORS[s]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            to="/applications"
            className="mt-4 block text-center text-xs font-medium text-indigo-600 hover:underline"
          >
            View all applications →
          </Link>
        </div>
      )}

      {/* Top hiring companies */}
      {!loading && stats && stats.top_companies.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Top Hiring
            </h2>
          </div>

          <div className="space-y-2">
            {stats.top_companies.map((c) => (
              <Link
                key={c.id}
                to={`/companies/${c.id}`}
                className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm hover:bg-slate-50"
              >
                <span className="truncate font-medium text-slate-700">{c.name}</span>
                <span className="ml-2 shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                  {c.job_count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top industries */}
      {!loading && stats && stats.top_industries.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            By Industry
          </h2>
          <div className="space-y-2">
            {stats.top_industries.map((ind) => {
              const max = stats.top_industries[0].job_count;
              const pct = Math.round((ind.job_count / max) * 100);
              return (
                <div key={ind.industry}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-600 truncate">{ind.industry}</span>
                    <span className="ml-2 shrink-0 font-semibold text-slate-700">{ind.job_count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
