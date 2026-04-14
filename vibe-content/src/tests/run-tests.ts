import assert from 'node:assert/strict';
import { ActionHistoryTracker } from '../tracking/ActionHistoryTracker.js';
import { LLMProviderManager } from '../services/llm/LLMProviderManager.js';
import { ILLMProvider, LLMError } from '../services/llm/ILLMProvider.js';
import { LLMOutput } from '../types/index.js';

class FakeProvider implements ILLMProvider {
  id: string;
  private available: boolean;
  private generator: () => Promise<LLMOutput>;

  constructor(id: string, available: boolean, generator: () => Promise<LLMOutput>) {
    this.id = id;
    this.available = available;
    this.generator = generator;
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async generate(_prompt: string): Promise<LLMOutput> {
    return this.generator();
  }
}

function testActionHistoryTracker(): void {
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
  assert.equal(recent[0].completedAt, '2026-04-14T01:05:00.000Z');

  const stats = tracker.getTodayStats(new Date('2026-04-14T04:00:00.000Z'));
  assert.equal(stats.totalActions, 2);
  assert.equal(stats.successCount, 1);
  assert.equal(stats.failedCount, 1);
  assert.equal(stats.byTrigger.cron, 1);
  assert.equal(stats.byTrigger.manual, 1);
  assert.equal(stats.byTrigger.retry, 0);
  assert.equal(stats.byAction.post, 1);
  assert.equal(stats.byAction.comment, 1);
  assert.equal(stats.byAction.vote, 0);
  assert.equal(stats.byActionTrigger.post.cron, 1);
  assert.equal(stats.byActionTrigger.comment.manual, 1);
}

async function testProviderSnapshot(): Promise<void> {
  const missingKeyProvider = new FakeProvider('groq-70b', true, async () => ({ content: 'ok' }));
  const missingKeyManager = new LLMProviderManager({
    providers: [missingKeyProvider],
    hasApiKey: () => false,
  });
  const missingKeySnapshot = await missingKeyManager.getProviderStatusSnapshot();
  assert.equal(missingKeySnapshot[0].reason, 'missing_api_key');

  const authErrorProvider = new FakeProvider('groq-70b', true, async () => {
    throw new LLMError('auth failed', 'AUTH', 401);
  });
  const authErrorManager = new LLMProviderManager({
    providers: [authErrorProvider],
    hasApiKey: () => true,
  });
  await assert.rejects(() => authErrorManager.generate('hello'));
  const authSnapshot = await authErrorManager.getProviderStatusSnapshot();
  assert.equal(authSnapshot[0].reason, 'auth_error');

  let now = Date.parse('2026-04-14T00:00:00.000Z');
  const cooldownProvider = new FakeProvider('groq-70b', true, async () => {
    throw new LLMError('too many requests', 'RATE_LIMIT', 429);
  });
  const cooldownManager = new LLMProviderManager({
    providers: [cooldownProvider],
    hasApiKey: () => true,
    now: () => now,
  });
  await assert.rejects(() => cooldownManager.generate('hello'));
  const cooldownSnapshot = await cooldownManager.getProviderStatusSnapshot();
  assert.equal(cooldownSnapshot[0].reason, 'cooldown');
  assert.ok(cooldownSnapshot[0].cooldownUntil);

  now = Date.parse('2026-04-14T03:30:00.000Z');
  const afterCooldown = await cooldownManager.getProviderStatusSnapshot();
  assert.notEqual(afterCooldown[0].reason, 'cooldown');

  const p1 = new FakeProvider('gemini-flash', true, async () => ({ content: 'ok' }));
  const p2 = new FakeProvider('groq-70b', true, async () => ({ content: 'ok' }));
  const stackManager = new LLMProviderManager({
    providers: [p1, p2],
    hasApiKey: (providerId) => providerId !== 'groq-70b',
  });
  const stack = await stackManager.getProviderStackSnapshot();
  assert.equal(stack[0].priority, 1);
  assert.equal(stack[0].id, 'gemini-flash');
  assert.equal(stack[0].model, 'gemini-2.5-flash');
  assert.equal(stack[1].priority, 2);
  assert.equal(stack[1].reason, 'missing_api_key');
}

async function run(): Promise<void> {
  testActionHistoryTracker();
  await testProviderSnapshot();
  // eslint-disable-next-line no-console
  console.log('All tests passed: ActionHistoryTracker + LLMProviderManager snapshot');
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Tests failed:', error);
  process.exitCode = 1;
});
