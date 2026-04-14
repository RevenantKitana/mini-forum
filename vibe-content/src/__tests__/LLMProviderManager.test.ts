import test from 'node:test';
import assert from 'node:assert/strict';
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

test('provider snapshot marks missing_api_key', async () => {
  const provider = new FakeProvider('groq-70b', true, async () => ({ content: 'ok' }));
  const manager = new LLMProviderManager({
    providers: [provider],
    hasApiKey: () => false,
  });

  const snapshot = await manager.getProviderStatusSnapshot();
  assert.equal(snapshot[0].available, false);
  assert.equal(snapshot[0].reason, 'missing_api_key');
});

test('provider snapshot keeps auth_error after failed generation', async () => {
  const provider = new FakeProvider('groq-70b', true, async () => {
    throw new LLMError('auth failed', 'AUTH', 401);
  });
  const manager = new LLMProviderManager({
    providers: [provider],
    hasApiKey: () => true,
  });

  await assert.rejects(() => manager.generate('hello'));
  const snapshot = await manager.getProviderStatusSnapshot();
  assert.equal(snapshot[0].available, false);
  assert.equal(snapshot[0].reason, 'auth_error');
});

test('provider snapshot returns cooldown when provider is cooling down', async () => {
  let now = Date.parse('2026-04-14T00:00:00.000Z');
  const provider = new FakeProvider('groq-70b', true, async () => {
    throw new LLMError('too many requests', 'RATE_LIMIT', 429);
  });
  const manager = new LLMProviderManager({
    providers: [provider],
    now: () => now,
    hasApiKey: () => true,
  });

  await assert.rejects(() => manager.generate('hello'));
  const snapshot = await manager.getProviderStatusSnapshot();
  assert.equal(snapshot[0].available, false);
  assert.equal(snapshot[0].reason, 'cooldown');
  assert.ok(snapshot[0].cooldownUntil);

  now = Date.parse('2026-04-14T03:30:00.000Z');
  const afterCooldown = await manager.getProviderStatusSnapshot();
  assert.equal(afterCooldown[0].reason !== 'cooldown', true);
});

test('provider stack snapshot keeps priority order and model metadata', async () => {
  const p1 = new FakeProvider('gemini-flash', true, async () => ({ content: 'ok' }));
  const p2 = new FakeProvider('groq-70b', true, async () => ({ content: 'ok' }));
  const manager = new LLMProviderManager({
    providers: [p1, p2],
    hasApiKey: (providerId) => providerId !== 'groq-70b',
  });

  const stack = await manager.getProviderStackSnapshot();
  assert.equal(stack.length, 2);
  assert.equal(stack[0].priority, 1);
  assert.equal(stack[0].id, 'gemini-flash');
  assert.equal(stack[0].model, 'gemini-2.5-flash');
  assert.equal(stack[0].available, true);
  assert.equal(stack[1].priority, 2);
  assert.equal(stack[1].id, 'groq-70b');
  assert.equal(stack[1].reason, 'missing_api_key');
});
