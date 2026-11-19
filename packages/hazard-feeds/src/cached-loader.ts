/**
 * Wraps a slow loader so a good answer is reused for `ttlMs`.
 *
 * - Callers that arrive while a load is already running share it (so several
 *   people opening the Globe at once make one request to the outside service,
 *   not one each).
 * - A failed load is not remembered: the next call tries again.
 * - If a load fails but an older good answer exists, that older answer is
 *   returned instead of the error (a stale picture is better than none for
 *   data that changes every few minutes). `onStale` is told, so the app can log it.
 *   `maxStaleAgeMs` caps how old that answer may be (default: any age); older
 *   than that, the error is passed on so the page says the layer is unavailable
 *   instead of showing something that may no longer be true.
 * - `retryDelayMs` (default 0, off): a load that fails is tried once more after
 *   that pause, which rides out a dropped connection or a momentary 5xx without
 *   waiting for the next visitor. A load that is merely slow is not cut short or
 *   repeated.
 */
export function cachedLoader<T>(
  load: () => Promise<T>,
  ttlMs: number,
  {
    now = () => Date.now(),
    onStale,
    maxStaleAgeMs = Number.POSITIVE_INFINITY,
    retryDelayMs = 0,
    sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  }: {
    now?: () => number;
    onStale?: (err: unknown) => void;
    maxStaleAgeMs?: number;
    retryDelayMs?: number;
    sleep?: (ms: number) => Promise<void>;
  } = {},
): () => Promise<T> {
  let entry: { at: number; value: T } | null = null;
  let running: Promise<T> | null = null;
  const attempt = (): Promise<T> =>
    retryDelayMs > 0
      ? load().catch(async () => {
          await sleep(retryDelayMs);
          return load();
        })
      : load();
  return () => {
    if (entry && now() - entry.at < ttlMs) return Promise.resolve(entry.value);
    if (running) return running;
    running = attempt()
      .then(
        (value) => {
          entry = { at: now(), value };
          return value;
        },
        (err: unknown) => {
          if (entry && now() - entry.at <= maxStaleAgeMs) {
            onStale?.(err);
            return entry.value;
          }
          throw err;
        },
      )
      .finally(() => {
        running = null;
      });
    return running;
  };
}
