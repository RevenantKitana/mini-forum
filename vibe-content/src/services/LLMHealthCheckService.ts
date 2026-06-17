import { LLMProviderManager } from './llm/LLMProviderManager.js';
import { ILLMProvider } from './llm/ILLMProvider.js';
import logger from '../utils/logger.js';

// Minimal prompt để test model hoạt động (tiêu hao ít tokens nhất)
// Yêu cầu LLM phải trả lời nhưng không cần response JSON phức tạp
const HEALTH_CHECK_PROMPT = 'Respond with exactly: "health_check_ok"';

// Timeout cho mỗi provider health check (milliseconds)
const PROVIDER_HEALTH_CHECK_TIMEOUT_MS = 15 * 1000; // 15 seconds

export interface LLMProviderHealth {
  id: string;
  available: boolean;
  reason?: string;
  message?: string;
  checkedAt: string;
  cooldownUntil?: string;
  circuitState?: 'OPEN' | 'CLOSED' | 'HALF_OPEN';
  failureCount?: number;
  openSince?: string | null;
  responseTimeMs?: number;
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
    avgResponseTimeMs?: number;
  };
}

export class LLMHealthCheckService {
  constructor(private llmManager: LLMProviderManager) {}

  /**
   * Test provider bằng cách gọi generate() với minimal prompt
   * Returns null nếu test thất bại
   */
  private async testProviderWithTimeout(
    provider: ILLMProvider,
    timeoutMs: number,
  ): Promise<{ success: boolean; responseTimeMs: number; error?: string }> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await provider.generate(HEALTH_CHECK_PROMPT);
      const responseTimeMs = Date.now() - startTime;
      clearTimeout(timeoutId);
      return { success: true, responseTimeMs };
    } catch (error: any) {
      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;
      const errorMsg = error?.message || 'Unknown error';
      
      // Timeout errors
      if (error?.name === 'AbortError' || responseTimeMs >= timeoutMs) {
        return {
          success: false,
          responseTimeMs,
          error: `Request timeout after ${timeoutMs}ms`,
        };
      }

      return {
        success: false,
        responseTimeMs,
        error: errorMsg,
      };
    }
  }

  /**
   * Perform comprehensive health check on all LLM providers
   * Gọi generate() thực sự (không chỉ check config) để test model hoạt động
   */
  async checkAllProviders(): Promise<LLMHealthCheckResult> {
    try {
      const startTime = Date.now();

      // Get provider list and circuit breaker stats
      const providers = this.llmManager.getProviders();
      const cbStats = this.llmManager.getCircuitBreakerStats();
      const cbMap = new Map(cbStats.map((c) => [c.id, c]));

      // Perform real health test on all providers in parallel
      const testPromises = providers.map(async (provider) => {
        try {
          const providerId = provider.id;

          // First check: is API key configured?
          const hasApiKey = this.llmManager.checkProviderApiKey(providerId);
          if (!hasApiKey) {
            return {
              id: providerId,
              available: false,
              reason: 'missing_api_key' as const,
              message: 'API key is not configured',
              checkedAt: new Date().toISOString(),
              responseTimeMs: 0,
            };
          }

          // Second check: is provider in circuit breaker open?
          const cb = cbMap.get(providerId);
          if (cb?.state === 'OPEN') {
            return {
              id: providerId,
              available: false,
              reason: 'circuit_breaker_open' as const,
              message: `Circuit breaker is OPEN (${cb?.failureCount || 0} failures)`,
              checkedAt: new Date().toISOString(),
              circuitState: 'OPEN' as const,
              failureCount: cb?.failureCount,
              responseTimeMs: 0,
            };
          }

          // Third check: perform actual test by calling generate()
          const testResult = await this.testProviderWithTimeout(
            provider,
            PROVIDER_HEALTH_CHECK_TIMEOUT_MS,
          );

          if (testResult.success) {
            return {
              id: providerId,
              available: true,
              reason: undefined,
              message: 'Provider is operational',
              checkedAt: new Date().toISOString(),
              circuitState: cb?.state ?? 'CLOSED' as const,
              failureCount: cb?.failureCount ?? 0,
              responseTimeMs: testResult.responseTimeMs,
            };
          } else {
            return {
              id: providerId,
              available: false,
              reason: 'test_failed' as const,
              message: `Health check test failed: ${testResult.error}`,
              checkedAt: new Date().toISOString(),
              circuitState: cb?.state ?? 'CLOSED' as const,
              failureCount: cb?.failureCount ?? 0,
              responseTimeMs: testResult.responseTimeMs,
            };
          }
        } catch (error: any) {
          logger.error(`Health check test error for provider ${provider.id}: ${error.message}`);
          return {
            id: provider.id,
            available: false,
            reason: 'test_error' as const,
            message: `Test error: ${error.message}`,
            checkedAt: new Date().toISOString(),
            responseTimeMs: Date.now() - startTime,
          };
        }
      });

      const results = await Promise.all(testPromises);

      // Calculate statistics
      const availableCount = results.filter((p) => p.available).length;
      const unavailableCount = results.length - availableCount;
      const availabilityRate = Math.round((availableCount / results.length) * 100);
      const responseTimes = results
        .filter((p) => p.responseTimeMs && p.responseTimeMs > 0)
        .map((p) => p.responseTimeMs!);
      const avgResponseTimeMs = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;

      // Determine overall health status
      let overall: 'healthy' | 'degraded' | 'unhealthy';
      let message: string;

      if (availableCount === results.length) {
        overall = 'healthy';
        message = `All ${results.length} LLM providers are operational`;
      } else if (availableCount > 0) {
        overall = 'degraded';
        message = `${availableCount}/${results.length} LLM providers operational (${unavailableCount} unavailable)`;
      } else {
        overall = 'unhealthy';
        message = 'All LLM providers are currently unavailable';
      }

      const result: LLMHealthCheckResult = {
        timestamp: new Date().toISOString(),
        totalProviders: results.length,
        availableCount,
        unavailableCount,
        providers: results,
        summary: {
          overall,
          availabilityRate,
          message,
          avgResponseTimeMs,
        },
      };

      const elapsedMs = Date.now() - startTime;
      logger.info(`LLM health check completed in ${elapsedMs}ms`, {
        totalProviders: results.length,
        available: availableCount,
        unavailable: unavailableCount,
        status: overall,
        avgResponseTimeMs,
        elapsedMs,
      });

      return result;
    } catch (error: any) {
      logger.error(`LLM health check failed: ${error.message}`, { error });
      throw new Error(`Failed to perform LLM health check: ${error.message}`);
    }
  }

  /**
   * Check if provider has API key configured
   */
  private hasProviderApiKey(providerId: string): boolean {
    return this.llmManager.checkProviderApiKey(providerId);
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
