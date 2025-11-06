import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { validateXAPIStatement, XAPIStatement } from "../../../lib/xapi";

interface XAPIRequestBody {
  statement: XAPIStatement;
  courseId?: string;
  enrollmentId?: string;
  userId?: string;
  progress?: number;
  score?: number;
  completed?: boolean;
}

export async function POST(request: Request) {
  const body = (await request.json()) as XAPIRequestBody | XAPIStatement;
  const payload: XAPIRequestBody =
    "statement" in body
      ? (body as XAPIRequestBody)
      : { statement: body as XAPIStatement };

  try {
    validateXAPIStatement(payload.statement);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 400 });
  }

  const userId = payload.userId ?? payload.statement.actor.account?.name ?? payload.statement.actor.mbox;
  let courseId = payload.courseId;

  if (!courseId) {
    const courseContext = (payload.statement.context as { course?: { id?: string } } | undefined)?.course;
    if (courseContext?.id) {
      courseId = courseContext.id.split("/").pop();
    }
  }

  let enrollmentId = payload.enrollmentId;

  if (!enrollmentId && userId && courseId) {
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      create: {
        userId,
        courseId
      },
      update: {}
    });

    enrollmentId = enrollment.id;

    if (typeof payload.progress === "number" || typeof payload.score === "number") {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progress: typeof payload.progress === "number" ? payload.progress : undefined,
          score: typeof payload.score === "number" ? payload.score : undefined,
          completed: payload.completed ?? enrollment.completed
        }
      });
    }
  }

  const statement = await prisma.xAPIStatement.create({
    data: {
      actor: payload.statement.actor,
      verb: payload.statement.verb,
      object: payload.statement.object,
      result: payload.statement.result,
      context: payload.statement.context,
      enrollmentId
    }
  });

  return NextResponse.json({ statement, enrollmentId }, { status: 201 });
}
