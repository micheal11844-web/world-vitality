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
 */
export function cachedLoader<T>(
  load: () => Promise<T>,
  ttlMs: number,
  {
    now = () => Date.now(),
    onStale,
  }: { now?: () => number; onStale?: (err: unknown) => void } = {},
): () => Promise<T> {
  let entry: { at: number; value: T } | null = null;
  let running: Promise<T> | null = null;
  return () => {
    if (entry && now() - entry.at < ttlMs) return Promise.resolve(entry.value);
    if (running) return running;
    running = load()
      .then(
        (value) => {
          entry = { at: now(), value };
          return value;
        },
        (err: unknown) => {
          if (entry) {
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
