import test from 'node:test';
import assert from 'node:assert/strict';
import { ActionHistoryTracker } from '../tracking/ActionHistoryTracker.js';

test('ActionHistoryTracker keeps most recent actions and action-level ordering', () => {
  const tracker = new ActionHistoryTracker();

  tracker.record(
    {
      success: true,
      actionType: 'post',
      userId: 10,
      provider: 'gemini-flash',
      latencyMs: 320,
      actionId: 'a-1',
      triggerSource: 'cron',
      completedAt: '2026-04-14T01:00:00.000Z',
    },
    { actionId: 'a-1', triggerSource: 'cron' },
  );

  tracker.record(
    {
      success: false,
      actionType: 'comment',
      userId: 11,
      provider: 'groq-70b',
      latencyMs: 420,
      error: 'timeout',
      actionId: 'a-2',
      triggerSource: 'manual',
      completedAt: '2026-04-14T01:05:00.000Z',
    },
    { actionId: 'a-2', triggerSource: 'manual' },
  );

  const recent = tracker.getRecentActions(10);
  assert.equal(recent.length, 2);
  assert.equal(recent[0].actionId, 'a-2');
  assert.equal(recent[1].actionId, 'a-1');
  assert.equal(recent[0].completedAt, '2026-04-14T01:05:00.000Z');
});

test('ActionHistoryTracker today stats include cron and manual trigger', () => {
  const tracker = new ActionHistoryTracker();

  tracker.record(
    {
      success: true,
      actionType: 'post',
      userId: 10,
      provider: 'gemini-flash',
      latencyMs: 100,
      completedAt: '2026-04-14T00:10:00.000Z',
      triggerSource: 'cron',
    },
    { actionId: 'x-1', triggerSource: 'cron' },
  );

  tracker.record(
    {
      success: false,
      actionType: 'vote',
      userId: 12,
      provider: 'none',
      latencyMs: 80,
      completedAt: '2026-04-14T03:10:00.000Z',
      triggerSource: 'manual',
    },
    { actionId: 'x-2', triggerSource: 'manual' },
  );

  tracker.record(
    {
      success: true,
      actionType: 'comment',
      userId: 13,
      provider: 'groq-8b',
      latencyMs: 110,
      completedAt: '2026-04-13T23:50:00.000Z',
      triggerSource: 'cron',
    },
    { actionId: 'x-3', triggerSource: 'cron' },
  );

  const stats = tracker.getTodayStats(new Date('2026-04-14T04:00:00.000Z'));
  assert.equal(stats.totalActions, 2);
  assert.equal(stats.successCount, 1);
  assert.equal(stats.failedCount, 1);
  assert.equal(stats.byTrigger.cron, 1);
  assert.equal(stats.byTrigger.manual, 1);
  assert.equal(stats.byTrigger.retry, 0);
  assert.equal(stats.byAction.post, 1);
  assert.equal(stats.byAction.vote, 1);
  assert.equal(stats.byAction.comment, 0);
  assert.equal(stats.byActionTrigger.post.cron, 1);
  assert.equal(stats.byActionTrigger.vote.manual, 1);
});
