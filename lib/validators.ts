import path from "node:path";

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

export function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.toLowerCase().replace(/\s+/g, "-"));
}