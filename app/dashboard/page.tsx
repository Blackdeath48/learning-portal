import { prisma } from "../../lib/prisma";
import ProgressDonut from "../../components/ProgressDonut";
import StatementStream from "../../components/StatementStream";

const DEMO_USER = "demo-user";

export default async function DashboardPage() {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: DEMO_USER },
    include: {
      course: true,
      statements: {
        orderBy: { timestamp: "desc" },
        take: 12
      }
    }
  });

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
          Track progress across your assigned ethics and compliance pathways. Learning statements are
          captured in real time to keep compliance reporting audit-ready.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <h2 className="text-sm font-semibold text-secondary">Courses in progress</h2>
          <p className="mt-2 text-3xl font-bold text-secondary">{totalCourses}</p>
          <p className="text-xs text-charcoal/60">Active enrolments for {DEMO_USER}</p>
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
                  <span>Statements: {enrollment.statements.length}</span>
                </div>
              </article>
            ))}
            {enrollments.length === 0 && (
              <div className="card text-sm text-charcoal/60">
                No active enrolments. Launch a course to start capturing experience data.
              </div>
            )}
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
