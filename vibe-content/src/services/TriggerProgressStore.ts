export type TriggerStepKey = 'selecting' | 'gathering' | 'generating' | 'publishing' | 'completed';
export type TriggerJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface TriggerStepSnapshot {
  key: TriggerStepKey;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface TriggerJobSnapshot {
  jobId: string;
  actionType: 'post' | 'comment' | 'vote';
  status: TriggerJobStatus;
  currentStep: TriggerStepKey;
  steps: TriggerStepSnapshot[];
  aiStepDescs: Record<TriggerStepKey, string>;
  startedAt: string;
  updatedAt: string;
  success?: boolean;
  provider?: string;
  latencyMs?: number;
  postId?: number;
  preview?: unknown;
  error?: string;
  result?: {
    success: boolean;
    postId?: number;
    provider?: string;
    latencyMs?: number;
    preview?: unknown;
  };
}

export class TriggerProgressStore {
  private static readonly aiStepDescs: Record<TriggerStepKey, string> = {
    selecting: 'Xác định tác nhân tối ưu từ nhóm…',
    gathering: 'Quét chủ đề xu hướng và tín hiệu cộng đồng…',
    generating: 'LLM soạn tiêu đề, nội dung và thẻ…',
    publishing: 'Gửi bài qua API diễn đàn…',
    completed: 'Bài đã được đăng.',
  };

  private jobs = new Map<string, TriggerJobSnapshot>();

  startJob(actionType: 'post' | 'comment' | 'vote'): string {
    const jobId = `trigger-${actionType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const steps: TriggerStepSnapshot[] = (Object.keys(TriggerProgressStore.aiStepDescs) as TriggerStepKey[]).map((key) => ({
      key,
      label: TriggerProgressStore.aiStepDescs[key],
      status: key === 'selecting' ? 'running' : 'pending',
    }));

    this.jobs.set(jobId, {
      jobId,
      actionType,
      status: 'queued',
      currentStep: 'selecting',
      steps,
      aiStepDescs: this.getAiStepDescs(),
      startedAt: now,
      updatedAt: now,
    });

    return jobId;
  }

  updateStep(jobId: string, step: TriggerStepKey): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    if (job.status === 'failed' || job.status === 'completed') {
      return;
    }

    job.status = 'running';
    job.currentStep = step;
    job.updatedAt = new Date().toISOString();

    for (const item of job.steps) {
      if (item.key === step) {
        item.status = 'running';
      } else if (item.key === 'completed') {
        item.status = 'pending';
      } else if (item.status === 'running') {
        item.status = 'completed';
      }
    }
  }

  completeJob(jobId: string, result: NonNullable<TriggerJobSnapshot['result']>): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.currentStep = 'completed';
    job.updatedAt = new Date().toISOString();
    job.result = result;

    for (const item of job.steps) {
      if (item.key === 'completed') {
        item.status = 'completed';
      } else if (item.status === 'running') {
        item.status = 'completed';
      }
    }
  }

  failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.updatedAt = new Date().toISOString();
    job.error = error;

    const runningStep = job.steps.find((item) => item.status === 'running');
    if (runningStep) {
      runningStep.status = 'failed';
      job.currentStep = runningStep.key;
    }
  }

  getJobSnapshot(jobId: string): TriggerJobSnapshot | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    if (!job.result) return job;

    return {
      ...job,
      ...job.result,
    };
  }

  getAiStepDescs(): Record<TriggerStepKey, string> {
    return { ...TriggerProgressStore.aiStepDescs };
  }
}
