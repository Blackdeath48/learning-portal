"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

type AnalyticsResponse = {
  totals: {
    totalEnrollments: number;
    completedCount: number;
    completionRate: number;
    averageProgress: number;
    averageScore: number;
    totalTimeMinutes: number;
  };
  summary: {
    enrollmentId: string;
    learner: { id: string; email: string; name?: string | null };
    course: { id: string; title: string };
    progress: number;
    score?: number | null;
    completed: boolean;
    totalTimeMinutes: number;
    attempts: { attemptNo: number; score?: number | null; timeSpentMins: number; completedAt?: string | null }[];
    progressTimeline: { recordedAt: string; progress: number; score?: number | null; timeSpentMins: number }[];
  }[];
};

export default function AdminAnalyticsPanel() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        setStatus("Unable to load analytics");
        return;
      }
      const data = (await response.json()) as AnalyticsResponse;
      setAnalytics(data);
      setStatus(null);
    } catch (error) {
      console.error(error);
      setStatus("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, [token]);

  const downloadReport = async (format: "csv" | "pdf") => {
    if (!token) {
      return;
    }
    const response = await fetch(`/api/reports/compliance?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("Failed to download report");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ethixlearn-compliance.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setStatus(`${format.toUpperCase()} report downloaded`);
  };

  return (
    <div className="card space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-secondary">Compliance analytics</h2>
          <p className="text-xs text-charcoal/60">
            Monitor completion status, attempts, and Neon-stored learning records ready for regulatory audits.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="button-secondary" onClick={loadAnalytics} disabled={loading}>
            Refresh
          </button>
          <button type="button" className="button-secondary" onClick={() => downloadReport("csv")}>Export CSV</button>
          <button type="button" className="button-secondary" onClick={() => downloadReport("pdf")}>Export PDF</button>
        </div>
      </header>

      {analytics ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-secondary/20 p-4">
              <p className="text-xs uppercase tracking-wide text-secondary/60">Enrolments</p>
              <p className="text-2xl font-bold text-secondary">{analytics.totals.totalEnrollments}</p>
              <p className="text-xs text-charcoal/60">{analytics.totals.completedCount} completed</p>
            </div>
            <div className="rounded-lg border border-secondary/20 p-4">
              <p className="text-xs uppercase tracking-wide text-secondary/60">Completion rate</p>
              <p className="text-2xl font-bold text-secondary">{Math.round(analytics.totals.completionRate * 100)}%</p>
              <p className="text-xs text-charcoal/60">Avg progress {(analytics.totals.averageProgress * 100).toFixed(0)}%</p>
            </div>
            <div className="rounded-lg border border-secondary/20 p-4">
              <p className="text-xs uppercase tracking-wide text-secondary/60">Total time spent</p>
              <p className="text-2xl font-bold text-secondary">{analytics.totals.totalTimeMinutes} mins</p>
              <p className="text-xs text-charcoal/60">Average score {analytics.totals.averageScore.toFixed(0)}%</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-secondary">Learner detail</h3>
            <div className="space-y-3">
              {analytics.summary.map((entry) => (
                <div key={entry.enrollmentId} className="rounded-lg border border-secondary/20 p-4 text-sm">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-secondary">{entry.course.title}</p>
                      <p className="text-xs text-charcoal/60">
                        {entry.learner.name ?? entry.learner.email} · {entry.learner.email}
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs text-charcoal/60">
                      <span>Progress {(entry.progress * 100).toFixed(0)}%</span>
                      <span>Score {entry.score ? `${entry.score.toFixed(0)}%` : "—"}</span>
                      <span>Time {entry.totalTimeMinutes} mins</span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-secondary/70">Attempts</p>
                      <ul className="mt-1 space-y-1 text-xs text-charcoal/60">
                        {entry.attempts.map((attempt) => (
                          <li key={`${entry.enrollmentId}-${attempt.attemptNo}`}>
                            Attempt {attempt.attemptNo}: {attempt.score ? `${attempt.score.toFixed(0)}%` : "—"} · {attempt.timeSpentMins}
                            mins {attempt.completedAt ? `· ${new Date(attempt.completedAt).toLocaleDateString()}` : ""}
                          </li>
                        ))}
                        {entry.attempts.length === 0 && <li>No attempts recorded</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-secondary/70">Progress timeline</p>
                      <ul className="mt-1 space-y-1 text-xs text-charcoal/60">
                        {entry.progressTimeline.map((point) => (
                          <li key={point.recordedAt}>
                            {new Date(point.recordedAt).toLocaleString()}: {(point.progress * 100).toFixed(0)}% · {point.timeSpentMins}
                            mins
                          </li>
                        ))}
                        {entry.progressTimeline.length === 0 && <li>No timeline snapshots yet</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
              {analytics.summary.length === 0 && <p className="text-sm text-charcoal/60">No learner activity captured yet.</p>}
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-charcoal/60">{status ?? "Analytics will appear once learners engage with content."}</p>
      )}

      {status && analytics && <p className="text-xs text-charcoal/50">{status}</p>}
    </div>
  );
}
