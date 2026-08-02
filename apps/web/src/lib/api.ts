import { ERP } from "@/config/env";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type ApiOpts = {
  method?: string;
  body?: unknown;
  form?: FormData;
  signal?: AbortSignal;
  /** Skip the one-shot refresh+retry on 401 */
  skipRefresh?: boolean;
  /** Do not emit session-lost event on final 401 */
  quietAuth?: boolean;
};

const AUTH_LOST = "travelos:auth-lost";

/** Subscribe to hard session loss (after refresh failed). */
export function onAuthLost(handler: () => void): () => void {
  const fn = () => handler();
  window.addEventListener(AUTH_LOST, fn);
  return () => window.removeEventListener(AUTH_LOST, fn);
}

function emitAuthLost() {
  window.dispatchEvent(new Event(AUTH_LOST));
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${ERP}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

function messageFrom(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const d = data as { message?: string | string[]; error?: string };
    if (Array.isArray(d.message)) return d.message.join(", ");
    if (typeof d.message === "string") return d.message;
    if (typeof d.error === "string") return d.error;
  }
  return `HTTP ${status}`;
}

/**
 * Same-origin Nest ERP fetch. Cookies only — never localStorage tokens.
 * On 401: one refresh+retry (may fail pre-cutover because refresh cookie path is /api/auth).
 * Final 401 emits `travelos:auth-lost` so AuthProvider can hard-redirect to login.
 */
export async function apiFetch<T = unknown>(path: string, opts: ApiOpts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = {
    method: opts.method || "GET",
    credentials: "include",
    signal: opts.signal,
    headers,
  };

  if (opts.form) {
    init.body = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }

  const url = path.startsWith("http") ? path : `${ERP}${path.startsWith("/") ? path : `/${path}`}`;
  let res = await fetch(url, init);

  if (res.status === 401 && !opts.skipRefresh) {
    const ok = await tryRefresh();
    if (ok) res = await fetch(url, init);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !opts.quietAuth && !opts.skipRefresh) {
      emitAuthLost();
    }
    throw new ApiError(messageFrom(data, res.status), res.status, data);
  }
  return data as T;
}

export function listOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && Array.isArray((r as { data?: unknown }).data)) {
    return (r as { data: T[] }).data;
  }
  return [];
}

/** Client-side upload guard. OCR path allows up to 20MB + HEIC. */
export const UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
export const UPLOAD_ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

export function validateUploadFile(file: File, opts?: { maxMb?: number }): string | null {
  const max = (opts?.maxMb ?? 20) * 1024 * 1024;
  if (file.size > max) {
    return `File too large (max ${opts?.maxMb ?? 20}MB)`;
  }
  if (file.type && !UPLOAD_ALLOWED.has(file.type)) {
    return "Only JPG, PNG, WEBP, HEIC, or PDF allowed";
  }
  if (!file.type) {
    const lower = file.name.toLowerCase();
    if (!/\.(jpe?g|png|webp|heic|heif|pdf)$/.test(lower)) {
      return "Only JPG, PNG, WEBP, HEIC, or PDF allowed";
    }
  }
  return null;
}
