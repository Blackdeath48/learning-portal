import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin, requireAuth } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  let authUser;
  try {
    authUser = await requireAuth(request);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? authUser.id;

  if (userId !== authUser.id && authUser.role !== "ADMIN") {
    return NextResponse.json({ message: "Not authorized to view other learners" }, { status: 403 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: true,
      statements: {
        orderBy: { timestamp: "desc" },
        take: 12
      },
      progressSnapshots: {
        orderBy: { recordedAt: "desc" }
      },
      attempts: {
        orderBy: { attemptNo: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ enrollments });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }

  const { userId, courseId } = (await request.json()) as { userId?: string; courseId?: string };

  if (!userId || !courseId) {
    return NextResponse.json({ message: "userId and courseId are required" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId },
    update: {}
  });

  return NextResponse.json({ enrollment }, { status: 201 });
}
