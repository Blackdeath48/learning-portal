import Link from "next/link";
import { prisma } from "../../lib/prisma";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    include: {
      modules: true
    }
  });

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Course catalog</h1>
          <p className="text-sm text-charcoal/70">
            Browse the complete library of ethics and compliance programmes curated for regulated
            industries. Each course captures detailed xAPI statements for confident reporting.
          </p>
        </div>
        <Link href="/admin" className="button-secondary">
          Manage courses
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {courses.map((course) => (
          <article key={course.id} className="card space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-secondary">{course.title}</h2>
              <p className="text-sm text-charcoal/70">{course.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal/70">
              {course.category && <span className="badge">{course.category}</span>}
              {course.complianceArea && <span className="badge">{course.complianceArea}</span>}
              {course.tags.map((tag) => (
                <span key={tag} className="badge bg-secondary/10 text-secondary">
                  {tag}
                </span>
              ))}
            </div>
            <dl className="grid grid-cols-3 gap-4 text-xs text-charcoal/70">
              <div>
                <dt className="font-semibold text-secondary">Level</dt>
                <dd>{course.level}</dd>
              </div>
              <div>
                <dt className="font-semibold text-secondary">Modules</dt>
                <dd>{course.modules.length}</dd>
              </div>
              <div>
                <dt className="font-semibold text-secondary">Duration</dt>
                <dd>{course.durationMins ? `${course.durationMins} mins` : "Flexible"}</dd>
              </div>
            </dl>
            <Link href={`/courses/${course.id}`} className="button-primary w-full justify-center">
              Launch course
            </Link>
          </article>
        ))}
        {courses.length === 0 && (
          <div className="card col-span-full text-sm text-charcoal/70">
            No courses available yet. Administrators can add courses from the Admin workspace.
          </div>
        )}
      </div>
    </section>
  );
}
