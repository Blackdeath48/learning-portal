import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

type LessonDraft = {
  id?: string;
  title: string;
  content: string;
  mediaUrl?: string | null;
  duration?: number | null;
  orderIndex?: number;
};

type ModuleDraft = {
  id?: string;
  title: string;
  objective?: string | null;
  orderIndex?: number;
  lessons: LessonDraft[];
};

type CourseDraft = {
  id?: string;
  title: string;
  description: string;
  category?: string | null;
  complianceArea?: string | null;
  level?: string | null;
  durationMins?: number | null;
  tags?: string[];
  modules: ModuleDraft[];
};

export async function GET() {
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

  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CourseDraft;
  const modules = body.modules ?? [];

  const course = await prisma.course.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      complianceArea: body.complianceArea,
      level: body.level,
      durationMins: body.durationMins,
      tags: body.tags ?? [],
      modules: {
        create: modules.map((module, moduleIndex) => ({
          id: module.id,
          title: module.title,
          objective: module.objective,
          orderIndex: module.orderIndex ?? moduleIndex,
          lessons: {
            create: (module.lessons ?? []).map((lesson, lessonIndex) => ({
              id: lesson.id,
              title: lesson.title,
              content: lesson.content,
              mediaUrl: lesson.mediaUrl,
              duration: lesson.duration,
              orderIndex: lesson.orderIndex ?? lessonIndex
            }))
          }
        }))
      }
    }
  });

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

  return NextResponse.json({ course, courses }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as CourseDraft;
  const modules = body.modules ?? [];

  if (!body.id) {
    return NextResponse.json({ message: "Course id is required" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.course.update({
      where: { id: body.id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        complianceArea: body.complianceArea,
        level: body.level,
        durationMins: body.durationMins,
        tags: body.tags ?? []
      }
    });

    const existingModules = await tx.module.findMany({
      where: { courseId: body.id },
      include: { lessons: true }
    });

    const bodyModuleIds = new Set(modules.map((module) => module.id).filter(Boolean) as string[]);
    const modulesToDelete = existingModules.filter((module) => !bodyModuleIds.has(module.id));

    if (modulesToDelete.length > 0) {
      await tx.lesson.deleteMany({ where: { moduleId: { in: modulesToDelete.map((module) => module.id) } } });
      await tx.module.deleteMany({ where: { id: { in: modulesToDelete.map((module) => module.id) } } });
    }

    for (const [moduleIndex, module] of modules.entries()) {
      const existingModule = module.id
        ? existingModules.find((existing) => existing.id === module.id)
        : undefined;

      if (!existingModule) {
        await tx.module.create({
          data: {
            id: module.id,
            courseId: body.id,
            title: module.title,
            objective: module.objective,
            orderIndex: module.orderIndex ?? moduleIndex,
            lessons: {
              create: (module.lessons ?? []).map((lesson, lessonIndex) => ({
                id: lesson.id,
                title: lesson.title,
                content: lesson.content,
                mediaUrl: lesson.mediaUrl,
                duration: lesson.duration,
                orderIndex: lesson.orderIndex ?? lessonIndex
              }))
            }
          }
        });
        continue;
      }

      await tx.module.update({
        where: { id: existingModule.id },
        data: {
          title: module.title,
          objective: module.objective,
          orderIndex: module.orderIndex ?? moduleIndex
        }
      });

      const lessonIds = new Set((module.lessons ?? []).map((lesson) => lesson.id).filter(Boolean) as string[]);
      const lessonsToDelete = existingModule.lessons.filter((lesson) => !lessonIds.has(lesson.id));

      if (lessonsToDelete.length > 0) {
        await tx.lesson.deleteMany({ where: { id: { in: lessonsToDelete.map((lesson) => lesson.id) } } });
      }

      for (const [lessonIndex, lesson] of (module.lessons ?? []).entries()) {
        const existingLesson = lesson.id
          ? existingModule.lessons.find((existing) => existing.id === lesson.id)
          : undefined;

        if (!existingLesson) {
          await tx.lesson.create({
            data: {
              id: lesson.id,
              moduleId: existingModule.id,
              title: lesson.title,
              content: lesson.content,
              mediaUrl: lesson.mediaUrl,
              duration: lesson.duration,
              orderIndex: lesson.orderIndex ?? lessonIndex
            }
          });
        } else {
          await tx.lesson.update({
            where: { id: existingLesson.id },
            data: {
              title: lesson.title,
              content: lesson.content,
              mediaUrl: lesson.mediaUrl,
              duration: lesson.duration,
              orderIndex: lesson.orderIndex ?? lessonIndex
            }
          });
        }
      }
    }
  });

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

  const course = courses.find((course) => course.id === body.id);

  return NextResponse.json({ course, courses });
}
