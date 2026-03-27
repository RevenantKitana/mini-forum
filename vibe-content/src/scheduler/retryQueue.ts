import logger, { logAction } from '../utils/logger.js';
import { ActionType } from '../types/index.js';

export interface FailedAction {
  id: string;
  userId: number;
  actionType: ActionType;
  error: string;
  retryCount: number;
  maxRetries: number;
  retryAfter: number; // timestamp
  createdAt: number;
}

export class RetryQueue {
  private queue: FailedAction[] = [];
  private maxRetries: number;
  private processInterval: ReturnType<typeof setInterval> | null = null;

  constructor(maxRetries = 3) {
    this.maxRetries = maxRetries;
  }

  add(userId: number, actionType: ActionType, error: string): void {
    const id = `${actionType}-${userId}-${Date.now()}`;
    const backoffMs = Math.pow(2, 0) * 60_000; // first retry after 1 min
    const action: FailedAction = {
      id,
      userId,
      actionType,
      error,
      retryCount: 0,
      maxRetries: this.maxRetries,
      retryAfter: Date.now() + backoffMs,
      createdAt: Date.now(),
    };
    this.queue.push(action);
    logAction({
      actionId: id,
      userId,
      actionType,
      stage: 'retry_queue',
      status: 'info',
      details: { event: 'enqueued', retryAfter: new Date(action.retryAfter).toISOString() },
    });
  }

  getRetryable(): FailedAction[] {
    const now = Date.now();
    return this.queue.filter(
      (a) => a.retryAfter <= now && a.retryCount < a.maxRetries,
    );
  }

  markRetried(id: string, success: boolean): void {
    const idx = this.queue.findIndex((a) => a.id === id);
    if (idx === -1) return;

    if (success) {
      this.queue.splice(idx, 1);
      logAction({ actionId: id, stage: 'retry_queue', status: 'success', details: { event: 'retry_succeeded' } });
    } else {
      const action = this.queue[idx];
      action.retryCount++;
      if (action.retryCount >= action.maxRetries) {
        this.queue.splice(idx, 1);
        logAction({
          actionId: id,
          userId: action.userId,
          actionType: action.actionType,
          stage: 'retry_queue',
          status: 'failed',
          error: `Discarded after ${action.maxRetries} retries: ${action.error}`,
        });
      } else {
        const backoffMs = Math.pow(2, action.retryCount) * 60_000;
        action.retryAfter = Date.now() + backoffMs;
        logAction({
          actionId: id,
          userId: action.userId,
          actionType: action.actionType,
          stage: 'retry_queue',
          status: 'info',
          details: {
            event: 'retry_rescheduled',
            attempt: action.retryCount,
            nextRetry: new Date(action.retryAfter).toISOString(),
          },
        });
      }
    }
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
          this.markRetried(action.id, false);
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

  getStats(): { pending: number; retrying: number; total: number } {
    const now = Date.now();
    const pending = this.queue.filter((a) => a.retryAfter > now).length;
    const retrying = this.queue.filter((a) => a.retryAfter <= now && a.retryCount < a.maxRetries).length;
    return { pending, retrying, total: this.queue.length };
  }

  getAll(): FailedAction[] {
    return [...this.queue];
  }
}
