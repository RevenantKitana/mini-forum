import test from 'node:test';
import assert from 'node:assert/strict';
import { DistributedLock, LOCK_KEYS } from '../utils/distributedLock.js';

// ---------------------------------------------------------------------------
// DistributedLock unit test (using stub prisma)
// ---------------------------------------------------------------------------

function makeStubPrisma(acquireResult: boolean) {
  return {
    $queryRaw: async (_tpl: any, ..._args: any[]) => [{ acquired: acquireResult }],
    $disconnect: async () => {},
  };
}

test('DistributedLock: returns true when pg_try_advisory_lock succeeds', async () => {
  const lock = new DistributedLock(makeStubPrisma(true));
  const acquired = await lock.tryAcquire(LOCK_KEYS.CRON_SCHEDULER);
  assert.equal(acquired, true);
  await lock.disconnect();
});

test('DistributedLock: returns false when lock is already held', async () => {
  const lock = new DistributedLock(makeStubPrisma(false));
  const acquired = await lock.tryAcquire(LOCK_KEYS.CRON_SCHEDULER);
  assert.equal(acquired, false);
  await lock.disconnect();
});

test('DistributedLock: release is a no-op when lock was never acquired', async () => {
  const lock = new DistributedLock(makeStubPrisma(false));
  // Should not throw even if lock was not acquired
  await assert.doesNotReject(() => lock.release(LOCK_KEYS.CRON_SCHEDULER));
  await lock.disconnect();
});

test('DistributedLock: release calls pg_advisory_unlock after acquire', async () => {
  let releaseCalled = false;
  const stubPrisma = {
    $queryRaw: async () => {
      releaseCalled = true;
      return [{ acquired: true }];
    },
    $disconnect: async () => {},
  };

  const lock = new DistributedLock(stubPrisma);
  await lock.tryAcquire(LOCK_KEYS.CRON_SCHEDULER);
  releaseCalled = false; // reset after acquire
  await lock.release(LOCK_KEYS.CRON_SCHEDULER);
  assert.equal(releaseCalled, true, 'pg_advisory_unlock should be called on release');
  await lock.disconnect();
});

test('DistributedLock: gracefully handles DB error in tryAcquire', async () => {
  const errorPrisma = {
    $queryRaw: async () => { throw new Error('DB connection failed'); },
    $disconnect: async () => {},
  };
  const lock = new DistributedLock(errorPrisma);
  const acquired = await lock.tryAcquire(LOCK_KEYS.CRON_SCHEDULER);
  assert.equal(acquired, false, 'Should return false (not throw) on DB error');
  await lock.disconnect();
});

// ---------------------------------------------------------------------------
// CronScheduler: in-process double-run guard
// (We don't run the full cron timer here; just verify the flag logic
//  by simulating what the scheduler does internally.)
// ---------------------------------------------------------------------------

test('cronScheduler guard: second concurrent invocation is skipped', async () => {
  let runCount = 0;

  // Simulate the isRunning guard behaviour
  let isRunning = false;
  const mockAcquire = async () => true;
  const mockRelease = async () => {};

  async function simulateCronTick() {
    if (isRunning) return 'skipped';
    isRunning = true;
    try {
      await new Promise((r) => setTimeout(r, 5)); // simulate async work
      runCount++;
    } finally {
      isRunning = false;
    }
    return 'ran';
  }

  const [r1, r2] = await Promise.all([simulateCronTick(), simulateCronTick()]);
  assert.equal(runCount, 1, 'Only one tick should run concurrently');
  assert.ok(
    (r1 === 'ran' && r2 === 'skipped') || (r1 === 'skipped' && r2 === 'ran'),
    'One tick should run, other should be skipped',
  );
});
