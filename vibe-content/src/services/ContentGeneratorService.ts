import { ActionResult, BotUser, ActionType } from '../types/index.js';
import { ContextGathererService } from './ContextGathererService.js';
import { PromptBuilderService } from './PromptBuilderService.js';
import { ValidationService } from './ValidationService.js';
import { APIExecutorService } from './APIExecutorService.js';
import { LLMProviderManager } from './llm/LLMProviderManager.js';
import { ActionSelectorService } from './ActionSelectorService.js';
import { RateLimiter } from '../tracking/RateLimiter.js';
import { PersonalityService } from './PersonalityService.js';
import { RetryQueue, FailedAction } from '../scheduler/retryQueue.js';
import logger, { logAction } from '../utils/logger.js';

export class ContentGeneratorService {
  private contextGatherer: ContextGathererService;
  private promptBuilder: PromptBuilderService;
  private validator: ValidationService;
  private apiExecutor: APIExecutorService;
  private llmManager: LLMProviderManager;
  private actionSelector: ActionSelectorService;
  private rateLimiter: RateLimiter;
  private personalityService: PersonalityService;
  private retryQueue: RetryQueue;

  constructor() {
    this.contextGatherer = new ContextGathererService();
    this.promptBuilder = new PromptBuilderService(this.contextGatherer);
    this.validator = new ValidationService();
    this.apiExecutor = new APIExecutorService();
    this.llmManager = new LLMProviderManager();
    this.rateLimiter = new RateLimiter();
    this.actionSelector = new ActionSelectorService(this.contextGatherer, this.rateLimiter);
    this.personalityService = new PersonalityService(this.llmManager);
    this.retryQueue = new RetryQueue(3);

    // Start retry queue processing
    this.retryQueue.startProcessing(async (action: FailedAction) => {
      logger.info(`[retry_queue] Retrying ${action.actionType} for user #${action.userId}`);
      try {
        const result = await this.runOnceForAction(action.actionType);
        return result.success;
      } catch {
        return false;
      }
    });
  }

