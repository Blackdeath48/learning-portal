import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        include: {
          lessons: true
        }
      }
    }
  });

  if (!course) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ course });
}

export async function DELETE(_: Request, { params }: Params) {
  await prisma.course.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Course deleted" }, { status: 200 });
}
