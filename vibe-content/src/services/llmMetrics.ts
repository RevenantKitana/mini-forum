import logger from '../utils/logger.js';

/**
 * In-memory LLM metrics tracker for vibe-content.
 * Records success/failure/latency per provider+model combination.
 * Exposed via the /metrics HTTP endpoint.
 */

export interface ProviderStat {
  provider: string;
  model?: string;
  success: number;
  failure: number;
  fallback: number;       // how many times this provider was a fallback (not first in queue)
  retries: number;
  totalLatencyMs: number;
  lastUsed: number;       // ms timestamp
}

const stats = new Map<string, ProviderStat>();
const fallbackAlerts: string[] = [];

const LLM_SUCCESS_RATE_MIN = 0.5;  // alert if success rate drops below 50%

function key(provider: string): string {
  return provider;
}

export function recordLLMCall(opts: {
  provider: string;
  model?: string;
  success: boolean;
  latencyMs: number;
  retries?: number;
  isFallback?: boolean;
}): void {
  const k = key(opts.provider);
  let s = stats.get(k);
  if (!s) {
    s = {
      provider: opts.provider,
      model: opts.model,
      success: 0,
      failure: 0,
      fallback: 0,
      retries: 0,
      totalLatencyMs: 0,
      lastUsed: 0,
    };
    stats.set(k, s);
  }

  if (opts.success) s.success++; else s.failure++;
  s.totalLatencyMs += opts.latencyMs;
  s.retries += opts.retries ?? 0;
  s.lastUsed = Date.now();
  if (opts.model && !s.model) s.model = opts.model;
  if (opts.isFallback) s.fallback++;

  // Alert on poor success rate (after at least 10 calls)
  const total = s.success + s.failure;
  if (total >= 10 && !opts.success) {
    const rate = s.success / total;
    if (rate < LLM_SUCCESS_RATE_MIN) {
      const msg = `LLM provider ${opts.provider} low success rate: ${(rate * 100).toFixed(1)}% (${s.success}/${total})`;
      if (!fallbackAlerts.includes(msg)) {
        fallbackAlerts.unshift(msg);
        if (fallbackAlerts.length > 20) fallbackAlerts.pop();
        logger.warn(msg, { alert: 'llm_low_success_rate', provider: opts.provider, rate, total });
      }
    }
  }
}

export interface LLMMetricsSnapshot {
  providers: (ProviderStat & { successRate: number; avgLatencyMs: number })[];
  alerts: string[];
}

export function getLLMMetricsSnapshot(): LLMMetricsSnapshot {
  const providers = Array.from(stats.values()).map((s) => {
    const total = s.success + s.failure;
    return {
      ...s,
      successRate: total > 0 ? +(s.success / total).toFixed(4) : 0,
      avgLatencyMs: total > 0 ? Math.round(s.totalLatencyMs / total) : 0,
    };
  });
  return { providers, alerts: fallbackAlerts.slice(0, 10) };
}

export function resetLLMMetrics(): void {
  stats.clear();
  fallbackAlerts.length = 0;
}