  async runOnce(): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `action-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    try {
      // 1. Select action (user + action type) respecting rate limits
      const selected = await this.actionSelector.selectNextAction();
      if (!selected) {
        logAction({ actionId, stage: 'action_select', status: 'skipped', error: 'All users rate-limited' });
        return {
          success: false,
          actionType: 'post',
          userId: 0,
          provider: 'none',
          latencyMs: Date.now() - startTime,
          error: 'No available action (all users rate-limited or no bot users)',
        };
      }

      logAction({
        actionId,
        userId: selected.userId,
        actionType: selected.actionType,
        stage: 'action_select',
        status: 'success',
      });

      // 2. Dispatch to action handler
      let result: ActionResult;
      switch (selected.actionType) {
        case 'post':
          result = await this.executePost(selected.userId, startTime, actionId);
          break;
        case 'comment':
          result = await this.executeComment(selected.userId, startTime, actionId);
          break;
        case 'vote':
          result = await this.executeVote(selected.userId, startTime, actionId);
          break;
        default:
          throw new Error(`Unknown action type: ${selected.actionType}`);
      }

      // 3. Record in rate limiter on success
      if (result.success) {
        this.rateLimiter.record(selected.userId, selected.actionType);
        // Phase 3.1: Track personality updates
        await this.personalityService.trackAndUpdate(selected.userId);
      } else if (result.error && !result.error.includes('Validation failed')) {
        // Enqueue for retry (don't retry validation failures)
        this.retryQueue.add(selected.userId, selected.actionType, result.error);
      }

      logAction({
        actionId,
        userId: result.userId,
        actionType: result.actionType,
        stage: 'complete',
        status: result.success ? 'success' : 'failed',
        provider: result.provider,
        latencyMs: result.latencyMs,
        error: result.error,
      });

      return result;
    } catch (error: any) {
      logAction({ actionId, stage: 'complete', status: 'failed', error: error.message });
      return {
        success: false,
        actionType: 'post',
        userId: 0,
        provider: 'unknown',
        latencyMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async runOnceForAction(actionType: ActionType): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `action-${actionType}-${Date.now()}`;

    try {
      const botUsers = await this.contextGatherer.getAllBotUsers();
      if (botUsers.length === 0) {
        logAction({ actionId, actionType, stage: 'action_select', status: 'failed', error: 'No bot users' });
        return {
          success: false, actionType, userId: 0, provider: 'none',
          latencyMs: Date.now() - startTime, error: 'No active bot users found',
        };
      }

      let selectedUserId: number | null = null;
      for (const user of botUsers) {
        if (this.rateLimiter.canPerform(user.id, actionType)) {
          selectedUserId = user.id;
          break;
        }
      }

      if (!selectedUserId) {
        logAction({ actionId, actionType, stage: 'action_select', status: 'skipped', error: 'All rate-limited' });
        return {
          success: false, actionType, userId: 0, provider: 'none',
          latencyMs: Date.now() - startTime, error: `All bot users are rate-limited for ${actionType} action`,
        };
      }

      logAction({ actionId, userId: selectedUserId, actionType, stage: 'action_select', status: 'success' });

      let result: ActionResult;
      switch (actionType) {
        case 'post':
          result = await this.executePost(selectedUserId, startTime, actionId);
          break;
        case 'comment':
          result = await this.executeComment(selectedUserId, startTime, actionId);
          break;
        case 'vote':
          result = await this.executeVote(selectedUserId, startTime, actionId);
          break;
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }

      if (result.success) {
        this.rateLimiter.record(selectedUserId, actionType);
        await this.personalityService.trackAndUpdate(selectedUserId);
      }

      return result;
    } catch (error: any) {
      logAction({ actionId, actionType, stage: 'complete', status: 'failed', error: error.message });
      return {
        success: false, actionType, userId: 0, provider: 'unknown',
        latencyMs: Date.now() - startTime, error: error.message,
      };
    }
  }

  private async executePost(userId: number, startTime: number, actionId: string): Promise<ActionResult> {
    // 1. Gather context
    logAction({ actionId, userId, actionType: 'post', stage: 'context_gather', status: 'info' });
    const context = await this.contextGatherer.gatherPostContext(userId);
    logger.info(`[context_gather] Category: ${context.category.name}, Tags: ${context.availableTags.length}`);

    // 2. Build prompt
    logAction({ actionId, userId, actionType: 'post', stage: 'prompt_build', status: 'info' });
    const prompt = await this.promptBuilder.buildPostPrompt(context);

    // 3. Call LLM (with fallback stack)
    logAction({ actionId, userId, actionType: 'post', stage: 'llm_call', status: 'info' });
    const { output: llmOutput, provider } = await this.llmManager.generate(prompt);
    logger.info(`[llm_call] Response via ${provider} — title: "${llmOutput.title}"`);

    // 4. Validate
    logAction({ actionId, userId, actionType: 'post', stage: 'validation', status: 'info', provider });
    const validation = await this.validator.validatePostOutput({
      title: llmOutput.title || '',
      content: llmOutput.content || '',
      tags: llmOutput.tags || [],
      explain: llmOutput.explain,
    });

    if (!validation.valid) {
      const errMsg = `Validation failed: ${validation.errors.join('; ')}`;
      logAction({ actionId, userId, actionType: 'post', stage: 'validation', status: 'failed', provider, error: errMsg });
      return {
        success: false, actionType: 'post', userId, provider,
        latencyMs: Date.now() - startTime, error: errMsg,
      };
    }

    // 4b. Phase 3.3: Quality scoring
    const quality = await this.validator.scorePostQuality(
      validation.data!.title,
      validation.data!.content,
      validation.data!.tags,
      userId,
    );
    if (!quality.overallPass) {
      const errMsg = `Quality check failed: ${quality.details.join('; ')}`;
      logAction({ actionId, userId, actionType: 'post', stage: 'quality_check', status: 'failed', provider, error: errMsg });
      return {
        success: false, actionType: 'post', userId, provider,
        latencyMs: Date.now() - startTime, error: errMsg,
      };
    }

    // 5. Call Forum API
    logAction({ actionId, userId, actionType: 'post', stage: 'api_call', status: 'info', provider });
    const user = (await this.contextGatherer.getAllBotUsers()).find((u) => u.id === userId);
    if (!user) throw new Error(`Bot user #${userId} not found`);

