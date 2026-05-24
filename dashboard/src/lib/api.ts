export const TOKEN: string =
  document.querySelector('meta[name="reasonix-token"]')?.getAttribute("content") ?? "";

export const MODE: "standalone" | "attached" =
  (document.querySelector('meta[name="reasonix-mode"]')?.getAttribute("content") as
    | "standalone"
    | "attached"
    | null) ?? "standalone";

export interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  /** Max ms before the fetch is aborted. Default 12_000 (12 s). */
  timeoutMs?: number;
}

export interface ApiError extends Error {
  status: number;
  body: unknown;
}

const DEFAULT_API_TIMEOUT_MS = 12_000;

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const timeoutMs = opts.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const url = `/api${path}${path.includes("?") ? "&" : "?"}token=${TOKEN}`;
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  headers["X-Reasonix-Token"] = TOKEN;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === "AbortError") {
      const timeoutErr = new Error(`请求超时 (${timeoutMs / 1000}s): ${url}`) as ApiError;
      timeoutErr.status = 0;
      timeoutErr.body = { error: `fetch aborted after ${timeoutMs}ms` };
      console.error("[api]", timeoutErr.message);
      throw timeoutErr;
    }
    const netErr = new Error(`网络错误: ${(err as Error).message}`) as ApiError;
    netErr.status = 0;
    netErr.body = { error: (err as Error).message };
    console.error("[api]", netErr.message);
    throw netErr;
  }
  clearTimeout(timer);

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { error: text };
  }
  if (!res.ok) {
    const errMsg =
      (parsed as { error?: string } | null)?.error ?? `${res.status} ${res.statusText}`;
    const err = new Error(errMsg) as ApiError;
    err.status = res.status;
    err.body = parsed;
    console.error("[api]", res.status, errMsg);
    throw err;
  }
  return parsed as T;
}
