import { ActionType } from '../types/index.js';

export type JobState = 'queued' | 'running' | 'success' | 'failed';

export interface JobEntry {
  jobId: string;
  state: JobState;
  actionType: ActionType;
  userId?: number;
  triggerSource: string;
  queuedAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

const MAX_COMPLETED_HISTORY = 50;

/**
 * In-memory store that tracks the lifecycle state of each job from
 * queued → running → success/failed.  Used by the /status endpoint.
 */
export class JobLifecycleStore {
  /** Active jobs: queued or running */
  private active = new Map<string, JobEntry>();
  /** Completed jobs (capped ring buffer) */
  private completed: JobEntry[] = [];

  markQueued(jobId: string, actionType: ActionType, triggerSource: string, userId?: number): void {
    this.active.set(jobId, {
      jobId,
      state: 'queued',
      actionType,
      userId,
      triggerSource,
      queuedAt: Date.now(),
    });
  }

  markRunning(jobId: string): void {
    const entry = this.active.get(jobId);
    if (!entry) return;
    entry.state = 'running';
    entry.startedAt = Date.now();
  }

  markSuccess(jobId: string): void {
    const entry = this.active.get(jobId);
    if (!entry) return;
    entry.state = 'success';
    entry.completedAt = Date.now();
    this.active.delete(jobId);
    this.pushCompleted(entry);
  }

  markFailed(jobId: string, error: string): void {
    const entry = this.active.get(jobId);
    if (!entry) return;
    entry.state = 'failed';
    entry.completedAt = Date.now();
    entry.error = error;
    this.active.delete(jobId);
    this.pushCompleted(entry);
  }

  private pushCompleted(entry: JobEntry): void {
    this.completed.push(entry);
    if (this.completed.length > MAX_COMPLETED_HISTORY) {
      this.completed.shift();
    }
  }

  getActiveJobs(): JobEntry[] {
    return [...this.active.values()];
  }

  getRecentCompleted(limit = 20): JobEntry[] {
    return this.completed.slice(-limit).reverse();
  }

  getSnapshot() {
    const active = this.getActiveJobs();
    const recent = this.getRecentCompleted(20);
    const running = active.filter((j) => j.state === 'running').length;
    const queued = active.filter((j) => j.state === 'queued').length;
    return { running, queued, active, recentCompleted: recent };
  }
}
