"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { ResourceView } from "@/lib/types";

interface CourseDetail {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
  myRole: string | null;
  members: {
    userId: string;
    role: string;
    displayName: string;
  }[];
  resourceCount: number;
}

type Notice = { type: "error" | "success"; text: string } | null;

interface AddFormState {
  type: "link" | "file";
  title: string;
  url: string;
  description: string;
  tags: string;
  file: File | null;
}

interface EditFormState {
  title: string;
  url: string;
  description: string;
  tags: string;
  file: File | null;
}

const EMPTY_ADD: AddFormState = {
  type: "link",
  title: "",
  url: "",
  description: "",
  tags: "",
  file: null,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CourseHubPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [resources, setResources] = useState<ResourceView[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [addForm, setAddForm] = useState<AddFormState>(EMPTY_ADD);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [working, setWorking] = useState(false);

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");

  const load = useCallback(async () => {
    const courseRes = await fetch(`/api/courses/${courseId}`);
    if (courseRes.status === 401) {
      router.replace("/");
      return;
    }
    if (courseRes.status === 403 || courseRes.status === 404) {
      setCourse(null);
      setResources([]);
      setLoading(false);
      return;
    }
    const courseData = await courseRes.json();
    setCourse(courseData.course);

    const resRes = await fetch(`/api/courses/${courseId}/resources`);
    const resData = await resRes.json();
    setResources(resData.resources ?? []);
    setLoading(false);
  }, [courseId, router]);

  useEffect(() => {
    let ignore = false;
    async function initialize() {
      const courseRes = await fetch(`/api/courses/${courseId}`);
      if (courseRes.status === 401) {
        router.replace("/");
        return;
      }
      if (courseRes.status === 403 || courseRes.status === 404) {
        if (ignore) return;
        setCourse(null);
        setResources([]);
        setLoading(false);
        return;
      }
      const courseData = await courseRes.json();
      if (ignore) return;
      setCourse(courseData.course);

      const resRes = await fetch(`/api/courses/${courseId}/resources`);
      const resData = await resRes.json();
      if (ignore) return;
      setResources(resData.resources ?? []);
      setLoading(false);
    }
    void initialize();
    return () => {
      ignore = true;
    };
  }, [courseId, router]);

  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setWorking(true);
    try {
      const body = new FormData();
      body.set("title", addForm.title);
      body.set("type", addForm.type);
      body.set("description", addForm.description);
      body.set("tags", addForm.tags);
      if (addForm.type === "link") {
        body.set("url", addForm.url);
      } else if (addForm.file) {
        body.set("file", addForm.file);
      }

      const res = await fetch(`/api/courses/${courseId}/resources`, {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Could not add resource." });
        return;
      }
      setAddForm(EMPTY_ADD);
      setNotice({ type: "success", text: "Resource added to the course hub." });
      await load();
    } catch {
      setNotice({ type: "error", text: "Network error. Try again." });
    } finally {
      setWorking(false);
    }
  }

  function startEdit(resource: ResourceView) {
    setEditingId(resource.id);
    setEditForm({
      title: resource.title,
      url: resource.type === "link" ? resource.location : "",
      description: resource.description,
      tags: resource.tags.join(", "),
      file: null,
    });
  }

  async function handleSaveEdit(resource: ResourceView) {
    if (!editForm) return;
    setNotice(null);
    setWorking(true);
    try {
      const isFile = resource.type === "file";
      const body = new FormData();
      body.set("title", editForm.title);
      body.set("description", editForm.description);
      body.set("tags", editForm.tags);
      if (!isFile) {
        body.set("url", editForm.url);
      } else if (editForm.file) {
        body.set("file", editForm.file);
      }

      const res = await fetch(`/api/resources/${resource.id}`, {
        method: "PATCH",
        body: isFile ? body : JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          tags: editForm.tags,
          url: isFile ? undefined : editForm.url,
        }),
        headers: isFile
          ? undefined
          : { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Could not save changes." });
        return;
      }
      setEditingId(null);
      setEditForm(null);
      setNotice({ type: "success", text: "Resource updated." });
      await load();
    } catch {
      setNotice({ type: "error", text: "Network error. Try again." });
    } finally {
      setWorking(false);
    }
  }

  async function handleDelete(resource: ResourceView) {
    if (!window.confirm(`Delete "${resource.title}" from the course hub?`)) return;
    setNotice(null);
    setWorking(true);
    try {
      const res = await fetch(`/api/resources/${resource.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setNotice({ type: "error", text: data.error ?? "Could not delete resource." });
        return;
      }
      setNotice({ type: "success", text: "Resource deleted." });
      await load();
    } catch {
      setNotice({ type: "error", text: "Network error. Try again." });
    } finally {
      setWorking(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setWorking(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: memberEmail, role: memberRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Could not add member." });
        return;
      }
      setMemberEmail("");
      setNotice({ type: "success", text: "Member added." });
      await load();
    } catch {
      setNotice({ type: "error", text: "Network error. Try again." });
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-sm text-zinc-500">
        Loading course…
      </div>
    );
  }

  if (!course) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Course not found
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You do not have access to this course, or it no longer exists.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Back to courses
        </Link>
      </main>
    );
  }

  const canManageMembers = course.myRole === "owner";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4">
        <Link
          href="/"
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← All courses
        </Link>
        <div className="flex items-start gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold text-white"
            style={{ backgroundColor: course.color }}
          >
            {course.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {course.name}
              </h1>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                you are {course.myRole}
              </span>
            </div>
            {course.description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {course.description}
              </p>
            )}
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {course.resourceCount} resource{course.resourceCount === 1 ? "" : "s"} in the hub
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Members</h2>
          <ul className="flex flex-wrap gap-2">
            {course.members.map((m) => (
              <li
                key={m.userId}
                className="flex items-center gap-2 rounded-full bg-zinc-100 py-1 pl-1 pr-3 text-sm dark:bg-zinc-800"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
                  {m.displayName.charAt(0).toUpperCase()}
                </span>
                {m.displayName}
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{m.role}</span>
              </li>
            ))}
          </ul>
          {canManageMembers && (
            <form onSubmit={handleAddMember} className="mt-1 flex flex-wrap gap-2">
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="student@email.com"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                required
              />
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="member">member</option>
                <option value="moderator">moderator</option>
              </select>
              <button
                type="submit"
                disabled={working}
                className="rounded-lg border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 disabled:opacity-60"
              >
                Add member
              </button>
            </form>
          )}
        </div>
      </header>

      {notice && (
        <p
          role="alert"
          className={`rounded-md px-3 py-2 text-sm ${
            notice.type === "error"
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          {notice.text}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Add a resource</h2>
        <form
          onSubmit={handleAddResource}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex rounded-lg bg-zinc-100 p-1 text-sm font-medium dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setAddForm({ ...addForm, type: "link" })}
              className={`flex-1 rounded-md px-3 py-1.5 transition ${
                addForm.type === "link"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500"
              }`}
            >
              Link
            </button>
            <button
              type="button"
              onClick={() => setAddForm({ ...addForm, type: "file" })}
              className={`flex-1 rounded-md px-3 py-1.5 transition ${
                addForm.type === "file"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500"
              }`}
            >
              File
            </button>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Title</span>
            <input
              type="text"
              value={addForm.title}
              onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              required
              maxLength={120}
              placeholder="e.g. Lecture 4 study notes"
            />
          </label>

          {addForm.type === "link" ? (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Location (URL)</span>
              <input
                type="url"
                value={addForm.url}
                onChange={(e) => setAddForm({ ...addForm, url: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                required
                placeholder="https://example.com/notes.pdf"
              />
            </label>
          ) : (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">File</span>
              <input
                type="file"
                onChange={(e) =>
                  setAddForm({ ...addForm, file: e.target.files?.[0] ?? null })
                }
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                required={addForm.type === "file"}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Accepted: PDF, Word, Excel, PowerPoint, ZIP, text (txt/md/csv), images (PNG, JPG,
                GIF, WEBP, SVG). Max size: 10 MB.
              </p>
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Description</span>
            <textarea
              value={addForm.description}
              onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              rows={2}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Optional notes"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Tags</span>
            <input
              type="text"
              value={addForm.tags}
              onChange={(e) => setAddForm({ ...addForm, tags: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="e.g. biology, exam-review (comma separated)"
            />
          </label>

          <button
            type="submit"
            disabled={working}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {working ? "Adding…" : "Add resource"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Course resources
        </h2>
        {resources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No resources yet. Add a link or file above to start the course hub.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {editingId === resource.id && editForm ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSaveEdit(resource);
                    }}
                    className="flex flex-col gap-3"
                  >
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Title</span>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        required
                      />
                    </label>
                    {resource.type === "link" ? (
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Location (URL)
                        </span>
                        <input
                          type="url"
                          value={editForm.url}
                          onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                          required
                        />
                      </label>
                    ) : (
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Replace file (optional)
                        </span>
                        <input
                          type="file"
                          onChange={(e) =>
                            setEditForm({ ...editForm, file: e.target.files?.[0] ?? null })
                          }
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                      </label>
                    )}
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Description
                      </span>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                        rows={2}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Tags</span>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={working}
                        className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditForm(null);
                        }}
                        className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white ${
                            resource.type === "link"
                              ? "bg-sky-500"
                              : "bg-violet-500"
                          }`}
                        >
                          {resource.type === "link" ? "🔗" : "📄"}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                            {resource.title}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {resource.type === "link" ? (
                              <a
                                href={resource.location}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                {resource.location}
                              </a>
                            ) : (
                              <a
                                href={resource.fileUrl}
                                className="text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                {resource.originalName ?? "Download file"}
                              </a>
                            )}
                          </p>
                        </div>
                      </div>
                      {resource.canEdit && resource.canDelete && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(resource)}
                            className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(resource)}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        Type: <span className="capitalize">{resource.type}</span>
                      </span>
                      <span>Added by {resource.creator.displayName}</span>
                      <span>{formatDate(resource.createdAt)}</span>
                      {resource.type === "file" && resource.size !== undefined && (
                        <span>
                          {resource.originalName
                            ? `${resource.originalName} · ${formatBytes(resource.size)}`
                            : formatBytes(resource.size)}
                        </span>
                      )}
                    </div>
                    {resource.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {resource.description}
                      </p>
                    )}
                    {resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {resource.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}