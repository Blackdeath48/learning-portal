"use client";

import { useState } from "react";
import type { Course, Module, Lesson } from "@prisma/client";
import { v4 as uuid } from "uuid";

interface CourseWithRelations extends Course {
  modules: (Module & { lessons: Lesson[] })[];
}

interface AdminCourseManagerProps {
  initialCourses: CourseWithRelations[];
}

type CourseDraft = Omit<Course, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  modules: (Omit<Module, "courseId"> & {
    id?: string;
    lessons: (Omit<Lesson, "moduleId"> & { id?: string })[];
  })[];
};

async function saveCourse(course: CourseDraft) {
  const response = await fetch("/api/courses", {
    method: course.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(course)
  });

  if (!response.ok) {
    throw new Error("Unable to save course");
  }

  return response.json();
}

async function deleteCourse(id: string) {
  const response = await fetch(`/api/courses/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Unable to delete course");
  }
}

export default function AdminCourseManager({ initialCourses }: AdminCourseManagerProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [draft, setDraft] = useState<CourseDraft>({
    id: undefined,
    title: "",
    description: "",
    category: "",
    complianceArea: "",
    durationMins: 45,
    level: "Intermediate",
    tags: [],
    modules: []
  });
  const [status, setStatus] = useState<string | null>(null);

  const resetDraft = () =>
    setDraft({
      id: undefined,
      title: "",
      description: "",
      category: "",
      complianceArea: "",
      durationMins: 45,
      level: "Intermediate",
      tags: [],
      modules: []
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Saving course...");
    try {
      const saved = await saveCourse(draft);
      setCourses(saved.courses);
      resetDraft();
      setStatus("Course saved successfully.");
    } catch (error) {
      console.error(error);
      setStatus("Failed to save course. Please try again.");
    }
  };

  const loadCourse = (course: CourseWithRelations) => {
    const { modules, createdAt, updatedAt, ...courseData } = course;
    setDraft({
      ...courseData,
      id: course.id,
      modules: modules.map(({ lessons, id, courseId, ...moduleData }) => ({
        ...moduleData,
        id,
        lessons: lessons.map(({ id: lessonId, moduleId, ...lessonData }) => ({
          ...lessonData,
          id: lessonId
        }))
      }))
    });
  };

  const handleDelete = async (id: string) => {
    setStatus("Removing course...");
    try {
      await deleteCourse(id);
      setCourses((courses) => courses.filter((course) => course.id !== id));
      if (draft.id === id) {
        resetDraft();
      }
      setStatus("Course deleted.");
    } catch (error) {
      console.error(error);
      setStatus("Failed to delete course.");
    }
  };

  const updateDraft = (updates: Partial<CourseDraft>) => {
    setDraft((draft) => ({
      ...draft,
      ...updates
    }));
  };

  const addModule = () => {
    const moduleId = uuid();
    setDraft((draft) => ({
      ...draft,
      modules: [
        ...draft.modules,
        {
          id: moduleId,
          title: "New module",
          objective: "",
          orderIndex: draft.modules.length,
          lessons: []
        }
      ]
    }));
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setDraft((draft) => ({
      ...draft,
      modules: draft.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              ...updates
            }
          : module
      )
    }));
  };

  const removeModule = (moduleId: string) => {
    setDraft((draft) => ({
      ...draft,
      modules: draft.modules.filter((module) => module.id !== moduleId)
    }));
  };

  const addLesson = (moduleId: string) => {
    setDraft((draft) => ({
      ...draft,
      modules: draft.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: [
                ...module.lessons,
                {
                  id: uuid(),
                  title: "New lesson",
                  content: "",
                  mediaUrl: "",
                  duration: 5,
                  orderIndex: module.lessons.length
                }
              ]
            }
          : module
      )
    }));
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    setDraft((draft) => ({
      ...draft,
      modules: draft.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === lessonId
                  ? {
                      ...lesson,
                      ...updates
                    }
                  : lesson
              )
            }
          : module
      )
    }));
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setDraft((draft) => ({
      ...draft,
      modules: draft.modules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.filter((lesson) => lesson.id !== lessonId)
            }
          : module
      )
    }));
  };

  const tagString = draft.tags.join(", ");

  return (
    <div className="grid gap-8 lg:grid-cols-[380px,1fr]">
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title">Course title</label>
            <input
              id="title"
              required
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={3}
              required
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                value={draft.category ?? ""}
                onChange={(event) => updateDraft({ category: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="complianceArea">Compliance area</label>
              <input
                id="complianceArea"
                value={draft.complianceArea ?? ""}
                onChange={(event) => updateDraft({ complianceArea: event.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="level">Level</label>
              <select
                id="level"
                value={draft.level ?? "Intermediate"}
                onChange={(event) => updateDraft({ level: event.target.value })}
              >
                <option value="Introductory">Introductory</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="duration">Duration (mins)</label>
              <input
                id="duration"
                type="number"
                min={5}
                value={draft.durationMins ?? 0}
                onChange={(event) => updateDraft({ durationMins: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                placeholder="Separate with commas"
                value={tagString}
                onChange={(event) => updateDraft({ tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary">Modules</h2>
            <button type="button" className="button-secondary" onClick={addModule}>
              Add module
            </button>
          </div>
          {draft.modules.length === 0 && (
            <p className="text-sm text-charcoal/60">Add modules to structure your course.</p>
          )}
          <div className="space-y-4">
            {draft.modules.map((module, moduleIndex) => (
              <div key={module.id} className="rounded-xl border border-secondary/10 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs uppercase tracking-wide text-secondary/70">
                      Module {moduleIndex + 1}
                    </label>
                    <input
                      value={module.title}
                      onChange={(event) => updateModule(module.id!, { title: event.target.value })}
                    />
                    <textarea
                      rows={2}
                      placeholder="Learning objective"
                      value={module.objective ?? ""}
                      onChange={(event) => updateModule(module.id!, { objective: event.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeModule(module.id!)}
                    className="text-xs font-semibold text-accent"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary">Lessons</h3>
                    <button type="button" className="button-secondary" onClick={() => addLesson(module.id!)}>
                      Add lesson
                    </button>
                  </div>
                  {module.lessons.length === 0 && (
                    <p className="text-xs text-charcoal/60">Add lessons, activities, or assessments.</p>
                  )}
                  <div className="space-y-3">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="rounded-lg border border-secondary/20 bg-canvas/50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] uppercase tracking-wide text-secondary/60">
                              Lesson {lessonIndex + 1}
                            </label>
                            <input
                              value={lesson.title}
                              onChange={(event) => updateLesson(module.id!, lesson.id!, { title: event.target.value })}
                            />
                            <textarea
                              rows={2}
                              placeholder="Lesson content, instructions or scenario"
                              value={lesson.content}
                              onChange={(event) => updateLesson(module.id!, lesson.id!, { content: event.target.value })}
                            />
                            <input
                              placeholder="Media or SCORM package URL"
                              value={lesson.mediaUrl ?? ""}
                              onChange={(event) => updateLesson(module.id!, lesson.id!, { mediaUrl: event.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex items-center gap-2 text-xs text-secondary/70">
                                Duration (mins)
                                <input
                                  type="number"
                                  min={1}
                                  value={lesson.duration ?? 5}
                                  onChange={(event) =>
                                    updateLesson(module.id!, lesson.id!, { duration: Number(event.target.value) })
                                  }
                                />
                              </label>
                              <label className="flex items-center gap-2 text-xs text-secondary/70">
                                Order
                                <input
                                  type="number"
                                  min={0}
                                  value={lesson.orderIndex ?? lessonIndex}
                                  onChange={(event) =>
                                    updateLesson(module.id!, lesson.id!, { orderIndex: Number(event.target.value) })
                                  }
                                />
                              </label>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLesson(module.id!, lesson.id!)}
                            className="text-xs font-semibold text-accent"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="button-primary">
            {draft.id ? "Update course" : "Create course"}
          </button>
          <button type="button" className="button-secondary" onClick={resetDraft}>
            Reset
          </button>
          {status && <span className="text-xs text-charcoal/60">{status}</span>}
        </div>
      </form>

      <aside className="space-y-4">
        <div className="card space-y-2">
          <h2 className="text-lg font-semibold text-secondary">Existing courses</h2>
          <p className="text-xs text-charcoal/70">
            Select a course to edit. Changes are saved back to Neon via Prisma for robust LRS reporting.
          </p>
        </div>

        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-secondary">{course.title}</h3>
                  <p className="text-xs text-charcoal/60">{course.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(course.id)}
                  className="text-xs font-semibold text-accent"
                >
                  Delete
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-charcoal/60">
                <span className="badge">{course.modules.length} modules</span>
                {course.category && <span className="badge">{course.category}</span>}
                {course.complianceArea && <span className="badge">{course.complianceArea}</span>}
              </div>
              <div className="flex gap-2">
                <button type="button" className="button-secondary flex-1 justify-center" onClick={() => loadCourse(course)}>
                  Edit
                </button>
                <a className="button-secondary flex-1 justify-center" href={`/courses/${course.id}`}>
                  Preview
                </a>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="card text-sm text-charcoal/60">No courses yet. Start by creating one.</div>
          )}
        </div>
      </aside>
    </div>
  );
}
