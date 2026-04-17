import test from 'node:test';
import assert from 'node:assert/strict';
import { RetryQueue, classifyError, FailedAction } from '../scheduler/retryQueue.js';

// ---------------------------------------------------------------------------
// classifyError
// ---------------------------------------------------------------------------

test('classifyError: timeout messages', () => {
  assert.equal(classifyError('Request timeout after 30000ms'), 'timeout');
  assert.equal(classifyError('ETIMEDOUT connecting to host'), 'timeout');
  assert.equal(classifyError('ECONNRESET by peer'), 'timeout');
  assert.equal(classifyError('connection aborted ECONNABORTED'), 'timeout');
});

test('classifyError: rate_limited messages', () => {
  assert.equal(classifyError('Rate limited (429)'), 'rate_limited');
  assert.equal(classifyError('429 too many requests'), 'rate_limited');
  assert.equal(classifyError('rate_limit exceeded'), 'rate_limited');
});

test('classifyError: server_error messages', () => {
  assert.equal(classifyError('API error (500): internal server error'), 'server_error');
  assert.equal(classifyError('Bad Gateway 502'), 'server_error');
  assert.equal(classifyError('Service Unavailable 503'), 'server_error');
  assert.equal(classifyError('504 gateway timeout'), 'server_error');
});

test('classifyError: parse_fail messages', () => {
  assert.equal(classifyError('Validation failed: title too short'), 'parse_fail');
  assert.equal(classifyError('Quality check failed: no content'), 'parse_fail');
  assert.equal(classifyError('JSON parse error'), 'parse_fail');
});

test('classifyError: unknown for unrecognized messages', () => {
  assert.equal(classifyError('something completely unexpected'), 'unknown');
  assert.equal(classifyError(''), 'unknown');
});

// ---------------------------------------------------------------------------
// RetryQueue: enqueue & filtering
// ---------------------------------------------------------------------------

test('RetryQueue: parse_fail errors are not enqueued', () => {
  const q = new RetryQueue();
  q.add(1, 'post', 'Validation failed: title missing');
  assert.equal(q.getAll().length, 0);
  assert.equal(q.getStats().total, 0);
});

test('RetryQueue: timeout error is enqueued with correct maxRetries=3', () => {
  const q = new RetryQueue();
  q.add(1, 'post', 'Request timeout after 15000ms');
  const all = q.getAll();
  assert.equal(all.length, 1);
  assert.equal(all[0].errorCategory, 'timeout');
  assert.equal(all[0].maxRetries, 3);
});

test('RetryQueue: rate_limited error enqueued with maxRetries=2', () => {
  const q = new RetryQueue();
  q.add(2, 'comment', '429 rate limit exceeded');
  const all = q.getAll();
  assert.equal(all.length, 1);
  assert.equal(all[0].errorCategory, 'rate_limited');
  assert.equal(all[0].maxRetries, 2);
});

// ---------------------------------------------------------------------------
// RetryQueue: retry lifecycle
// ---------------------------------------------------------------------------

test('RetryQueue: getRetryable returns nothing before backoff elapses', () => {
  const q = new RetryQueue();
  q.add(1, 'post', 'Request timeout');
  assert.equal(q.getRetryable().length, 0); // retryAfter is in the future
});

test('RetryQueue: success removes item from queue', () => {
  const q = new RetryQueue(3) as any;
  // Manually push an already-due item
  const id = 'test-id-1';
  q.queue.push({
    id,
    userId: 1,
    actionType: 'post',
    error: 'timeout',
    errorCategory: 'timeout',
    retryCount: 0,
    maxRetries: 3,
    retryAfter: Date.now() - 1,
    createdAt: Date.now() - 5000,
  });
  assert.equal(q.getRetryable().length, 1);
  q.markRetried(id, true);
  assert.equal(q.getAll().length, 0);
  assert.equal(q.getStats().dlqSize, 0);
});

test('RetryQueue: failed item moves to DLQ after max retries', () => {
  const q = new RetryQueue(3) as any;
  const id = 'test-id-dlq';
  q.queue.push({
    id,
    userId: 5,
    actionType: 'comment',
    error: 'server error 500',
    errorCategory: 'server_error',
    retryCount: 2, // already at maxRetries - 1
    maxRetries: 3,
    retryAfter: Date.now() - 1,
    createdAt: Date.now() - 10000,
  });
  q.markRetried(id, false);
  assert.equal(q.getAll().length, 0, 'should be removed from active queue');
  assert.equal(q.getStats().dlqSize, 1, 'should be in DLQ');
  const dlq = q.getDeadLetterQueue();
  assert.equal(dlq[0].id, id);
  assert.equal(dlq[0].errorCategory, 'server_error');
  assert.ok(dlq[0].deadAt > 0);
});

test('RetryQueue: DLQ is bounded to MAX_DLQ_SIZE', () => {
  const q = new RetryQueue(1) as any; // maxRetries=1 so quickly dead-lettered
  for (let i = 0; i < 110; i++) {
    const id = `id-${i}`;
    q.queue.push({
      id,
      userId: i,
      actionType: 'vote',
      error: 'server_error 500',
      errorCategory: 'server_error',
      retryCount: 0,
      maxRetries: 1,
      retryAfter: Date.now() - 1,
      createdAt: Date.now() - 1000,
    });
    q.markRetried(id, false);
  }
  assert.ok(q.getDeadLetterQueue().length <= 100, 'DLQ must be bounded at 100');
});

test('RetryQueue: exponential backoff grows for server_error', () => {
  const q = new RetryQueue(3) as any;
  const id = 'backoff-test';
  q.queue.push({
    id,
    userId: 1,
    actionType: 'post',
    error: 'internal server error 500',
    errorCategory: 'server_error',
    retryCount: 0,
    maxRetries: 3,
    retryAfter: Date.now() - 1,
    createdAt: Date.now() - 1000,
  });

  const before = Date.now();
  q.markRetried(id, false); // attempt 1 fails
  const item: FailedAction = q.getAll()[0];
  assert.equal(item.retryCount, 1);
  // For server_error, baseBackoffMs = 120_000; after 1 failure: 2^1 * 120_000 = 240_000ms
  assert.ok(item.retryAfter > before + 200_000, 'backoff should be > 200s for server_error attempt 1');
});

// ---------------------------------------------------------------------------
// RetryQueue: stats
// ---------------------------------------------------------------------------

test('RetryQueue: getStats reflects pending vs retrying vs total', () => {
  const q = new RetryQueue() as any;
  // One pending (in future), one retryable (past due)
  q.queue.push({
    id: 'pending',
    userId: 1,
    actionType: 'post',
    error: 'timeout',
    errorCategory: 'timeout',
    retryCount: 0,
    maxRetries: 3,
    retryAfter: Date.now() + 60_000,
    createdAt: Date.now(),
  });
  q.queue.push({
    id: 'due',
    userId: 2,
    actionType: 'comment',
    error: 'timeout',
    errorCategory: 'timeout',
    retryCount: 0,
    maxRetries: 3,
    retryAfter: Date.now() - 1,
    createdAt: Date.now() - 5000,
  });
  const stats = q.getStats();
  assert.equal(stats.pending, 1);
  assert.equal(stats.retrying, 1);
  assert.equal(stats.total, 2);
  assert.equal(stats.dlqSize, 0);
});
