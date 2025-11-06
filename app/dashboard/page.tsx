"use client";

import { useEffect, useState } from "react";
import ProgressDonut from "../../components/ProgressDonut";
import StatementStream from "../../components/StatementStream";
import { useAuth } from "../../hooks/useAuth";

interface EnrollmentResponse {
  id: string;
  course: { id: string; title: string; description: string };
  progress: number;
  completed: boolean;
  score?: number | null;
  totalTimeMinutes: number;
  statements: { id: string; verb: { display: Record<string, string> }; object: { definition?: { name?: Record<string, string> } }; timestamp: string }[];
}

export default function DashboardPage() {
  const { user, token, refresh } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void refresh();

    const load = async () => {
      const response = await fetch("/api/enrollments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        setStatus("Unable to load progress");
        return;
      }
      const data = (await response.json()) as { enrollments: EnrollmentResponse[] };
      setEnrollments(data.enrollments);
      setStatus(null);
    };

    void load();
  }, [token, refresh]);

  if (!user || !token) {
    return (
      <section className="mx-auto max-w-4xl space-y-4">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-secondary">Learner dashboard</h1>
          <p className="text-sm text-charcoal/70">
            Sign in to view completion progress, detailed attempts, and your Neon-backed xAPI history.
          </p>
        </header>
        <div className="card text-sm text-charcoal/70">
          You need to log in before we can display your compliance training records.
        </div>
      </section>
    );
  }

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((enrollment) => enrollment.completed).length;
  const averageScore =
    enrollments.length > 0
      ? enrollments.reduce((sum, enrollment) => sum + (enrollment.score ?? 0), 0) / enrollments.length
      : 0;

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-secondary">Learner dashboard</h1>
        <p className="text-sm text-charcoal/70">
          Track progress across your assigned ethics and compliance pathways. Learning statements are captured in
          real time to keep compliance reporting audit-ready.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <h2 className="text-sm font-semibold text-secondary">Courses in progress</h2>
          <p className="mt-2 text-3xl font-bold text-secondary">{totalCourses}</p>
          <p className="text-xs text-charcoal/60">Active enrolments for {user.email}</p>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-secondary">Completion rate</h2>
          <ProgressDonut value={totalCourses > 0 ? completedCourses / totalCourses : 0} />
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-secondary">Average score</h2>
          <p className="mt-2 text-3xl font-bold text-secondary">{averageScore.toFixed(0)}%</p>
          <p className="text-xs text-charcoal/60">Calculated from xAPI result scores</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-secondary">Course progress</h2>
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <article key={enrollment.id} className="card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-secondary">{enrollment.course.title}</h3>
                    <p className="text-xs text-charcoal/60">{enrollment.course.description}</p>
                  </div>
                  <span className="badge bg-secondary/10 text-secondary">
                    {Math.round((enrollment.progress ?? 0) * 100)}% complete
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/10">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: `${Math.round((enrollment.progress ?? 0) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-charcoal/60">
                  <span>Score: {enrollment.score ? `${Math.round(enrollment.score)}%` : "—"}</span>
                  <span>Status: {enrollment.completed ? "Completed" : "In progress"}</span>
                  <span>Time spent: {enrollment.totalTimeMinutes} mins</span>
                  <span>Statements: {enrollment.statements.length}</span>
                </div>
              </article>
            ))}
            {enrollments.length === 0 && (
              <div className="card text-sm text-charcoal/60">
                No active enrolments. Launch a course to start capturing experience data.
              </div>
            )}
            {status && <p className="text-xs text-charcoal/60">{status}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-secondary">Recent xAPI statements</h2>
          <StatementStream statements={enrollments.flatMap((enrollment) => enrollment.statements)} />
        </div>
      </div>
    </section>
  );
}
