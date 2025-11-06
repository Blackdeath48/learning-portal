"use client";

import { useEffect, useRef, useState } from "react";
import type { Course, Module, Lesson } from "@prisma/client";
import { recordStatement } from "../lib/xapi-client";
import { useAuth } from "../hooks/useAuth";

interface CourseWithStructure extends Course {
  modules: (Module & { lessons: Lesson[] })[];
}

interface Props {
  course: CourseWithStructure;
}

export default function LearningModulePlayer({ course }: Props) {
  const { user, token } = useAuth();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [attemptNo, setAttemptNo] = useState(1);
  const lessonStartRef = useRef<number>(Date.now());
  const totalLessons = course.modules.reduce((count, module) => count + module.lessons.length, 0);
  const currentModule = course.modules[currentModuleIndex];
  const currentLesson = currentModule?.lessons[currentLessonIndex];

  useEffect(() => {
    lessonStartRef.current = Date.now();
  }, [currentModuleIndex, currentLessonIndex]);

  if (!currentModule || !currentLesson) {
    return <div className="card">This course is awaiting lesson content.</div>;
  }

  if (!user || !token) {
    return (
      <div className="card space-y-3 text-sm text-charcoal/70">
        <h2 className="text-lg font-semibold text-secondary">Sign in to launch training</h2>
        <p>
          You need to be logged in to capture your xAPI learning records and track compliance completion. Please
          sign in or create an account to continue.
        </p>
      </div>
    );
  }

  const handleAdvance = async () => {
    const completedLessonsBefore = course.modules
      .slice(0, currentModuleIndex)
      .reduce((count, module) => count + module.lessons.length, 0);

    const completedLessons = Math.min(
      totalLessons,
      completedLessonsBefore + currentLessonIndex + 1
    );
    const progress = totalLessons > 0 ? completedLessons / totalLessons : 0;
    const completed = completedLessons === totalLessons;

    const timeSpentMins = Math.max(1, Math.round((Date.now() - lessonStartRef.current) / 60000));

    await recordStatement(
      {
        actor: {
          mbox: `mailto:${user.email}`,
          name: user.name ?? user.email
        },
        verb: {
          id: "http://adlnet.gov/expapi/verbs/completed",
          display: { "en-US": "completed" }
        },
        object: {
          id: `https://ethixlearn.example/courses/${course.id}/lessons/${currentLesson.id}`,
          definition: {
            name: { "en-US": currentLesson.title },
            description: { "en-US": currentLesson.content.slice(0, 80) }
          }
        },
        result: {
          completion: true,
          success: true
        },
        context: {
          course: {
            id: `https://ethixlearn.example/courses/${course.id}`,
            title: course.title
          }
        }
      },
      {
        courseId: course.id,
        userId: user.id,
        progress,
        completed,
        score: completed ? 100 : undefined,
        timeSpentMins,
        attemptNo
      },
      token
    );

    if (currentLessonIndex < currentModule.lessons.length - 1) {
      setCurrentLessonIndex((index) => index + 1);
    } else if (currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex((index) => index + 1);
      setCurrentLessonIndex(0);
    }

    setAttemptNo((count) => count + 1);
    lessonStartRef.current = Date.now();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
      <aside className="card space-y-3">
        <h2 className="text-lg font-semibold text-secondary">Course outline</h2>
        <ul className="space-y-2 text-sm">
          {course.modules.map((module, moduleIndex) => (
            <li key={module.id}>
              <button
                type="button"
                onClick={() => {
                  setCurrentModuleIndex(moduleIndex);
                  setCurrentLessonIndex(0);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left transition ${
                  moduleIndex === currentModuleIndex
                    ? "bg-secondary/10 font-semibold text-secondary"
                    : "hover:bg-secondary/10"
                }`}
              >
                <span className="block text-xs uppercase tracking-wide text-secondary/70">
                  Module {moduleIndex + 1}
                </span>
                {module.title}
              </button>
              <ul className="mt-1 space-y-1 pl-4 text-xs">
                {module.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentModuleIndex(moduleIndex);
                        setCurrentLessonIndex(lessonIndex);
                      }}
                      className={`w-full rounded px-2 py-1 text-left transition ${
                        moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex
                          ? "bg-accent/20 text-secondary"
                          : "hover:bg-accent/20"
                      }`}
                    >
                      {lesson.title}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </aside>

      <article className="card space-y-4">
        <header>
          <span className="badge">Module {currentModuleIndex + 1}</span>
          <h2 className="mt-2 text-2xl font-semibold text-secondary">{currentLesson.title}</h2>
          <p className="text-sm text-charcoal/70">{currentLesson.content}</p>
        </header>

        {currentLesson.mediaUrl && (
          <div className="overflow-hidden rounded-lg">
            <iframe
              src={currentLesson.mediaUrl}
              title={currentLesson.title}
              className="h-64 w-full rounded-lg border border-secondary/10"
              allow="fullscreen"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={handleAdvance} className="button-primary">
            Mark lesson complete
          </button>
          <span className="text-xs text-charcoal/60">
            Completion is tracked via xAPI statements stored in Neon.
          </span>
        </div>
      </article>
    </div>
  );
}
