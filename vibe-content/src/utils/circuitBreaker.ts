/**
 * Circuit breaker for LLM providers.
 *
 * States:
 *   CLOSED  — normal operation, failures counted
 *   OPEN    — provider rejected; requests fail-fast until cooldown expires
 *   HALF_OPEN — one probe request allowed to test recovery
 *
 * Transitions:
 *   CLOSED  → OPEN      when failureCount >= failureThreshold within windowMs
 *   OPEN    → HALF_OPEN after openDurationMs elapses
 *   HALF_OPEN → CLOSED  on probe success
 *   HALF_OPEN → OPEN    on probe failure (reset timer)
 */

import logger from './logger.js';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Number of failures in the rolling window before opening. Default: 5 */
  failureThreshold?: number;
  /** Rolling window in ms for failure counting. Default: 60_000 (1 min) */
  windowMs?: number;
  /** Duration the circuit stays OPEN before trying HALF_OPEN. Default: 120_000 (2 min) */
  openDurationMs?: number;
  /** Injected clock for testability. Default: Date.now */
  now?: () => number;
}

interface FailureRecord {
  at: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: FailureRecord[] = [];
  private openSince: number | null = null;
  private probeInFlight: boolean = false;

  private readonly failureThreshold: number;
  private readonly windowMs: number;
  private readonly openDurationMs: number;
  private readonly now: () => number;

  constructor(public readonly id: string, options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.windowMs = options.windowMs ?? 60_000;
    this.openDurationMs = options.openDurationMs ?? 120_000;
    this.now = options.now ?? (() => Date.now());
  }

  /**
   * Returns true if the circuit allows the call to proceed.
   * Returns false if the circuit is OPEN (fail-fast path).
   */
  allowRequest(): boolean {
    const now = this.now();

    if (this.state === 'CLOSED') return true;

    if (this.state === 'OPEN') {
      if (this.openSince !== null && now - this.openSince >= this.openDurationMs) {
        this.transitionTo('HALF_OPEN');
        this.probeInFlight = false; // allow one probe
      } else {
        return false; // still open
      }
    }

    if (this.state === 'HALF_OPEN') {
      if (this.probeInFlight) {
        return false; // only one probe at a time
      }
      this.probeInFlight = true;
      return true;
    }

    return true;
  }

  /** Call on successful completion of a request. */
  recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('CLOSED');
      this.failures = [];
    }
    // In CLOSED state success is a no-op (failures are time-windowed)
  }

  /** Call when a request fails. */
  recordFailure(): void {
    const now = this.now();
    // Prune old failures outside rolling window
    this.failures = this.failures.filter((f) => now - f.at < this.windowMs);
    this.failures.push({ at: now });

    if (this.state === 'HALF_OPEN') {
      // Probe failed → back to OPEN
      this.probeInFlight = false;
      this.transitionTo('OPEN');
      return;
    }

    if (this.state === 'CLOSED' && this.failures.length >= this.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  getState(): CircuitState {
    // Lazily check if OPEN → HALF_OPEN transition is due
    this.allowRequest();
    return this.state;
  }

  getStats() {
    return {
      id: this.id,
      state: this.state,
      failureCount: this.failures.length,
      openSince: this.openSince ? new Date(this.openSince).toISOString() : null,
    };
  }

  private transitionTo(next: CircuitState): void {
    const prev = this.state;
    this.state = next;
    if (next === 'OPEN') {
      this.openSince = this.now();
      logger.warn(`[circuit_breaker] ${this.id}: ${prev} → OPEN (${this.failures.length} failures in window)`);
    } else if (next === 'HALF_OPEN') {
      logger.info(`[circuit_breaker] ${this.id}: OPEN → HALF_OPEN (probing...)`);
    } else if (next === 'CLOSED') {
      this.openSince = null;
      logger.info(`[circuit_breaker] ${this.id}: HALF_OPEN → CLOSED (recovered)`);
    }
  }
}
