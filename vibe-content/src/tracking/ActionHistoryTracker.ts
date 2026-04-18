import {
  ActionType,
  ActionLevelHistoryItem,
  ActionResult,
  ActionStatsSnapshot,
  ActionTriggerSource,
} from '../types/index.js';

const MAX_HISTORY = 200;

function getStartOfToday(now: Date): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export class ActionHistoryTracker {
  private history: ActionLevelHistoryItem[] = [];

  record(result: ActionResult, fallback: { actionId: string; triggerSource: ActionTriggerSource }): ActionLevelHistoryItem {
    const completedAt = result.completedAt || new Date().toISOString();
    const action: ActionLevelHistoryItem = {
      actionId: result.actionId || fallback.actionId,
      actionType: result.actionType,
      userId: result.userId,
      provider: result.provider,
      success: result.success,
      latencyMs: result.latencyMs,
      error: result.error,
      triggerSource: result.triggerSource || fallback.triggerSource,
      completedAt,
      postId: result.postId,
    };

    this.history.push(action);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(this.history.length - MAX_HISTORY);
    }
    return action;
  }

  getRecentActions(limit = 10): ActionLevelHistoryItem[] {
    if (limit <= 0) return [];
    return this.history.slice(-limit).reverse();
  }

  getLastAction(): ActionLevelHistoryItem | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  getLastActionByType(actionType: ActionType): ActionLevelHistoryItem | null {
    for (let i = this.history.length - 1; i >= 0; i--) {
      const action = this.history[i];
      if (action.actionType === actionType) {
        return action;
      }
    }
    return null;
  }

  /**
   * Returns true if `userId` performed any action on `postId` within `windowMs` ms.
   * Used to enforce per-user per-post cooldown.
   */
  hasRecentActionOnPost(userId: number, postId: number, windowMs: number): boolean {
    const since = Date.now() - windowMs;
    for (let i = this.history.length - 1; i >= 0; i--) {
      const action = this.history[i];
      if (action.postId === postId && action.userId === userId && action.success) {
        if (new Date(action.completedAt).getTime() >= since) return true;
      }
    }
    return false;
  }

  /**
   * Returns true if ANY bot performed a successful comment on `postId`
   * within `windowMs` ms. Used to prevent back-to-back bot comments in the same thread.
   */
  hasRecentCommentOnPost(postId: number, windowMs: number): boolean {
    const since = Date.now() - windowMs;
    for (let i = this.history.length - 1; i >= 0; i--) {
      const action = this.history[i];
      if (
        action.postId === postId &&
        action.actionType === 'comment' &&
        action.success &&
        new Date(action.completedAt).getTime() >= since
      ) {
        return true;
      }
    }
    return false;
  }

  getTodayStats(now = new Date()): ActionStatsSnapshot {
    const startOfToday = getStartOfToday(now);
    const today = this.history.filter((item) => new Date(item.completedAt).getTime() >= startOfToday);
    const totalActions = today.length;
    const successCount = today.filter((item) => item.success).length;
    const failedCount = totalActions - successCount;
    const byTrigger: Record<ActionTriggerSource, number> = {
      cron: 0,
      manual: 0,
      retry: 0,
    };
    const byAction = {
      post: 0,
      comment: 0,
      vote: 0,
    };
    const byActionTrigger = {
      post: { cron: 0, manual: 0, retry: 0 },
      comment: { cron: 0, manual: 0, retry: 0 },
      vote: { cron: 0, manual: 0, retry: 0 },
    };

    for (const action of today) {
      byTrigger[action.triggerSource] += 1;
      byAction[action.actionType] += 1;
      byActionTrigger[action.actionType][action.triggerSource] += 1;
    }

    return {
      totalActions,
      successCount,
      failedCount,
      successRate: totalActions > 0 ? `${Math.round((successCount / totalActions) * 100)}%` : 'N/A',
      byTrigger,
      byAction,
      byActionTrigger,
    };
  }
}
