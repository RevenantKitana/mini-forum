import { logger } from '../utils/logger.js';

/**
 * In-memory metrics store for operational observability.
 *
 * Tracks per-minute windows for:
 *  - request count / error count (latency histogram buckets)
 *  - throughput (req/s rolling)
 *  - LLM provider success/failure/latency
 *
 * All values are intentionally lightweight (no external deps).
 * For production-grade metrics, replace with Prometheus / OpenTelemetry.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LatencyBucket {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  max: number;
  samples: number;
}

export interface WindowMetrics {
  windowStart: number;       // ms timestamp
  requests: number;
  errors: number;
  latencies: number[];       // raw sample array (capped at 1000)
}

export interface LLMProviderMetrics {
  provider: string;
  model?: string;
  success: number;
  failure: number;
  totalLatencyMs: number;
  retries: number;
  lastUpdated: number;
}

export interface MetricsSnapshot {
  uptime_s: number;
  total_requests: number;
  total_errors: number;
  error_rate: number;
  throughput_rps: number;
  latency: LatencyBucket;
  windows: WindowMetrics[];
  llm: LLMProviderMetrics[];
  alert_active: boolean;
  alerts: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WINDOW_MS = 60_000;           // 1-minute buckets
const MAX_WINDOWS = 60;             // keep 60 minutes of history
const MAX_LATENCY_SAMPLES = 1000;   // cap per window
const ERROR_RATE_ALERT_THRESHOLD = 0.1;  // alert when error rate > 10%
const MIN_REQUESTS_FOR_ALERT = 20;       // need at least 20 req in window

// ─── State ────────────────────────────────────────────────────────────────────

const startTime = Date.now();
let totalRequests = 0;
let totalErrors = 0;
const windows: WindowMetrics[] = [];
const llmMetrics = new Map<string, LLMProviderMetrics>();
const activeAlerts: string[] = [];

function currentWindow(): WindowMetrics {
  const now = Date.now();
  const bucket = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  let w = windows[windows.length - 1];
  if (!w || w.windowStart !== bucket) {
    w = { windowStart: bucket, requests: 0, errors: 0, latencies: [] };
    windows.push(w);
    if (windows.length > MAX_WINDOWS) windows.shift();
    checkAlerts();
  }
  return w;
}

function checkAlerts(): void {
  // Look at the last closed window (index -2 if length >= 2)
  if (windows.length < 2) return;
  const prev = windows[windows.length - 2];
  if (prev.requests < MIN_REQUESTS_FOR_ALERT) return;

  const rate = prev.errors / prev.requests;
  const msg = `High error rate: ${(rate * 100).toFixed(1)}% (${prev.errors}/${prev.requests}) in window ${new Date(prev.windowStart).toISOString()}`;

  if (rate >= ERROR_RATE_ALERT_THRESHOLD) {
    // avoid duplicate alerts
    if (!activeAlerts.includes(msg)) {
      activeAlerts.unshift(msg);
      if (activeAlerts.length > 20) activeAlerts.pop();
      logger.warn('ALERT: ' + msg, { alert: 'error_rate_spike', rate, window: prev.windowStart });
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function recordRequest(durationMs: number, isError: boolean): void {
  totalRequests++;
  if (isError) totalErrors++;

  const w = currentWindow();
  w.requests++;
  if (isError) w.errors++;
  if (w.latencies.length < MAX_LATENCY_SAMPLES) {
    w.latencies.push(durationMs);
  }
}

export function recordLLMCall(
  provider: string,
  model: string | undefined,
  success: boolean,
  latencyMs: number,
  retries = 0,
): void {
  const key = provider;
  let m = llmMetrics.get(key);
  if (!m) {
    m = { provider, model, success: 0, failure: 0, totalLatencyMs: 0, retries: 0, lastUpdated: 0 };
    llmMetrics.set(key, m);
  }
  if (success) m.success++; else m.failure++;
  m.totalLatencyMs += latencyMs;
  m.retries += retries;
  m.lastUpdated = Date.now();
  if (model && !m.model) m.model = model;
}

function computeLatency(allLatencies: number[]): LatencyBucket {
  if (allLatencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0, max: 0, samples: 0 };
  }
  const sorted = [...allLatencies].sort((a, b) => a - b);
  const len = sorted.length;
  const p = (pct: number) => sorted[Math.floor(len * pct / 100)] ?? sorted[len - 1];
  return {
    p50: Math.round(p(50)),
    p95: Math.round(p(95)),
    p99: Math.round(p(99)),
    avg: Math.round(sorted.reduce((a, b) => a + b, 0) / len),
    max: sorted[len - 1],
    samples: len,
  };
}

export function getSnapshot(): MetricsSnapshot {
  // Aggregate latencies across all windows
  const allLatencies = windows.flatMap((w) => w.latencies);
  const latency = computeLatency(allLatencies);

  // Throughput: requests in last 60 s
  const now = Date.now();
  const recentRequests = windows
    .filter((w) => now - w.windowStart < 60_000)
    .reduce((sum, w) => sum + w.requests, 0);
  const throughput_rps = +(recentRequests / 60).toFixed(2);

  const error_rate = totalRequests > 0 ? +(totalErrors / totalRequests).toFixed(4) : 0;

  return {
    uptime_s: Math.round((now - startTime) / 1000),
    total_requests: totalRequests,
    total_errors: totalErrors,
    error_rate,
    throughput_rps,
    latency,
    windows: windows.slice(-10).map((w) => ({
      windowStart: w.windowStart,
      requests: w.requests,
      errors: w.errors,
      latencies: [], // don't expose raw samples via API
    })),
    llm: Array.from(llmMetrics.values()),
    alert_active: activeAlerts.length > 0,
    alerts: activeAlerts.slice(0, 10),
  };
}

export function resetMetrics(): void {
  totalRequests = 0;
  totalErrors = 0;
  windows.length = 0;
  llmMetrics.clear();
  activeAlerts.length = 0;
}
