import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";
import { validateXAPIStatement, XAPIStatement } from "../../../lib/xapi";

interface XAPIRequestBody {
  statement: XAPIStatement;
  courseId?: string;
  enrollmentId?: string;
  userId?: string;
  progress?: number;
  score?: number;
  completed?: boolean;
  timeSpentMins?: number;
  attemptNo?: number;
}

export async function POST(request: NextRequest) {
  let authUser;
  try {
    authUser = await requireAuth(request);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }

  const body = (await request.json()) as XAPIRequestBody | XAPIStatement;
  const payload: XAPIRequestBody =
    "statement" in body ? (body as XAPIRequestBody) : { statement: body as XAPIStatement };

  try {
    validateXAPIStatement(payload.statement);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 400 });
  }

  let targetUserId = payload.userId ?? authUser.id;

  if (payload.userId && payload.userId !== authUser.id && authUser.role !== "ADMIN") {
    return NextResponse.json({ message: "Not authorized to write statements for other users" }, { status: 403 });
  }

  if (!targetUserId && payload.statement.actor?.mbox) {
    const email = payload.statement.actor.mbox.replace("mailto:", "");
    const user = await prisma.user.findUnique({ where: { email } });
    targetUserId = user?.id ?? undefined;
  }

  if (!targetUserId) {
    return NextResponse.json({ message: "Unable to determine learner for statement" }, { status: 400 });
  }

  let courseId = payload.courseId;
  if (!courseId) {
    const courseContext = (payload.statement.context as { course?: { id?: string } } | undefined)?.course;
    if (courseContext?.id) {
      courseId = courseContext.id.split("/").pop();
    }
  }

  if (!courseId) {
    return NextResponse.json({ message: "Course id is required" }, { status: 400 });
  }

  const timeSpentMins = Math.max(0, Math.round(payload.timeSpentMins ?? 0));
  const progress = typeof payload.progress === "number" ? Math.max(0, Math.min(1, payload.progress)) : undefined;
  const score = typeof payload.score === "number" ? payload.score : undefined;
  const completed = payload.completed ?? false;
  const attemptNo = payload.attemptNo && payload.attemptNo > 0 ? Math.floor(payload.attemptNo) : undefined;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let enrollmentId = payload.enrollmentId ?? null;
      let enrollment;

    if (enrollmentId) {
      enrollment = await tx.enrollment.findUnique({ where: { id: enrollmentId } });
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }
      if (enrollment.userId !== targetUserId) {
        throw new Error("Enrollment does not belong to user");
      }
    } else {
      enrollment = await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: targetUserId,
            courseId
          }
        },
        create: {
          userId: targetUserId,
          courseId
        },
        update: {}
      });
      enrollmentId = enrollment.id;
    }

    const updates: Record<string, unknown> = {};
    if (typeof progress === "number") {
      updates.progress = progress;
    }
    if (typeof score === "number") {
      updates.score = score;
    }
    if (completed) {
      updates.completed = true;
    }
    if (timeSpentMins > 0) {
      updates.totalTimeMinutes = { increment: timeSpentMins };
    }

    if (Object.keys(updates).length > 0) {
      enrollment = await tx.enrollment.update({
        where: { id: enrollmentId },
        data: updates
      });
    }

    if (timeSpentMins > 0 || typeof progress === "number" || typeof score === "number") {
      await tx.progressMetric.create({
        data: {
          enrollmentId,
          timeSpentMins,
          progress: progress ?? enrollment.progress,
          score
        }
      });
    }

    if (attemptNo) {
      await tx.learningAttempt.upsert({
        where: { enrollmentId_attemptNo: { enrollmentId, attemptNo } },
        create: {
          enrollmentId,
          attemptNo,
          score,
          timeSpentMins,
          completedAt: completed ? new Date() : null
        },
        update: {
          score: typeof score === "number" ? score : undefined,
          timeSpentMins: timeSpentMins > 0 ? { increment: timeSpentMins } : undefined,
          completedAt: completed ? new Date() : undefined
        }
      });
    }

    const statement = await tx.xAPIStatement.create({
      data: {
        actor: payload.statement.actor,
        verb: payload.statement.verb,
        object: payload.statement.object,
        result: payload.statement.result,
        context: payload.statement.context,
        enrollmentId
      }
    });

      return { statement, enrollmentId };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 400 });
  }
}
