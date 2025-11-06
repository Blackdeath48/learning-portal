"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { useAuth } from "../hooks/useAuth";

type LessonDraft = {
  id?: string;
  title: string;
  content: string;
  mediaUrl?: string;
  duration?: number | null;
  orderIndex?: number;
};

type ModuleDraft = {
  id?: string;
  title: string;
  objective?: string;
  orderIndex?: number;
  lessons: LessonDraft[];
};

type CourseDraft = {
  id?: string;
  title: string;
  description: string;
  category?: string;
  complianceArea?: string;
  level?: string;
  durationMins?: number | null;
  tags: string[];
  modules: ModuleDraft[];
};

type CourseResponse = CourseDraft & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

const emptyDraft: CourseDraft = {
  title: "",
  description: "",
  category: "",
  complianceArea: "",
  level: "Intermediate",
  durationMins: 45,
  tags: [],
  modules: []
};

export default function AdminCourseManager() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [draft, setDraft] = useState<CourseDraft>(emptyDraft);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/courses");
      const data = (await response.json()) as { courses: CourseResponse[] };
      setCourses(data.courses);
      setStatus(null);
    } catch (error) {
      console.error(error);
      setStatus("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const resetDraft = () => setDraft({ ...emptyDraft });

  const saveCourse = async () => {
    if (!token) {
      setStatus("Authentication required");
      return;
    }

    setStatus(draft.id ? "Updating course..." : "Creating course...");
    const method = draft.id ? "PUT" : "POST";

    try {
      const response = await fetch("/api/courses", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(draft)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to save course" }));
        setStatus(error.message ?? "Failed to save course");
        return;
      }

      const data = (await response.json()) as { courses: CourseResponse[] };
      setCourses(data.courses);
      setStatus("Course saved successfully");
      resetDraft();
    } catch (error) {
      console.error(error);
      setStatus("Failed to save course");
    }
  };

  const deleteCourse = async (id: string) => {
    if (!token) {
      setStatus("Authentication required");
      return;
    }

    setStatus("Deleting course...");
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to delete course" }));
        setStatus(error.message ?? "Failed to delete course");
        return;
      }

      setCourses((prev) => prev.filter((course) => course.id !== id));
      if (draft.id === id) {
        resetDraft();
      }
      setStatus("Course removed");
    } catch (error) {
      console.error(error);
      setStatus("Failed to delete course");
    }
  };

  const loadDraft = (course: CourseResponse) => {
    setDraft({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      complianceArea: course.complianceArea,
      level: course.level,
      durationMins: course.durationMins,
      tags: course.tags ?? [],
      modules: (course.modules ?? []).map(({ lessons, courseId: _courseId, ...module }) => ({
        ...module,
        lessons: (lessons ?? []).map(({ moduleId: _moduleId, ...lesson }) => ({ ...lesson }))
      }))
    });
  };

  const updateDraft = (updates: Partial<CourseDraft>) => {
    setDraft((current) => ({ ...current, ...updates }));
  };

  const addModule = () => {
    setDraft((current) => ({
      ...current,
      modules: [
        ...current.modules,
        { id: uuid(), title: "New module", objective: "", orderIndex: current.modules.length, lessons: [] }
      ]
    }));
  };

  const updateModule = (moduleId: string, updates: Partial<ModuleDraft>) => {
    setDraft((current) => ({
      ...current,
      modules: current.modules.map((module) => (module.id === moduleId ? { ...module, ...updates } : module))
    }));
  };

  const removeModule = (moduleId: string) => {
    setDraft((current) => ({
      ...current,
      modules: current.modules.filter((module) => module.id !== moduleId)
    }));
  };

  const addLesson = (moduleId: string) => {
    setDraft((current) => ({
      ...current,
      modules: current.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: [
                ...module.lessons,
                {
                  id: uuid(),
                  title: "New lesson",
                  content: "",
                  orderIndex: module.lessons.length
                }
              ]
            }
          : module
      )
    }));
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<LessonDraft>) => {
    setDraft((current) => ({
      ...current,
      modules: current.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === lessonId ? { ...lesson, ...updates } : lesson
              )
            }
          : module
      )
    }));
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setDraft((current) => ({
      ...current,
      modules: current.modules.map((module) =>
        module.id === moduleId
          ? { ...module, lessons: module.lessons.filter((lesson) => lesson.id !== lessonId) }
          : module
      )
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
      <aside className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary">Courses</h2>
          <button type="button" className="button-secondary" onClick={loadCourses}>
            Refresh
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {loading && <p className="text-charcoal/60">Loading courses...</p>}
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => loadDraft(course)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                draft.id === course.id
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-secondary/20 hover:border-secondary/50"
              }`}
            >
              <span className="block text-xs uppercase tracking-wide text-secondary/60">
                Updated {new Date(course.updatedAt).toLocaleDateString()}
              </span>
              <span className="font-semibold">{course.title}</span>
            </button>
          ))}
          {courses.length === 0 && !loading && (
            <p className="text-sm text-charcoal/60">No courses yet. Create your first training path.</p>
          )}
        </div>
        <button type="button" className="button-primary w-full" onClick={resetDraft}>
          New course
        </button>
        {draft.id && (
          <button
            type="button"
            className="w-full rounded-full border border-red-500 px-4 py-2 text-red-600 transition hover:bg-red-50"
            onClick={() => draft.id && deleteCourse(draft.id)}
          >
            Delete course
          </button>
        )}
        {status && <p className="text-xs text-charcoal/60">{status}</p>}
      </aside>

      <form
        className="card space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void saveCourse();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-secondary">Title</span>
            <input
              required
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-secondary">Category</span>
            <input
              value={draft.category ?? ""}
              onChange={(event) => updateDraft({ category: event.target.value })}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="font-semibold text-secondary">Description</span>
            <textarea
              required
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
              className="textarea"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-secondary">Compliance area</span>
            <input
              value={draft.complianceArea ?? ""}
              onChange={(event) => updateDraft({ complianceArea: event.target.value })}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-secondary">Level</span>
            <input
              value={draft.level ?? ""}
              onChange={(event) => updateDraft({ level: event.target.value })}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-secondary">Duration (mins)</span>
            <input
              type="number"
              value={draft.durationMins ?? 0}
              onChange={(event) => updateDraft({ durationMins: Number(event.target.value) })}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-secondary">Tags</span>
            <input
              value={draft.tags.join(", ")}
              onChange={(event) => updateDraft({ tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })}
              placeholder="ethics, privacy, anti-bribery"
              className="input"
            />
          </label>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary">Modules</h3>
            <button type="button" className="button-secondary" onClick={addModule}>
              Add module
            </button>
          </div>
          <div className="space-y-4">
            {draft.modules.map((module) => (
              <div key={module.id} className="rounded-lg border border-secondary/20 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-2 text-sm">
                    <input
                      value={module.title}
                      onChange={(event) => updateModule(module.id!, { title: event.target.value })}
                      className="input"
                      placeholder="Module title"
                    />
                    <textarea
                      value={module.objective ?? ""}
                      onChange={(event) => updateModule(module.id!, { objective: event.target.value })}
                      className="textarea"
                      placeholder="Learning objectives"
                    />
                  </div>
                  <div className="flex gap-2 self-start">
                    <input
                      type="number"
                      className="input w-24"
                      value={module.orderIndex ?? 0}
                      onChange={(event) => updateModule(module.id!, { orderIndex: Number(event.target.value) })}
                    />
                    <button
                      type="button"
                      className="rounded-full border border-red-500 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50"
                      onClick={() => removeModule(module.id!)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-secondary">Lessons</span>
                    <button type="button" className="button-secondary" onClick={() => addLesson(module.id!)}>
                      Add lesson
                    </button>
                  </div>
                  {module.lessons.map((lesson) => (
                    <div key={lesson.id} className="rounded border border-secondary/20 p-3 text-sm">
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          value={lesson.title}
                          onChange={(event) => updateLesson(module.id!, lesson.id!, { title: event.target.value })}
                          className="input"
                          placeholder="Lesson title"
                        />
                        <input
                          value={lesson.mediaUrl ?? ""}
                          onChange={(event) => updateLesson(module.id!, lesson.id!, { mediaUrl: event.target.value })}
                          className="input"
                          placeholder="Media URL (optional)"
                        />
                        <textarea
                          value={lesson.content}
                          onChange={(event) => updateLesson(module.id!, lesson.id!, { content: event.target.value })}
                          className="textarea md:col-span-2"
                          placeholder="Lesson content"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            className="input w-24"
                            value={lesson.orderIndex ?? 0}
                            onChange={(event) => updateLesson(module.id!, lesson.id!, { orderIndex: Number(event.target.value) })}
                          />
                          <input
                            type="number"
                            className="input w-24"
                            value={lesson.duration ?? 0}
                            onChange={(event) => updateLesson(module.id!, lesson.id!, { duration: Number(event.target.value) })}
                            placeholder="Duration"
                          />
                        </div>
                        <button
                          type="button"
                          className="rounded-full border border-red-500 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50"
                          onClick={() => removeLesson(module.id!, lesson.id!)}
                        >
                          Remove lesson
                        </button>
                      </div>
                    </div>
                  ))}
                  {module.lessons.length === 0 && (
                    <p className="rounded border border-dashed border-secondary/30 p-3 text-xs text-charcoal/60">
                      No lessons yet. Add your first piece of content.
                    </p>
                  )}
                </div>
              </div>
            ))}
            {draft.modules.length === 0 && (
              <p className="rounded border border-dashed border-secondary/30 p-4 text-sm text-charcoal/60">
                Add modules to structure your ethics pathway. Each module can include multiple multimedia lessons.
              </p>
            )}
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="button-primary">
            {draft.id ? "Update course" : "Create course"}
          </button>
        </div>
      </form>
    </div>
  );
}