    const apiResult = await this.apiExecutor.createPost(user.id, user.email, {
      title: validation.data!.title,
      content: validation.data!.content,
      categoryId: context.category.id,
      tags: validation.data!.tags,
    });

    if (!apiResult.success) {
      logAction({ actionId, userId, actionType: 'post', stage: 'api_call', status: 'failed', provider, error: apiResult.error });
      return {
        success: false, actionType: 'post', userId, provider,
        latencyMs: Date.now() - startTime, error: apiResult.error,
      };
    }

    const latencyMs = Date.now() - startTime;
    logAction({
      actionId, userId, actionType: 'post', stage: 'api_call', status: 'success',
      provider, latencyMs,
      details: { postId: apiResult.postId, title: validation.data!.title, tags: validation.data!.tags },
    });

    return { success: true, actionType: 'post', userId, provider, latencyMs };
  }

  private async executeComment(userId: number, startTime: number, actionId: string): Promise<ActionResult> {
    // 1. Gather context
    logAction({ actionId, userId, actionType: 'comment', stage: 'context_gather', status: 'info' });
    const context = await this.contextGatherer.gatherCommentContext(userId);
    const isReply = !!context.parentComment;
    logger.info(`[context_gather] Target post: "${context.targetPost.title}" (${isReply ? 'reply' : 'top-level'})`);

    // 2. Build prompt
    logAction({ actionId, userId, actionType: 'comment', stage: 'prompt_build', status: 'info' });
    const prompt = await this.promptBuilder.buildCommentPrompt(context);

    // 3. Call LLM
    logAction({ actionId, userId, actionType: 'comment', stage: 'llm_call', status: 'info' });
    const { output: llmOutput, provider } = await this.llmManager.generate(prompt);
    logger.info(`[llm_call] Comment response via ${provider}`);

    // 4. Validate
    logAction({ actionId, userId, actionType: 'comment', stage: 'validation', status: 'info', provider });
    const validation = this.validator.validateCommentOutput({
      content: llmOutput.content || '',
      explain: llmOutput.explain,
    });

    if (!validation.valid) {
      const errMsg = `Validation failed: ${validation.errors.join('; ')}`;
      logAction({ actionId, userId, actionType: 'comment', stage: 'validation', status: 'failed', provider, error: errMsg });
      return {
        success: false, actionType: 'comment', userId, provider,
        latencyMs: Date.now() - startTime, error: errMsg,
      };
    }

    // 4b. Phase 3.3: Quality scoring for comment
    const quality = this.validator.scoreCommentQuality(validation.data!.content);
    if (!quality.overallPass) {
      const errMsg = `Quality check failed: ${quality.details.join('; ')}`;
      logAction({ actionId, userId, actionType: 'comment', stage: 'quality_check', status: 'failed', provider, error: errMsg });
      return {
        success: false, actionType: 'comment', userId, provider,
        latencyMs: Date.now() - startTime, error: errMsg,
      };
    }

    // 5. Call Forum API
    logAction({ actionId, userId, actionType: 'comment', stage: 'api_call', status: 'info', provider });
    const user = (await this.contextGatherer.getAllBotUsers()).find((u) => u.id === userId);
    if (!user) throw new Error(`Bot user #${userId} not found`);

    const apiResult = await this.apiExecutor.createComment(user.id, user.email, {
      postId: context.targetPost.id,
      content: validation.data!.content,
      parentId: context.parentComment?.id,
    });

    if (!apiResult.success) {
      logAction({ actionId, userId, actionType: 'comment', stage: 'api_call', status: 'failed', provider, error: apiResult.error });
      return {
        success: false, actionType: 'comment', userId, provider,
        latencyMs: Date.now() - startTime, error: apiResult.error,
      };
    }

    const latencyMs = Date.now() - startTime;
    logAction({
      actionId, userId, actionType: 'comment', stage: 'api_call', status: 'success',
      provider, latencyMs,
      details: { commentId: apiResult.commentId, isReply, contentPreview: validation.data!.content.substring(0, 80) },
    });

    return { success: true, actionType: 'comment', userId, provider, latencyMs };
  }

  private async executeVote(userId: number, startTime: number, actionId: string): Promise<ActionResult> {
    // 1. Gather context
    logAction({ actionId, userId, actionType: 'vote', stage: 'context_gather', status: 'info' });
    const context = await this.contextGatherer.gatherVoteContext(userId);
    if (!context) {
      logAction({ actionId, userId, actionType: 'vote', stage: 'context_gather', status: 'skipped', error: 'No unvoted content' });
      return {
        success: false, actionType: 'vote', userId, provider: 'none',
        latencyMs: Date.now() - startTime, error: 'No unvoted content available',
      };
    }
    logger.info(`[context_gather] Target: ${context.targetType} #${context.targetId} — "${context.targetTitle}"`);

    // 2. Decide strategy: random voting rate vs. LLM-based (personality-driven)
    const isRandomVoter = Math.random() < 0.7; // 70% of votes are random to add variability and prevent overfitting to LLM patterns
    let voteType: 'up' | 'down';
    let reason: string;
    let provider: string;

    if (isRandomVoter) {
      logger.info('[vote_strategy] Random voter (like dạo)');
      voteType = Math.random() < 0.87 ? 'up' : 'down';
      reason = 'random_voter';
      provider = 'none';
    } else {
      logger.info('[vote_strategy] LLM-based (personality)');

      logAction({ actionId, userId, actionType: 'vote', stage: 'llm_call', status: 'info' });
      const prompt = this.promptBuilder.buildVotePrompt(context);
      const llmResult = await this.llmManager.generate(prompt);
      provider = llmResult.provider;

      logAction({ actionId, userId, actionType: 'vote', stage: 'validation', status: 'info', provider });
      const validation = this.validator.validateVoteOutput({
        shouldVote: llmResult.output.shouldVote ?? false,
        voteType: llmResult.output.voteType,
        reason: llmResult.output.reason,
      });

      if (!validation.valid) {
        const errMsg = `Validation failed: ${validation.errors.join('; ')}`;
        logAction({ actionId, userId, actionType: 'vote', stage: 'validation', status: 'failed', provider, error: errMsg });
        return {
          success: false, actionType: 'vote', userId, provider,
          latencyMs: Date.now() - startTime, error: errMsg,
        };
      }

      if (!validation.data!.shouldVote) {
        const latencyMs = Date.now() - startTime;
        logAction({
          actionId, userId, actionType: 'vote', stage: 'llm_call', status: 'skipped',
          provider, latencyMs, details: { reason: validation.data!.reason },
        });
        return { success: true, actionType: 'vote', userId, provider, latencyMs };
      }

      voteType = validation.data!.voteType!;
      reason = validation.data!.reason ?? '';
    }

    // 3. Cast vote via API
    logAction({ actionId, userId, actionType: 'vote', stage: 'api_call', status: 'info', provider });
    const user = (await this.contextGatherer.getAllBotUsers()).find((u) => u.id === userId);
    if (!user) throw new Error(`Bot user #${userId} not found`);

    const apiResult = await this.apiExecutor.castVote(user.id, user.email, {
      targetType: context.targetType,
      targetId: context.targetId,
      voteType,
    });

    if (!apiResult.success) {
      logAction({ actionId, userId, actionType: 'vote', stage: 'api_call', status: 'failed', provider, error: apiResult.error });
      return {
        success: false, actionType: 'vote', userId, provider,
        latencyMs: Date.now() - startTime, error: apiResult.error,
      };
    }

    const latencyMs = Date.now() - startTime;
    const strategyLabel = isRandomVoter ? 'random' : 'personality_based';
    logAction({
      actionId, userId, actionType: 'vote', stage: 'api_call', status: 'success',
      provider, latencyMs,
      details: { voteType, strategy: strategyLabel, reason, targetType: context.targetType, targetId: context.targetId },
    });

    return { success: true, actionType: 'vote', userId, provider, latencyMs };
  }

  getRateLimiterStats() {
    return this.rateLimiter.getTodayStats();
  }

  getLLMProviders(): string[] {
    return this.llmManager.getProviderIds();
  }

  getRetryQueueStats() {
    return this.retryQueue.getStats();
  }

  async disconnect(): Promise<void> {
    this.retryQueue.stop();
    await this.contextGatherer.disconnect();
    await this.validator.disconnect();
    await this.personalityService.disconnect();
    logger.info('ContentGeneratorService disconnected');
  }
}
