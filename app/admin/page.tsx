import { prisma } from "../../lib/prisma";
import AdminCourseManager from "../../components/AdminCourseManager";

export default async function AdminPage() {
  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: {
          lessons: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-secondary">Admin: Course builder</h1>
        <p className="text-sm text-charcoal/70">
          Configure complex ethics and compliance journeys with nested modules, multimedia lessons and
          assessment scoring. All changes are reflected instantly and tracked against the Neon database.
        </p>
      </header>

      <AdminCourseManager initialCourses={courses} />
    </section>
  );
}
