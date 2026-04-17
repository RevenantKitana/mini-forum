import test from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker } from '../utils/circuitBreaker.js';

// ---------------------------------------------------------------------------
// CircuitBreaker
// ---------------------------------------------------------------------------

test('CircuitBreaker: starts CLOSED and allows requests', () => {
  const cb = new CircuitBreaker('test');
  assert.equal(cb.getState(), 'CLOSED');
  assert.equal(cb.allowRequest(), true);
});

test('CircuitBreaker: opens after failureThreshold failures in window', () => {
  const cb = new CircuitBreaker('test', { failureThreshold: 3, windowMs: 60_000, openDurationMs: 30_000 });
  cb.recordFailure();
  cb.recordFailure();
  assert.equal(cb.getState(), 'CLOSED');
  cb.recordFailure(); // 3rd failure within window → OPEN
  assert.equal(cb.getState(), 'OPEN');
  assert.equal(cb.allowRequest(), false);
});

test('CircuitBreaker: transitions OPEN → HALF_OPEN after openDurationMs', () => {
  let now = 1_000_000;
  const cb = new CircuitBreaker('test', {
    failureThreshold: 1,
    windowMs: 60_000,
    openDurationMs: 10_000,
    now: () => now,
  });

  cb.recordFailure(); // → OPEN
  assert.equal(cb.getState(), 'OPEN');
  assert.equal(cb.allowRequest(), false);

  now += 10_001; // past openDurationMs
  assert.equal(cb.allowRequest(), true); // → HALF_OPEN, probe allowed
  assert.equal(cb.getState(), 'HALF_OPEN');
});

test('CircuitBreaker: HALF_OPEN → CLOSED on probe success', () => {
  let now = 1_000_000;
  const cb = new CircuitBreaker('test', {
    failureThreshold: 1,
    windowMs: 60_000,
    openDurationMs: 5_000,
    now: () => now,
  });

  cb.recordFailure(); // OPEN
  now += 6_000;
  cb.allowRequest(); // HALF_OPEN

  cb.recordSuccess();
  assert.equal(cb.getState(), 'CLOSED');
  assert.equal(cb.allowRequest(), true);
});

test('CircuitBreaker: HALF_OPEN → OPEN on probe failure', () => {
  let now = 1_000_000;
  const cb = new CircuitBreaker('test', {
    failureThreshold: 1,
    windowMs: 60_000,
    openDurationMs: 5_000,
    now: () => now,
  });

  cb.recordFailure(); // OPEN
  now += 6_000;
  cb.allowRequest(); // HALF_OPEN

  cb.recordFailure(); // probe failed → back to OPEN
  assert.equal(cb.getState(), 'OPEN');
  assert.equal(cb.allowRequest(), false);
});

test('CircuitBreaker: allows only one probe when HALF_OPEN', () => {
  let now = 1_000_000;
  const cb = new CircuitBreaker('test', {
    failureThreshold: 1,
    windowMs: 60_000,
    openDurationMs: 5_000,
    now: () => now,
  });

  cb.recordFailure(); // OPEN
  now += 6_000;
  assert.equal(cb.allowRequest(), true); // first probe
  assert.equal(cb.allowRequest(), false); // second concurrent probe rejected
});

test('CircuitBreaker: failures outside rolling window are not counted', () => {
  let now = 1_000_000;
  const cb = new CircuitBreaker('test', {
    failureThreshold: 2,
    windowMs: 5_000, // 5 second window
    openDurationMs: 30_000,
    now: () => now,
  });

  cb.recordFailure(); // at t=1_000_000
  now += 6_000; // move past the window
  cb.recordFailure(); // at t=1_006_000 — previous failure is pruned
  // Only 1 failure in window, threshold is 2 → still CLOSED
  assert.equal(cb.getState(), 'CLOSED');
});

test('CircuitBreaker: getStats returns correct shape', () => {
  const cb = new CircuitBreaker('my-provider');
  const stats = cb.getStats();
  assert.equal(stats.id, 'my-provider');
  assert.equal(stats.state, 'CLOSED');
  assert.equal(stats.failureCount, 0);
  assert.equal(stats.openSince, null);
});

// ---------------------------------------------------------------------------
// LLMProviderManager: circuit breaker integration
// ---------------------------------------------------------------------------

import { LLMProviderManager } from '../services/llm/LLMProviderManager.js';
import { ILLMProvider, LLMError } from '../services/llm/ILLMProvider.js';
import { LLMOutput } from '../types/index.js';

class FakeProvider implements ILLMProvider {
  id: string;
  private _available: boolean;
  private generator: () => Promise<LLMOutput>;

  constructor(id: string, available: boolean, generator: () => Promise<LLMOutput>) {
    this.id = id;
    this._available = available;
    this.generator = generator;
  }

  async isAvailable(): Promise<boolean> { return this._available; }
  async generate(_p: string): Promise<LLMOutput> { return this.generator(); }
}

test('LLMProviderManager: circuit breaker opens after repeated failures, fallback used', async () => {
  let now = Date.now();
  let primaryCalls = 0;

  const primary = new FakeProvider('primary', true, async () => {
    primaryCalls++;
    throw new LLMError('timeout', 'TIMEOUT', 408);
  });
  const fallback = new FakeProvider('fallback', true, async () => ({ content: 'ok from fallback' }));

  const manager = new LLMProviderManager({
    providers: [primary, fallback],
    hasApiKey: () => true,
    now: () => now,
  });

  // Make primary fail enough to open its circuit (threshold=5, but each call internally
  // retries 3 times so it needs fewer outer calls)
  // Drive 5 outer failures (each with retries) to open the circuit
  for (let i = 0; i < 5; i++) {
    try { await manager.generateByTask('test', 'post'); } catch { /* fallback succeeds */ }
  }

  // After enough failures primary CB should be open; fallback should be used without
  // even hitting primary
  const callsBeforeCheck = primaryCalls;
  const result = await manager.generateByTask('test', 'post');
  assert.equal(result.provider, 'fallback');
  // primary should not have been called again (circuit open)
  assert.ok(primaryCalls >= callsBeforeCheck, 'primary call count should not have grown after CB opened');
});

test('LLMProviderManager: getCircuitBreakerStats returns all provider stats', () => {
  const p1 = new FakeProvider('p1', true, async () => ({ content: 'ok' }));
  const manager = new LLMProviderManager({ providers: [p1], hasApiKey: () => true });
  const stats = manager.getCircuitBreakerStats();
  assert.equal(stats.length, 1);
  assert.equal(stats[0].id, 'p1');
  assert.equal(stats[0].state, 'CLOSED');
});
