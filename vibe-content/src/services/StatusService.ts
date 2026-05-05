import config from '../config/index.js';
import { ContentGeneratorService } from './ContentGeneratorService.js';

export class StatusService {
  constructor(
    private generator: ContentGeneratorService,
    private startedAt: Date,
  ) {}

  /**
   * Get provider health details for status endpoint
   */
  async getProviderHealthDetails() {
    return await this.generator.getProviderHealthDetails();
  }

  async getStatusPayload() {
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const snapshot = await this.generator.getStatusSnapshot();
    const lastAction = snapshot.lastAction;
    const recentActions = snapshot.recentActions.map((action) => ({
      ...action,
      model: action.provider,
    }));

    // Aggregate provider stack by type
    const providerSummary: Record<string, { available: number; total: number }> = {};
    for (const item of snapshot.modelStack) {
      const type = item.providerType || 'unknown';
      if (!providerSummary[type]) {
        providerSummary[type] = { available: 0, total: 0 };
      }
      providerSummary[type].total++;
      if (item.available) providerSummary[type].available++;
    }

    // Get detailed provider health information
    const providerHealthDetails = await this.getProviderHealthDetails();

    return {
      status: 'ok',
      uptime: `${hours}h ${minutes}m`,
      startedAt: this.startedAt.toISOString(),
      env: config.nodeEnv,
      forumApi: config.forumApiUrl,
      cronSchedule: config.cron.schedule,
      providerHealth: {
        available: snapshot.providerStatus.available.length,
        unavailable: snapshot.providerStatus.unavailable.length,
        byType: providerSummary,
        details: providerHealthDetails,
      },
      stats: {
        today: snapshot.todayStats,
        queue: {
          pending: snapshot.queue.pending,
          retrying: snapshot.queue.retrying,
          dlqSize: snapshot.queue.dlqSize,
        },
        context: snapshot.contextMetrics,
      },
      lastAction: lastAction
        ? {
            type: lastAction.actionType,
            userId: lastAction.userId,
            provider: lastAction.provider,
            success: lastAction.success,
            latencyMs: lastAction.latencyMs,
            at: lastAction.completedAt,
            error: lastAction.error,
          }
        : null,
    };
  }
}
