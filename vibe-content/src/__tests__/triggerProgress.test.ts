import test from 'node:test';
import assert from 'node:assert/strict';
import { TriggerProgressStore } from '../services/TriggerProgressStore.js';
import { APIExecutorService } from '../services/APIExecutorService.js';

test('stores per-step progression and exposes flattened payload', () => {
  const store = new TriggerProgressStore();
  const jobId = store.startJob('post');

  store.updateStep(jobId, 'selecting');
  store.updateStep(jobId, 'gathering');
  store.updateStep(jobId, 'generating');

  const payload = store.getJobSnapshot(jobId);
  assert.ok(payload);
  assert.equal(payload!.jobId, jobId);
  assert.equal(payload!.currentStep, 'generating');
  assert.equal(payload!.status, 'running');
  assert.equal(payload!.steps[0].key, 'selecting');
  assert.equal(payload!.steps[1].status, 'completed');
  assert.equal(payload!.steps[2].status, 'running');
  assert.equal(payload!.aiStepDescs.generating, 'LLM soạn tiêu đề, nội dung và thẻ…');
});

test('marks completed and failed states correctly', () => {
  const store = new TriggerProgressStore();
  const jobId = store.startJob('post');

  store.updateStep(jobId, 'publishing');
  store.completeJob(jobId, { success: true, postId: 123 });

  const completed = store.getJobSnapshot(jobId);
  assert.ok(completed);
  assert.equal(completed!.status, 'completed');
  assert.equal(completed!.currentStep, 'completed');
  assert.equal(completed!.result?.postId, 123);

  const failedJob = store.startJob('post');
  store.updateStep(failedJob, 'generating');
  store.failJob(failedJob, 'Validation failed');
  const failed = store.getJobSnapshot(failedJob);
  assert.ok(failed);
  assert.equal(failed!.status, 'failed');
  assert.equal(failed!.error, 'Validation failed');
  assert.equal(failed!.currentStep, 'generating');
  assert.equal(failed!.steps.find((step) => step.key === 'generating')?.status, 'failed');
});

test('does not advance workflow after the job has already failed', () => {
  const store = new TriggerProgressStore();
  const jobId = store.startJob('post');

  store.updateStep(jobId, 'selecting');
  store.failJob(jobId, 'Invalid forum URL');
  store.updateStep(jobId, 'gathering');

  const snapshot = store.getJobSnapshot(jobId);
  assert.ok(snapshot);
  assert.equal(snapshot!.status, 'failed');
  assert.equal(snapshot!.currentStep, 'selecting');
  assert.equal(snapshot!.steps.find((step) => step.key === 'selecting')?.status, 'failed');
});

test('reports invalid forum API URL before workflow starts', async () => {
  const executor = new APIExecutorService();
  (executor as any).client.defaults.baseURL = 'not a url';

  const result = await executor.checkConnectivity();
  assert.equal(result.success, false);
  assert.match(result.error ?? '', /invalid forum api url/i);
});
