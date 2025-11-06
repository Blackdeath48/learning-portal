import { XAPIStatement } from "./xapi";

interface RecordOptions {
  courseId?: string;
  enrollmentId?: string;
  userId?: string;
  progress?: number;
  score?: number;
  completed?: boolean;
}

export async function recordStatement(statement: XAPIStatement, options: RecordOptions = {}) {
  const response = await fetch("/api/xapi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statement, ...options })
  });

  if (!response.ok) {
    throw new Error("Failed to record xAPI statement");
  }

  return response.json();
}
