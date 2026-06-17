import { LLMProviderManager } from './llm/LLMProviderManager.js';
import logger from '../utils/logger.js';

export interface LLMProviderHealth {
  id: string;
  available: boolean;
  reason?: string;
  message?: string;
  checkedAt: string;
  cooldownUntil?: string;
  circuitState?: 'OPEN' | 'CLOSED';
  failureCount?: number;
  openSince?: string | null;
}

export interface LLMHealthCheckResult {
  timestamp: string;
  totalProviders: number;
  availableCount: number;
  unavailableCount: number;
  providers: LLMProviderHealth[];
  summary: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    availabilityRate: number; // percentage
    message: string;
  };
}

export class LLMHealthCheckService {
  constructor(private llmManager: LLMProviderManager) {}

  /**
   * Perform comprehensive health check on all LLM providers
   */
  async checkAllProviders(): Promise<LLMHealthCheckResult> {
    try {
      const startTime = Date.now();

      // Get provider status snapshot and circuit breaker stats in parallel
      const [statusSnapshot, cbStats] = await Promise.all([
        this.llmManager.getProviderStatusSnapshot(),
        Promise.resolve(this.llmManager.getCircuitBreakerStats()),
      ]);

      // Create a map for quick circuit breaker lookup
      const cbMap = new Map(cbStats.map((c) => [c.id, c]));

      // Build detailed provider health information
      const providers: LLMProviderHealth[] = statusSnapshot.map((p) => {
        const cb = cbMap.get(p.id);
        return {
          id: p.id,
          available: p.available,
          reason: p.reason,
          message: p.message,
          checkedAt: p.checkedAt,
          cooldownUntil: p.cooldownUntil,
          circuitState: cb?.state ?? 'CLOSED',
          failureCount: cb?.failureCount,
          openSince: cb?.openSince,
        };
      });

      // Calculate statistics
      const availableCount = providers.filter((p) => p.available).length;
      const unavailableCount = providers.length - availableCount;
      const availabilityRate = Math.round((availableCount / providers.length) * 100);

      // Determine overall health status
      let overall: 'healthy' | 'degraded' | 'unhealthy';
      let message: string;

      if (availableCount === providers.length) {
        overall = 'healthy';
        message = `All ${providers.length} LLM providers are available`;
      } else if (availableCount > 0) {
        overall = 'degraded';
        message = `${availableCount}/${providers.length} LLM providers available (${unavailableCount} unavailable)`;
      } else {
        overall = 'unhealthy';
        message = 'All LLM providers are currently unavailable';
      }

      const result: LLMHealthCheckResult = {
        timestamp: new Date().toISOString(),
        totalProviders: providers.length,
        availableCount,
        unavailableCount,
        providers,
        summary: {
          overall,
          availabilityRate,
          message,
        },
      };

      const elapsedMs = Date.now() - startTime;
      logger.info(`LLM health check completed in ${elapsedMs}ms`, {
        totalProviders: providers.length,
        available: availableCount,
        unavailable: unavailableCount,
        status: overall,
        elapsedMs,
      });

      return result;
    } catch (error: any) {
      logger.error(`LLM health check failed: ${error.message}`, { error });
      throw new Error(`Failed to perform LLM health check: ${error.message}`);
    }
  }

  /**
   * Get quick health status summary (minimal info)
   */
  async getQuickStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    available: number;
    total: number;
    message: string;
  }> {
    const check = await this.checkAllProviders();
    return {
      status: check.summary.overall,
      available: check.availableCount,
      total: check.totalProviders,
      message: check.summary.message,
    };
  }

  /**
   * Get specific provider health status
   */
  async getProviderHealth(providerId: string): Promise<LLMProviderHealth | null> {
    const check = await this.checkAllProviders();
    return check.providers.find((p) => p.id === providerId) || null;
  }

  /**
   * Get providers grouped by status
   */
  async getProvidersByStatus(): Promise<{
    available: string[];
    unavailable: string[];
    cooldown: string[];
    circuitOpen: string[];
  }> {
    const check = await this.checkAllProviders();

    const grouped = {
      available: check.providers.filter((p) => p.available).map((p) => p.id),
      unavailable: check.providers.filter((p) => !p.available).map((p) => p.id),
      cooldown: check.providers.filter((p) => p.reason === 'cooldown').map((p) => p.id),
      circuitOpen: check.providers.filter((p) => p.circuitState === 'OPEN').map((p) => p.id),
    };

    return grouped;
  }
}
