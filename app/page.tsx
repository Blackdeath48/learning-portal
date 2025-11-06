import Link from "next/link";
import { prisma } from "../lib/prisma";

async function fetchHighlights() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      modules: {
        include: {
          lessons: true
        }
      },
      enrollments: true
    }
  });

  return courses.map((course) => ({
    ...course,
    totalLessons: course.modules.reduce((count, module) => count + module.lessons.length, 0),
    averageScore:
      course.enrollments.length > 0
        ? course.enrollments.reduce((sum, enrollment) => sum + (enrollment.score ?? 0), 0) /
          course.enrollments.length
        : null
  }));
}

export default async function HomePage() {
  const highlights = await fetchHighlights();

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-12">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <span className="badge">xAPI Compliant Corporate Learning</span>
          <h1 className="text-4xl font-bold text-secondary md:text-5xl">
            Elevate your ethics & compliance culture with insight-rich learning.
          </h1>
          <p className="text-base text-charcoal/80">
            EthixLearn delivers modern, mobile-ready training with granular xAPI tracking so compliance
            teams can document, report and continuously improve their workforce programmes.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link className="button-primary" href="/courses">
              Explore Courses
            </Link>
            <Link className="button-secondary" href="/dashboard">
              View Progress
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary">Experience APIs built-in</h3>
            <p className="text-sm text-charcoal/70">
              Every learning interaction is captured as an xAPI statement in our Neon-backed Learning Record
              Store, ready for compliance audits and data storytelling.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary">Adaptive course architecture</h3>
            <p className="text-sm text-charcoal/70">
              Design flexible modules, multimedia lessons and assessments that keep learners engaged across
              devices while meeting regulatory standards.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary">Executive-grade analytics</h3>
            <p className="text-sm text-charcoal/70">
              Monitor completion trends, scores and compliance risks from a single dashboard tailored for
              senior stakeholders.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-secondary">Featured courses</h2>
          <Link className="text-sm font-semibold text-secondary" href="/courses">
            View all courses
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((course) => (
            <article key={course.id} className="card space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-secondary">{course.title}</h3>
                <p className="text-sm text-charcoal/70">{course.description}</p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs text-charcoal/70">
                <div>
                  <dt className="font-semibold text-secondary">Modules</dt>
                  <dd>{course.modules.length}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-secondary">Lessons</dt>
                  <dd>{course.totalLessons}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-secondary">Avg score</dt>
                  <dd>{course.averageScore ? `${course.averageScore.toFixed(0)}%` : "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-secondary">Enrolled</dt>
                  <dd>{course.enrollments.length}</dd>
                </div>
              </dl>
              <Link className="button-secondary w-full justify-center" href={`/courses/${course.id}`}>
                View course
              </Link>
            </article>
          ))}
          {highlights.length === 0 && (
            <div className="card col-span-full text-sm text-charcoal/70">
              No courses yet. Admins can create a course from the Admin workspace.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
