import { ActionType, BotUser, SelectedAction } from '../types/index.js';
import { ContextGathererService } from './ContextGathererService.js';
import { RateLimiter } from '../tracking/RateLimiter.js';
import { ActionHistoryTracker } from '../tracking/ActionHistoryTracker.js';
import logger from '../utils/logger.js';

// Weighted probabilities for action selection
const ACTION_WEIGHTS: { action: ActionType; weight: number }[] = [
  { action: 'post', weight: 15 },
  { action: 'comment', weight: 30 },
  { action: 'vote', weight: 55 },
];

export class ActionSelectorService {
  private contextGatherer: ContextGathererService;
  private rateLimiter: RateLimiter;
  private actionHistory: ActionHistoryTracker;

  constructor(
    contextGatherer: ContextGathererService,
    rateLimiter: RateLimiter,
    actionHistory: ActionHistoryTracker,
  ) {
    this.contextGatherer = contextGatherer;
    this.rateLimiter = rateLimiter;
    this.actionHistory = actionHistory;
  }

  async selectNextAction(): Promise<SelectedAction | null> {
    const botUsers = await this.contextGatherer.getAllBotUsers();
    if (botUsers.length === 0) return null;

    // Shuffle bot users to avoid always picking the same one
    const shuffled = [...botUsers].sort(() => Math.random() - 0.5);

    // Pass 1: avoid same bot for nearby same action type
    for (const user of shuffled) {
      const action = this.pickActionForUser(user, true);
      if (action) return action;
    }

    // Pass 2: fallback to normal policy to avoid starvation
    for (const user of shuffled) {
      const action = this.pickActionForUser(user, false);
      if (action) return action;
    }

    logger.warn('All bot users are rate-limited for all actions');
    return null;
  }

  private pickActionForUser(user: BotUser, avoidRecentSameUser: boolean): SelectedAction | null {
    // Build list of available actions for this user (not rate-limited)
    const available = ACTION_WEIGHTS.filter((aw) => {
      if (!this.rateLimiter.canPerform(user.id, aw.action)) {
        return false;
      }

      if (!avoidRecentSameUser) {
        return true;
      }

      const lastSameTypeAction = this.actionHistory.getLastActionByType(aw.action);
      return !(lastSameTypeAction && lastSameTypeAction.userId === user.id);
    });

    if (available.length === 0) return null;

    // Weighted random selection from available actions
    const totalWeight = available.reduce((sum, aw) => sum + aw.weight, 0);
    let roll = Math.random() * totalWeight;
    let selected: ActionType = available[0].action;

    for (const aw of available) {
      roll -= aw.weight;
      if (roll <= 0) {
        selected = aw.action;
        break;
      }
    }

    return { userId: user.id, actionType: selected };
  }
}
