/**
 * Wraps a promise with a hard timeout.
 * On timeout, rejects with a tagged `[context_fetch]` error so the
 * RetryQueue can classify it in the correct category.
 *
 * @param promise  The promise to race against the timer.
 * @param ms       Timeout in milliseconds.
 * @param label    Short description used in the error message.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = 'operation',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`[context_fetch] ${label} timed out after ${ms}ms`)),
      ms,
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}
