import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth";

interface Params {
  params: { id: string };
}

const courseInclude = {
  modules: {
    include: {
      lessons: {
        orderBy: { orderIndex: "asc" }
      }
    },
    orderBy: { orderIndex: "asc" }
  }
} as const;

export async function GET(_: NextRequest, { params }: Params) {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: courseInclude
  });

  if (!course) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ course });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }

  await prisma.course.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Course deleted" }, { status: 200 });
}
