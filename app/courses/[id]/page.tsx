import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import LearningModulePlayer from "../../../components/LearningModulePlayer";

interface CoursePageProps {
  params: { id: string };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" }
          }
        },
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!course) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-secondary">{course.title}</h1>
        <p className="text-sm text-charcoal/70">{course.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-charcoal/60">
          {course.category && <span className="badge">{course.category}</span>}
          {course.complianceArea && <span className="badge">{course.complianceArea}</span>}
          {course.tags.map((tag) => (
            <span key={tag} className="badge bg-secondary/10 text-secondary">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <LearningModulePlayer course={course} />
    </section>
  );
}
