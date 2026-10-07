import path from "node:path";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./passwords";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_SIZE_LABEL = "10 MB";

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/markdown",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
  "txt",
  "md",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
]);

export const FILE_LIMITS_MESSAGE = `Unsupported file type or too large. Accepted types: PDF, Word, Excel, PowerPoint, ZIP, text (txt/md/csv), and images (PNG, JPG, GIF, WEBP, SVG). Max size: ${MAX_FILE_SIZE_LABEL}.`;

export interface FileCheckResult {
  ok: boolean;
  error?: string;
  ext?: string;
}

export function validateUploadedFile(file: File | null): FileCheckResult {
  if (!file || file.size === 0) {
    return { ok: false, error: "A file is required. Choose a file to upload." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: `The file is too large (${formatBytes(file.size)}). Max size is ${MAX_FILE_SIZE_LABEL}.`,
    };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, error: FILE_LIMITS_MESSAGE };
  }
  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, error: FILE_LIMITS_MESSAGE };
  }
  return { ok: true, ext: ext || "bin" };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const TAGS_MAX = 10;

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;
export const TASK_STATUSES = ["not-started", "in-progress", "completed"] as const;

export function isTaskStatus(value: string): boolean {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isValidDueDate(value: string): boolean {
  if (value === "") return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateTaskFields({
  title,
  description,
  dueDate,
}: {
  title: string;
  description: string;
  dueDate: string;
}): string[] {
  const errors: string[] = [];
  if (!title) {
    errors.push("A task title is required.");
  } else if (title.length > TASK_TITLE_MAX_LENGTH) {
    errors.push(`Title must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`);
  }
  if (description.length > TASK_DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be ${TASK_DESCRIPTION_MAX_LENGTH} characters or fewer.`);
  }
  if (!isValidDueDate(dueDate)) {
    errors.push("Due date must be a valid date in YYYY-MM-DD format.");
  }
  return errors;
}

export function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.toLowerCase().replace(/\s+/g, "-"));
}

export const DISPLAY_NAME_MAX_LENGTH = 60;
export const EMAIL_MAX_LENGTH = 254;
export const COURSE_NAME_MAX_LENGTH = 80;
export const COURSE_DESCRIPTION_MAX_LENGTH = 500;

export function isEmail(value: string): boolean {
  if (value.length > EMAIL_MAX_LENGTH) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateSignupFields({
  displayName,
  email,
  password,
}: {
  displayName: string;
  email: string;
  password: string;
}): string[] {
  const errors: string[] = [];
  if (!displayName) {
    errors.push("A display name is required.");
  } else if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    errors.push(`Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`);
  }
  if (!email) {
    errors.push("An email is required.");
  } else if (!isEmail(email)) {
    errors.push("Enter a valid email address.");
  }
  if (!password) {
    errors.push("A password is required.");
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`);
  }
  return errors;
}

export function validateLoginFields({
  email,
  password,
}: {
  email: string;
  password: string;
}): string[] {
  const errors: string[] = [];
  if (!email) {
    errors.push("An email is required.");
  } else if (!isEmail(email)) {
    errors.push("Enter a valid email address.");
  }
  if (!password) {
    errors.push("A password is required.");
  }
  return errors;
}

export function validateCourseFields({
  name,
  description,
}: {
  name: string;
  description: string;
}): string[] {
  const errors: string[] = [];
  if (!name) {
    errors.push("A course name is required.");
  } else if (name.length > COURSE_NAME_MAX_LENGTH) {
    errors.push(`Course name must be ${COURSE_NAME_MAX_LENGTH} characters or fewer.`);
  }
  if (description.length > COURSE_DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be ${COURSE_DESCRIPTION_MAX_LENGTH} characters or fewer.`);
  }
  return errors;
}