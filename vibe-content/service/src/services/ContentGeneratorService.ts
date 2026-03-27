import { ActionResult, BotUser, ActionType } from '../types/index.js';
import { ContextGathererService } from './ContextGathererService.js';
import { PromptBuilderService } from './PromptBuilderService.js';
import { ValidationService } from './ValidationService.js';
import { APIExecutorService } from './APIExecutorService.js';
import { LLMProviderManager } from './llm/LLMProviderManager.js';
import { ActionSelectorService } from './ActionSelectorService.js';
import { RateLimiter } from '../tracking/RateLimiter.js';

export class ContentGeneratorService {
  private contextGatherer: ContextGathererService;
  private promptBuilder: PromptBuilderService;
  private validator: ValidationService;
  private apiExecutor: APIExecutorService;
  private llmManager: LLMProviderManager;
  private actionSelector: ActionSelectorService;
  private rateLimiter: RateLimiter;

  constructor() {
    this.contextGatherer = new ContextGathererService();
    this.promptBuilder = new PromptBuilderService(this.contextGatherer);
    this.validator = new ValidationService();
    this.apiExecutor = new APIExecutorService();
    this.llmManager = new LLMProviderManager();
    this.rateLimiter = new RateLimiter();
    this.actionSelector = new ActionSelectorService(this.contextGatherer, this.rateLimiter);
  }

  async runOnce(): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // 1. Select action (user + action type) respecting rate limits
      const selected = await this.actionSelector.selectNextAction();
      if (!selected) {
        return {
          success: false,
          actionType: 'post',
          userId: 0,
          provider: 'none',
          latencyMs: Date.now() - startTime,
          error: 'No available action (all users rate-limited or no bot users)',
        };
      }

      console.log(`\n🎯 Selected action: ${selected.actionType} for user #${selected.userId}`);

      // 2. Dispatch to action handler
      let result: ActionResult;
      switch (selected.actionType) {
        case 'post':
          result = await this.executePost(selected.userId, startTime);
          break;
        case 'comment':
          result = await this.executeComment(selected.userId, startTime);
          break;
        case 'vote':
          result = await this.executeVote(selected.userId, startTime);
          break;
        default:
          throw new Error(`Unknown action type: ${selected.actionType}`);
      }

      // 3. Record in rate limiter on success
      if (result.success) {
        this.rateLimiter.record(selected.userId, selected.actionType);
      }

      return result;
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
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

