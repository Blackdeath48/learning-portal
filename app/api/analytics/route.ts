import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }

  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: { select: { id: true, email: true, name: true } },
      course: { select: { id: true, title: true } },
      progressSnapshots: { orderBy: { recordedAt: "asc" } },
      attempts: { orderBy: { attemptNo: "asc" } }
    }
  });

  const totalEnrollments = enrollments.length;
  const completedCount = enrollments.filter((enrollment) => enrollment.completed).length;
  const averageProgress =
    totalEnrollments > 0
      ? enrollments.reduce((sum, enrollment) => sum + (enrollment.progress ?? 0), 0) / totalEnrollments
      : 0;
  const averageScore =
    totalEnrollments > 0
      ? enrollments.reduce((sum, enrollment) => sum + (enrollment.score ?? 0), 0) / totalEnrollments
      : 0;
  const totalTime = enrollments.reduce((sum, enrollment) => sum + (enrollment.totalTimeMinutes ?? 0), 0);

  const summary = enrollments.map((enrollment) => ({
    enrollmentId: enrollment.id,
    learner: {
      id: enrollment.user.id,
      email: enrollment.user.email,
      name: enrollment.user.name
    },
    course: {
      id: enrollment.course.id,
      title: enrollment.course.title
    },
    progress: enrollment.progress,
    score: enrollment.score,
    completed: enrollment.completed,
    totalTimeMinutes: enrollment.totalTimeMinutes,
    attempts: enrollment.attempts.map((attempt) => ({
      attemptNo: attempt.attemptNo,
      score: attempt.score,
      timeSpentMins: attempt.timeSpentMins,
      completedAt: attempt.completedAt
    })),
    progressTimeline: enrollment.progressSnapshots.map((snapshot) => ({
      recordedAt: snapshot.recordedAt,
      progress: snapshot.progress,
      score: snapshot.score,
      timeSpentMins: snapshot.timeSpentMins
    }))
  }));

  return NextResponse.json({
    totals: {
      totalEnrollments,
      completedCount,
      completionRate: totalEnrollments > 0 ? completedCount / totalEnrollments : 0,
      averageProgress,
      averageScore,
      totalTimeMinutes: totalTime
    },
    summary
  });
}
