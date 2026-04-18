import { ActionResult, BotUser, ActionType, ActionTriggerSource, GeneratorStatusSnapshot } from '../types/index.js';
import { ContextGathererService } from './ContextGathererService.js';
import { PromptBuilderService } from './PromptBuilderService.js';
import { ValidationService } from './ValidationService.js';
import { APIExecutorService } from './APIExecutorService.js';
import { LLMProviderManager } from './llm/LLMProviderManager.js';
import { ActionSelectorService } from './ActionSelectorService.js';
import { RateLimiter } from '../tracking/RateLimiter.js';
import { PersonalityService } from './PersonalityService.js';
import { RetryQueue, FailedAction } from '../scheduler/retryQueue.js';
import { ActionHistoryTracker } from '../tracking/ActionHistoryTracker.js';
import { JobLifecycleStore } from '../tracking/JobLifecycleStore.js';
import logger, { logAction } from '../utils/logger.js';

// Per-user per-post cooldown: same bot cannot comment/vote on the same post within this window
const POST_USER_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
// Anti-spam: no bot comment in the same thread within this window
const POST_FRESH_COMMENT_MS = 10 * 60 * 1000; // 10 minutes

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
  private actionHistory: ActionHistoryTracker;
  private jobLifecycle: JobLifecycleStore;

  constructor() {
    this.contextGatherer = new ContextGathererService();
    this.promptBuilder = new PromptBuilderService(this.contextGatherer);
    this.validator = new ValidationService();
    this.apiExecutor = new APIExecutorService();
    this.llmManager = new LLMProviderManager();
    this.rateLimiter = new RateLimiter();
    this.actionHistory = new ActionHistoryTracker();
    this.actionSelector = new ActionSelectorService(this.contextGatherer, this.rateLimiter, this.actionHistory);
    this.personalityService = new PersonalityService(this.llmManager);
    this.retryQueue = new RetryQueue(3);
    this.jobLifecycle = new JobLifecycleStore();

    // Start retry queue processing
    this.retryQueue.startProcessing(async (action: FailedAction) => {
      logger.info(`[retry_queue] Retrying ${action.actionType} for user #${action.userId}`);
      try {
        const result = await this.runOnceForAction(action.actionType, 'retry');
        return result.success;
      } catch {
        return false;
      }
    });
  }

  async runOnce(triggerSource: ActionTriggerSource = 'cron'): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `action-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    this.jobLifecycle.markQueued(actionId, 'post' /* placeholder, updated after select */, triggerSource);

    try {
      // 1. Select action (user + action type) respecting rate limits
      const selected = await this.actionSelector.selectNextAction();
      if (!selected) {
        logAction({ actionId, stage: 'action_select', status: 'skipped', error: 'All users rate-limited' });
        this.jobLifecycle.markFailed(actionId, 'No available action (all users rate-limited or no bot users)');
        return this.finalizeActionResult({
          success: false,
          actionType: 'post',
          userId: 0,
          provider: 'none',
          latencyMs: Date.now() - startTime,
          error: 'No available action (all users rate-limited or no bot users)',
        }, actionId, triggerSource);
      }

      this.jobLifecycle.markRunning(actionId);

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
        this.jobLifecycle.markSuccess(actionId);
      } else {
        if (result.error && !result.error.includes('Validation failed')) {
          // Enqueue for retry (don't retry validation failures)
          this.retryQueue.add(selected.userId, selected.actionType, result.error);
        }
        this.jobLifecycle.markFailed(actionId, result.error ?? 'unknown');
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

      return this.finalizeActionResult(result, actionId, triggerSource);
    } catch (error: any) {
      logAction({ actionId, stage: 'complete', status: 'failed', error: error.message });
      this.jobLifecycle.markFailed(actionId, error.message);
      return this.finalizeActionResult({
        success: false,
        actionType: 'post',
        userId: 0,
        provider: 'unknown',
        latencyMs: Date.now() - startTime,
        error: error.message,
      }, actionId, triggerSource);
    }
  }

  async runOnceForAction(
    actionType: ActionType,
    triggerSource: ActionTriggerSource = 'manual',
    forcedProviderId?: string,
  ): Promise<ActionResult> {
    const startTime = Date.now();
    const actionId = `action-${actionType}-${Date.now()}`;

    try {
      const botUsers = await this.contextGatherer.getAllBotUsers();
      if (botUsers.length === 0) {
        logAction({ actionId, actionType, stage: 'action_select', status: 'failed', error: 'No bot users' });
        return this.finalizeActionResult({
          success: false, actionType, userId: 0, provider: 'none',
          latencyMs: Date.now() - startTime, error: 'No active bot users found',
        }, actionId, triggerSource);
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
        return this.finalizeActionResult({
          success: false, actionType, userId: 0, provider: 'none',
          latencyMs: Date.now() - startTime, error: `All bot users are rate-limited for ${actionType} action`,
        }, actionId, triggerSource);
      }

      logAction({ actionId, userId: selectedUserId, actionType, stage: 'action_select', status: 'success' });

      let result: ActionResult;
      switch (actionType) {
        case 'post':
          result = await this.executePost(selectedUserId, startTime, actionId, forcedProviderId);
          break;
        case 'comment':
          result = await this.executeComment(selectedUserId, startTime, actionId, forcedProviderId);
          break;
        case 'vote':
          result = await this.executeVote(selectedUserId, startTime, actionId, forcedProviderId);
          break;
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }

      if (result.success) {
        this.rateLimiter.record(selectedUserId, actionType);
        await this.personalityService.trackAndUpdate(selectedUserId);
      }

      return this.finalizeActionResult(result, actionId, triggerSource);
    } catch (error: any) {
      logAction({ actionId, actionType, stage: 'complete', status: 'failed', error: error.message });
      return this.finalizeActionResult({
        success: false, actionType, userId: 0, provider: 'unknown',
        latencyMs: Date.now() - startTime, error: error.message,
      }, actionId, triggerSource);
    }
  }

  private async executePost(
    userId: number,
    startTime: number,
    actionId: string,
    forcedProviderId?: string,
  ): Promise<ActionResult> {
    // 1. Gather context
    logAction({ actionId, userId, actionType: 'post', stage: 'context_gather', status: 'info' });
    const context = await this.contextGatherer.gatherPostContext(userId);
    logger.info(`[context_gather] Category: ${context.category.name}, Tags: ${context.availableTags.length}`);

    // 2. Build prompt
    logAction({ actionId, userId, actionType: 'post', stage: 'prompt_build', status: 'info' });
    const prompt = await this.promptBuilder.buildPostPrompt(context);

    // 3. Call LLM (with fallback stack)
    logAction({ actionId, userId, actionType: 'post', stage: 'llm_call', status: 'info' });
    const { output: llmOutput, provider } = forcedProviderId
      ? await this.llmManager.generateWithProvider(prompt, forcedProviderId)
      : await this.llmManager.generateByTask(prompt, 'post');
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

  private async executeComment(
    userId: number,
    startTime: number,
    actionId: string,
    forcedProviderId?: string,
  ): Promise<ActionResult> {
    // 1. Gather context
    logAction({ actionId, userId, actionType: 'comment', stage: 'context_gather', status: 'info' });
    const context = await this.contextGatherer.gatherCommentContext(userId);
    const isReply = !!context.parentComment;
    logger.info(`[context_gather] Target post: "${context.targetPost.title}" (${isReply ? 'reply' : 'top-level'})`);
    logger.info(`[context_aware] status: ${context.postReadContext ? 'full' : 'degraded'}, postId: ${context.targetPost.id}`);

    const postId = context.targetPost.id;

    // 1b. Per-user per-post cooldown check
    if (this.actionHistory.hasRecentActionOnPost(userId, postId, POST_USER_COOLDOWN_MS)) {
      const msg = `Cooldown: user #${userId} already acted on post #${postId} recently`;
      logger.info(`[anti_spam] ${msg}`);
      return {
        success: false, actionType: 'comment', userId, provider: 'none',
        latencyMs: Date.now() - startTime, error: msg, postId,
      };
    }

    // 1c. Anti-spam: skip if any bot commented on this thread too recently
    if (this.actionHistory.hasRecentCommentOnPost(postId, POST_FRESH_COMMENT_MS)) {
      const msg = `Fresh comment exists on post #${postId}, skipping to avoid spam`;
      logger.info(`[anti_spam] ${msg}`);
      return {
        success: false, actionType: 'comment', userId, provider: 'none',
        latencyMs: Date.now() - startTime, error: msg, postId,
      };
    }

    // 1d. Context quality check
    if (!ActionSelectorService.isContextQualityOk(context.postReadContext)) {
      const msg = `Context quality too low for post #${postId} (body too short, no comments, no tags)`;
      logger.info(`[context_quality] ${msg}`);
      return {
        success: false, actionType: 'comment', userId, provider: 'none',
        latencyMs: Date.now() - startTime, error: msg, postId,
      };
    }

    // 2. Build prompt
    logAction({ actionId, userId, actionType: 'comment', stage: 'prompt_build', status: 'info' });
    const prompt = await this.promptBuilder.buildCommentPrompt(context);

    // 3. Call LLM
    logAction({ actionId, userId, actionType: 'comment', stage: 'llm_call', status: 'info' });
    const { output: llmOutput, provider } = forcedProviderId
      ? await this.llmManager.generateWithProvider(prompt, forcedProviderId)
      : await this.llmManager.generateByTask(prompt, 'comment');
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
      quotedCommentId: context.parentComment?.id,
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

    return { success: true, actionType: 'comment', userId, provider, latencyMs, postId };
  }

  private async executeVote(
    userId: number,
    startTime: number,
    actionId: string,
    forcedProviderId?: string,
  ): Promise<ActionResult> {
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
    logger.info(`[context_aware] status: ${context.postReadContext ? 'full' : 'degraded'}, targetType: ${context.targetType}, targetId: ${context.targetId}`);

    // 1b. Per-user per-post cooldown (use postReadContext postId, or derive from targetId when voting on post)
    const votePostId = context.postReadContext?.postId ?? (context.targetType === 'post' ? context.targetId : undefined);
    if (votePostId && this.actionHistory.hasRecentActionOnPost(userId, votePostId, POST_USER_COOLDOWN_MS)) {
      const msg = `Cooldown: user #${userId} already acted on post #${votePostId} recently`;
      logger.info(`[anti_spam] ${msg}`);
      return {
        success: false, actionType: 'vote', userId, provider: 'none',
        latencyMs: Date.now() - startTime, error: msg, postId: votePostId,
      };
    }

    // 2. Decide strategy: random voting rate vs. LLM-based (personality-driven)
    const isRandomVoter = !forcedProviderId && Math.random() < 0.7;
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
      const llmResult = forcedProviderId
        ? await this.llmManager.generateWithProvider(prompt, forcedProviderId)
        : await this.llmManager.generateByTask(prompt, 'vote_llm');
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

    return { success: true, actionType: 'vote', userId, provider, latencyMs, postId: votePostId };
  }

  getRateLimiterStats() {
    return this.rateLimiter.getTodayStats();
  }

  getLLMProviders(): string[] {
    return this.llmManager.getProviderIds();
  }

  getProviderIdByLabel(label: number): string | undefined {
    return this.llmManager.getProviderIdByLabel(label);
  }

  async getStatusSnapshot(): Promise<GeneratorStatusSnapshot> {
    const providerStatus = await this.llmManager.getProviderStatusSnapshot();
    const modelStack = await this.llmManager.getProviderStackSnapshot();
    const available = providerStatus.filter((provider) => provider.available);
    const unavailable = providerStatus.filter((provider) => !provider.available);
    const todayStats = this.actionHistory.getTodayStats();
    const todayRateLimiterStats = this.getRateLimiterStats() as Record<string, unknown>;

    return {
      providers: this.getLLMProviders(),
      modelStack,
      providerStatus: {
        available,
        unavailable,
        all: providerStatus,
      },
      todayStats,
      recentActions: this.actionHistory.getRecentActions(10),
      lastAction: this.actionHistory.getLastAction(),
      todayActions: {
        ...todayRateLimiterStats,
        byTrigger: todayStats.byTrigger,
      },
      queue: this.getRetryQueueStats() as Record<string, unknown>,
      jobLifecycle: this.jobLifecycle.getSnapshot() as Record<string, unknown>,
      contextMetrics: this.contextGatherer.getMetricsSnapshot() as unknown as Record<string, unknown>,
    };
  }

  getRetryQueueStats() {
    const stats = this.retryQueue.getStats();
    const dlq = this.retryQueue.getDeadLetterQueue();
    return { ...stats, dlq: dlq.slice(-10) }; // last 10 DLQ entries in status
  }

  /**
   * Per-provider health: availability snapshot + circuit breaker state.
   * Used by the /health endpoint.
   */
  async getProviderHealthDetails() {
    const [statusSnapshot, cbStats] = await Promise.all([
      this.llmManager.getProviderStatusSnapshot(),
      Promise.resolve(this.llmManager.getCircuitBreakerStats()),
    ]);

    const cbMap = new Map(cbStats.map((c) => [c.id, c]));

    return statusSnapshot.map((p) => {
      const cb = cbMap.get(p.id);
      return {
        id: p.id,
        available: p.available,
        reason: p.reason,
        checkedAt: p.checkedAt,
        cooldownUntil: p.cooldownUntil,
        circuitState: cb?.state ?? 'CLOSED',
        circuitFailures: cb?.failureCount ?? 0,
        circuitOpenSince: cb?.openSince ?? null,
      };
    });
  }

  private finalizeActionResult(result: ActionResult, actionId: string, triggerSource: ActionTriggerSource): ActionResult {
    const finalizedResult: ActionResult = {
      ...result,
      actionId,
      triggerSource,
      completedAt: result.completedAt || new Date().toISOString(),
    };
    this.actionHistory.record(finalizedResult, { actionId, triggerSource });
    return finalizedResult;
  }

  async disconnect(): Promise<void> {
    this.retryQueue.stop();
    await this.contextGatherer.disconnect();
    await this.validator.disconnect();
    await this.personalityService.disconnect();
    logger.info('ContentGeneratorService disconnected');
  }
}