    try {
      // Get list of active bot users
      const botUsers = await this.contextGatherer.getAllBotUsers();
      if (botUsers.length === 0) {
        return {
          success: false,
          actionType,
          userId: 0,
          provider: 'none',
          latencyMs: Date.now() - startTime,
          error: 'No active bot users found',
        };
      }

      // Check rate limits and find first available user
      let selectedUserId: number | null = null;
      for (const user of botUsers) {
        if (this.rateLimiter.canPerform(user.id, actionType)) {
          selectedUserId = user.id;
          break;
        }
      }

      if (!selectedUserId) {
        return {
          success: false,
          actionType,
          userId: 0,
          provider: 'none',
          latencyMs: Date.now() - startTime,
          error: `All bot users are rate-limited for ${actionType} action`,
        };
      }

      console.log(`\n🎯 Selected action: ${actionType} for user #${selectedUserId}`);

      // Execute the specific action
      let result: ActionResult;
      switch (actionType) {
        case 'post':
          result = await this.executePost(selectedUserId, startTime);
          break;
        case 'comment':
          result = await this.executeComment(selectedUserId, startTime);
          break;
        case 'vote':
          result = await this.executeVote(selectedUserId, startTime);
          break;
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }

      // Record in rate limiter on success
      if (result.success) {
        this.rateLimiter.record(selectedUserId, actionType);
      }

      return result;
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      return {
        success: false,
        actionType,
        userId: 0,
        provider: 'unknown',
        latencyMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async executePost(userId: number, startTime: number): Promise<ActionResult> {
    // 1. Gather context
    console.log('   📦 Gathering post context...');
    const context = await this.contextGatherer.gatherPostContext(userId);
    console.log(`   📂 Category: ${context.category.name}`);
    console.log(`   🏷️  Tags pool: ${context.availableTags.length} available`);

    // 2. Build prompt
    console.log('   🔨 Building prompt...');
    const prompt = await this.promptBuilder.buildPostPrompt(context);

    // 3. Call LLM (with fallback stack)
    console.log('   🤖 Calling LLM stack...');
    const { output: llmOutput, provider } = await this.llmManager.generate(prompt);
    console.log(`   ✅ LLM response — title: "${llmOutput.title}" (via ${provider})`);

    // 4. Validate
    console.log('   🔍 Validating output...');
    const validation = await this.validator.validatePostOutput({
      title: llmOutput.title || '',
      content: llmOutput.content || '',
      tags: llmOutput.tags || [],
      explain: llmOutput.explain,
    });

    if (!validation.valid) {
      const errMsg = `Validation failed: ${validation.errors.join('; ')}`;
      console.log(`   ❌ ${errMsg}`);
      return {
        success: false, actionType: 'post', userId, provider,
        latencyMs: Date.now() - startTime, error: errMsg,
      };
    }

    // 5. Call Forum API
    console.log('   📤 Creating post via API...');
    const user = (await this.contextGatherer.getAllBotUsers()).find((u) => u.id === userId);
    if (!user) throw new Error(`Bot user #${userId} not found`);

    const apiResult = await this.apiExecutor.createPost(user.id, user.email, {
      title: validation.data!.title,
      content: validation.data!.content,
      categoryId: context.category.id,
      tags: validation.data!.tags,
    });

    if (!apiResult.success) {
      console.log(`   ❌ API error: ${apiResult.error}`);
      return {
        success: false, actionType: 'post', userId, provider,
        latencyMs: Date.now() - startTime, error: apiResult.error,
      };
    }

    const latencyMs = Date.now() - startTime;
    console.log(`   🎉 Post created! ID: ${apiResult.postId} (${latencyMs}ms)`);
    console.log(`   📌 Title: "${validation.data!.title}"`);
    console.log(`   🏷️  Tags: [${validation.data!.tags.join(', ')}]`);

    return { success: true, actionType: 'post', userId, provider, latencyMs };
  }

  private async executeComment(userId: number, startTime: number): Promise<ActionResult> {
    // 1. Gather context
    console.log('   📦 Gathering comment context...');
    const context = await this.contextGatherer.gatherCommentContext(userId);
    const isReply = !!context.parentComment;
    console.log(`   📝 Target post: "${context.targetPost.title}" (${isReply ? 'reply' : 'top-level'})`);

    // 2. Build prompt
    console.log('   🔨 Building comment prompt...');
    const prompt = await this.promptBuilder.buildCommentPrompt(context);

    // 3. Call LLM
    console.log('   🤖 Calling LLM stack...');
    const { output: llmOutput, provider } = await this.llmManager.generate(prompt);
    console.log(`   ✅ LLM response (via ${provider})`);

    // 4. Validate
    console.log('   🔍 Validating comment...');
    const validation = this.validator.validateCommentOutput({
      content: llmOutput.content || '',
      explain: llmOutput.explain,
    });

    if (!validation.valid) {
      const errMsg = `Validation failed: ${validation.errors.join('; ')}`;
      console.log(`   ❌ ${errMsg}`);
      return {
        success: false, actionType: 'comment', userId, provider,
        latencyMs: Date.now() - startTime, error: errMsg,
      };
    }

    // 5. Call Forum API
    console.log('   📤 Creating comment via API...');
    const user = (await this.contextGatherer.getAllBotUsers()).find((u) => u.id === userId);
    if (!user) throw new Error(`Bot user #${userId} not found`);

    const apiResult = await this.apiExecutor.createComment(user.id, user.email, {
      postId: context.targetPost.id,
      content: validation.data!.content,
      parentId: context.parentComment?.id,
    });

    if (!apiResult.success) {
      console.log(`   ❌ API error: ${apiResult.error}`);
      return {
        success: false, actionType: 'comment', userId, provider,
        latencyMs: Date.now() - startTime, error: apiResult.error,
      };
    }

    const latencyMs = Date.now() - startTime;
    console.log(`   🎉 Comment created! ID: ${apiResult.commentId} (${latencyMs}ms)`);
    console.log(`   💬 "${validation.data!.content.substring(0, 80)}..."`);

    return { success: true, actionType: 'comment', userId, provider, latencyMs };
  }

  private async executeVote(userId: number, startTime: number): Promise<ActionResult> {
    // 1. Gather context
    console.log('   📦 Gathering vote context...');
    const context = await this.contextGatherer.gatherVoteContext(userId);
    if (!context) {
      console.log('   ⏭️  No unvoted content found, skipping');
      return {
        success: false, actionType: 'vote', userId, provider: 'none',
        latencyMs: Date.now() - startTime, error: 'No unvoted content available',
      };
    }
    console.log(`   🗳️  Target: ${context.targetType} #${context.targetId} — "${context.targetTitle}"`);

    // 2. Decide strategy: random voting rate vs. LLM-based (personality-driven)
    const isRandomVoter = Math.random() < 0.3;
    let voteType: 'up' | 'down';
    let reason: string;
    let provider: string;

    if (isRandomVoter) {
      // --- Random Voting ("like dạo") --- 77% upvote, 23% downvote
      console.log('   🎲 Strategy: random voter (like dạo)');
      voteType = Math.random() < 0.77 ? 'up' : 'down';
      reason = 'random_voter';
      provider = 'none';
    } else {
      // --- LLM-Based Voting (personality-based) ---
      console.log('   🧠 Strategy: LLM-based (personality)');

      // Build prompt
      console.log('   🔨 Building vote prompt...');
      const prompt = this.promptBuilder.buildVotePrompt(context);

      // Call LLM
      console.log('   🤖 Calling LLM stack...');
      const llmResult = await this.llmManager.generate(prompt);
      provider = llmResult.provider;
      console.log(`   ✅ LLM response (via ${provider})`);

      // Validate
      console.log('   🔍 Validating vote decision...');
      const validation = this.validator.validateVoteOutput({
        shouldVote: llmResult.output.shouldVote ?? false,
        voteType: llmResult.output.voteType,
        reason: llmResult.output.reason,
      });

      if (!validation.valid) {
        const errMsg = `Validation failed: ${validation.errors.join('; ')}`;
        console.log(`   ❌ ${errMsg}`);
        return {
          success: false, actionType: 'vote', userId, provider,
          latencyMs: Date.now() - startTime, error: errMsg,
        };
      }

      if (!validation.data!.shouldVote) {
        const latencyMs = Date.now() - startTime;
        console.log(`   ⏭️  LLM decided not to vote. Reason: ${validation.data!.reason}`);
        return { success: true, actionType: 'vote', userId, provider, latencyMs };
      }

      voteType = validation.data!.voteType!;
      reason = validation.data!.reason ?? '';
    }

    // 3. Cast vote via API
    console.log('   📤 Casting vote via API...');
    const user = (await this.contextGatherer.getAllBotUsers()).find((u) => u.id === userId);
    if (!user) throw new Error(`Bot user #${userId} not found`);

    const apiResult = await this.apiExecutor.castVote(user.id, user.email, {
      targetType: context.targetType,
      targetId: context.targetId,
      voteType,
    });

    if (!apiResult.success) {
      console.log(`   ❌ API error: ${apiResult.error}`);
      return {
        success: false, actionType: 'vote', userId, provider,
        latencyMs: Date.now() - startTime, error: apiResult.error,
      };
    }

    const latencyMs = Date.now() - startTime;
    const strategyLabel = isRandomVoter ? 'random' : 'personality_based';
    console.log(`   🎉 Vote cast! ${voteType} on ${context.targetType} #${context.targetId} (${latencyMs}ms)`);
    console.log(`   💡 Strategy: ${strategyLabel} | Reason: ${reason}`);

    return { success: true, actionType: 'vote', userId, provider, latencyMs };
  }

  getRateLimiterStats() {
    return this.rateLimiter.getTodayStats();
  }

  getLLMProviders(): string[] {
    return this.llmManager.getProviderIds();
  }

  async disconnect(): Promise<void> {
    await this.contextGatherer.disconnect();
    await this.validator.disconnect();
  }
}
