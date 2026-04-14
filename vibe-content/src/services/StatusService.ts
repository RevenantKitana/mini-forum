import config from '../config/index.js';
import { ContentGeneratorService } from './ContentGeneratorService.js';

export class StatusService {
  constructor(
    private generator: ContentGeneratorService,
    private startedAt: Date,
  ) {}

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

    return {
      status: 'ok',
      uptime: `${hours}h ${minutes}m`,
      startedAt: this.startedAt.toISOString(),
      env: config.nodeEnv,
      forumApi: config.forumApiUrl,
      cronSchedule: config.cron.schedule,
      providers: snapshot.providers,
      modelStack: snapshot.modelStack,
      providerStatus: snapshot.providerStatus,
      todayStats: snapshot.todayStats,
      todayActions: snapshot.todayActions,
      queue: snapshot.queue,
      recentActions,
      lastAction: lastAction
        ? {
            type: lastAction.actionType,
            userId: lastAction.userId,
            provider: lastAction.provider,
            model: lastAction.provider,
            success: lastAction.success,
            latencyMs: lastAction.latencyMs,
            at: lastAction.completedAt,
            error: lastAction.error,
            triggerSource: lastAction.triggerSource,
          }
        : null,
    };
  }
}
