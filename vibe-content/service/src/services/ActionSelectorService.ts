import { ActionType, BotUser, SelectedAction } from '../types/index.js';
import { ContextGathererService } from './ContextGathererService.js';
import { RateLimiter } from '../tracking/RateLimiter.js';
import logger from '../utils/logger.js';

// Weighted probabilities for action selection
const ACTION_WEIGHTS: { action: ActionType; weight: number }[] = [
  { action: 'post', weight: 40 },
  { action: 'comment', weight: 35 },
  { action: 'vote', weight: 25 },
];

export class ActionSelectorService {
  private contextGatherer: ContextGathererService;
  private rateLimiter: RateLimiter;

  constructor(contextGatherer: ContextGathererService, rateLimiter: RateLimiter) {
    this.contextGatherer = contextGatherer;
    this.rateLimiter = rateLimiter;
  }

  async selectNextAction(): Promise<SelectedAction | null> {
    const botUsers = await this.contextGatherer.getAllBotUsers();
    if (botUsers.length === 0) return null;

    // Shuffle bot users to avoid always picking the same one
    const shuffled = [...botUsers].sort(() => Math.random() - 0.5);

    for (const user of shuffled) {
      const action = this.pickActionForUser(user);
      if (action) return action;
    }

    logger.warn('All bot users are rate-limited for all actions');
    return null;
  }

  private pickActionForUser(user: BotUser): SelectedAction | null {
    // Build list of available actions for this user (not rate-limited)
    const available = ACTION_WEIGHTS.filter((aw) =>
      this.rateLimiter.canPerform(user.id, aw.action),
    );

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
