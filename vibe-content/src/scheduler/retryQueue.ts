import logger, { logAction } from '../utils/logger.js';
import { ActionType } from '../types/index.js';

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

export type RetryErrorCategory =
  | 'timeout'
  | 'rate_limited'
  | 'server_error'
  | 'parse_fail'
  | 'unknown';

interface RetryPolicy {
  shouldRetry: boolean;
  maxRetries: number;
  baseBackoffMs: number;
}

const ERROR_POLICIES: Record<RetryErrorCategory, RetryPolicy> = {
  timeout:      { shouldRetry: true,  maxRetries: 3, baseBackoffMs: 60_000 },
  rate_limited: { shouldRetry: true,  maxRetries: 2, baseBackoffMs: 10 * 60_000 },
  server_error: { shouldRetry: true,  maxRetries: 3, baseBackoffMs: 2 * 60_000 },
  parse_fail:   { shouldRetry: false, maxRetries: 0, baseBackoffMs: 0 },
  unknown:      { shouldRetry: true,  maxRetries: 3, baseBackoffMs: 60_000 },
};

export function classifyError(error: string): RetryErrorCategory {
  const msg = error.toLowerCase();
  if (msg.includes('timeout') || msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('econnaborted')) {
    return 'timeout';
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('rate_limit') || msg.includes('rate limited')) {
    return 'rate_limited';
  }
  if (/\b(500|502|503|504)\b/.test(msg) || msg.includes('internal server error') || msg.includes('bad gateway') || msg.includes('service unavailable')) {
    return 'server_error';
  }
  if (msg.includes('validation failed') || msg.includes('parse') || msg.includes('json') || msg.includes('quality check failed')) {
    return 'parse_fail';
  }
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FailedAction {
  id: string;
  userId: number;
  actionType: ActionType;
  error: string;
  errorCategory: RetryErrorCategory;
  retryCount: number;
  maxRetries: number;
  retryAfter: number; // ms timestamp
  createdAt: number;
}

export interface DeadLetterItem {
  id: string;
  userId: number;
  actionType: ActionType;
  error: string;
  errorCategory: RetryErrorCategory;
  retryCount: number;
  createdAt: number;
  deadAt: number;
  finalError: string;
}

// ---------------------------------------------------------------------------
// RetryQueue
// ---------------------------------------------------------------------------

const MAX_DLQ_SIZE = 100;

export class RetryQueue {
  private queue: FailedAction[] = [];
  private dlq: DeadLetterItem[] = [];
  private defaultMaxRetries: number;
  private processInterval: ReturnType<typeof setInterval> | null = null;

  constructor(defaultMaxRetries = 3) {
    this.defaultMaxRetries = defaultMaxRetries;
  }

  /**
   * Enqueue a failed action for retry. Skips non-retryable error categories (e.g. parse_fail).
   */
  add(userId: number, actionType: ActionType, error: string): void {
    const category = classifyError(error);
    const policy = ERROR_POLICIES[category];

    if (!policy.shouldRetry) {
      logger.info(`[retry_queue] Skipping non-retryable error (${category}): ${error}`);
      return;
    }

    const id = `${actionType}-${userId}-${Date.now()}`;
    const action: FailedAction = {
      id,
      userId,
      actionType,
      error,
      errorCategory: category,
      retryCount: 0,
      maxRetries: policy.maxRetries,
      retryAfter: Date.now() + policy.baseBackoffMs,
      createdAt: Date.now(),
    };

    this.queue.push(action);
    logAction({
      actionId: id,
      userId,
      actionType,
      stage: 'retry_queue',
      status: 'info',
      details: {
        event: 'enqueued',
        errorCategory: category,
        maxRetries: action.maxRetries,
        retryAfter: new Date(action.retryAfter).toISOString(),
      },
    });
  }

  getRetryable(): FailedAction[] {
    const now = Date.now();
    return this.queue.filter(
      (a) => a.retryAfter <= now && a.retryCount < a.maxRetries,
    );
  }

  markRetried(id: string, success: boolean, newError?: string): void {
    const idx = this.queue.findIndex((a) => a.id === id);
    if (idx === -1) return;

    if (success) {
      this.queue.splice(idx, 1);
      logAction({ actionId: id, stage: 'retry_queue', status: 'success', details: { event: 'retry_succeeded' } });
      return;
    }

    const action = this.queue[idx];
    action.retryCount++;
    if (newError) action.error = newError;

    if (action.retryCount >= action.maxRetries) {
      this.queue.splice(idx, 1);
      this.moveToDlq(action, action.error);
    } else {
      // Exponential backoff using the error-category base
      const policy = ERROR_POLICIES[action.errorCategory];
      action.retryAfter = Date.now() + Math.pow(2, action.retryCount) * policy.baseBackoffMs;
      logAction({
        actionId: id,
        userId: action.userId,
        actionType: action.actionType,
        stage: 'retry_queue',
        status: 'info',
        details: {
          event: 'retry_rescheduled',
          errorCategory: action.errorCategory,
          attempt: action.retryCount,
          nextRetry: new Date(action.retryAfter).toISOString(),
        },
      });
    }
  }

  private moveToDlq(action: FailedAction, finalError: string): void {
    const item: DeadLetterItem = {
      id: action.id,
      userId: action.userId,
      actionType: action.actionType,
      error: action.error,
      errorCategory: action.errorCategory,
      retryCount: action.retryCount,
      createdAt: action.createdAt,
      deadAt: Date.now(),
      finalError,
    };

    if (this.dlq.length >= MAX_DLQ_SIZE) {
      this.dlq.shift(); // evict oldest to keep bounded
    }
    this.dlq.push(item);

    logAction({
      actionId: action.id,
      userId: action.userId,
      actionType: action.actionType,
      stage: 'retry_queue',
      status: 'failed',
      error: `Dead-lettered after ${action.retryCount} retries (${action.errorCategory}): ${finalError}`,
    });
    logger.warn(
      `[retry_queue] Dead-lettered job ${action.id} — ${action.actionType} for user #${action.userId} ` +
      `after ${action.retryCount} retries. Category: ${action.errorCategory}`,
    );
  }

  startProcessing(handler: (action: FailedAction) => Promise<boolean>): void {
    // Process every 5 minutes
    this.processInterval = setInterval(async () => {
      const retryable = this.getRetryable();
      if (retryable.length === 0) return;

      logger.info(`[retry_queue] Processing ${retryable.length} retryable actions`);
      for (const action of retryable) {
        try {
          const success = await handler(action);
          this.markRetried(action.id, success);
        } catch (err: any) {
          this.markRetried(action.id, false, err.message);
        }
      }
    }, 5 * 60 * 1000);
  }

  stop(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  getStats(): { pending: number; retrying: number; total: number; dlqSize: number } {
    const now = Date.now();
    const pending = this.queue.filter((a) => a.retryAfter > now).length;
    const retrying = this.queue.filter((a) => a.retryAfter <= now && a.retryCount < a.maxRetries).length;
    return { pending, retrying, total: this.queue.length, dlqSize: this.dlq.length };
  }

  getAll(): FailedAction[] {
    return [...this.queue];
  }

  getDeadLetterQueue(): DeadLetterItem[] {
    return [...this.dlq];
  }
}
