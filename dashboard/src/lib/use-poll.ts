import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { type ApiError, api } from "./api.js";

export interface PollResult<T> {
  data: T | null;
  error: ApiError | Error | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

/** Hard cap on the loading state — if the first request hasn't settled
 *  within this window, surface a timeout error so the user isn't left
 *  staring at a spinner forever.  Slightly longer than the api()
 *  timeout so the api error surfaces first under normal conditions. */
const LOADING_WATCHDOG_MS = 14_000;

export function usePoll<T = unknown>(path: string, intervalMs = 2000): PollResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await api<T>(path);
      setData(next);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Watchdog: if loading persists beyond LOADING_WATCHDOG_MS,
    // force an error so the UI can show something actionable.
    const watchdog = setTimeout(() => {
      if (!cancelled && loadingRef.current) {
        loadingRef.current = false;
        setLoading(false);
        setError(new Error("请求超时：服务器未在预期时间内响应，请检查网络或重启服务。"));
      }
    }, LOADING_WATCHDOG_MS);

    const tick = async () => {
      if (cancelled) return;
      await refresh();
      clearTimeout(watchdog);
      if (cancelled) return;
      timer = setTimeout(tick, intervalMs);
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      if (timer) clearTimeout(timer);
    };
  }, [refresh, intervalMs]);

  return { data, error, loading, refresh };
}
