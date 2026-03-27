import { ActionResult, BotUser } from '../types/index.js';
import { ContextGathererService } from './ContextGathererService.js';
import { PromptBuilderService } from './PromptBuilderService.js';
import { ValidationService } from './ValidationService.js';
import { APIExecutorService } from './APIExecutorService.js';
import { ILLMProvider } from './llm/ILLMProvider.js';
import { GeminiProvider } from './llm/GeminiProvider.js';

export class ContentGeneratorService {
  private contextGatherer: ContextGathererService;
  private promptBuilder: PromptBuilderService;
  private validator: ValidationService;
  private apiExecutor: APIExecutorService;
  private llmProvider: ILLMProvider;

  constructor() {
    this.contextGatherer = new ContextGathererService();
    this.promptBuilder = new PromptBuilderService(this.contextGatherer);
    this.validator = new ValidationService();
    this.apiExecutor = new APIExecutorService();
    this.llmProvider = new GeminiProvider();
  }

  async runOnce(): Promise<ActionResult> {
    const startTime = Date.now();
    let selectedUser: BotUser | null = null;

    try {
      // 1. Get all bot users and pick one randomly
      const botUsers = await this.contextGatherer.getAllBotUsers();
      if (botUsers.length === 0) {
        throw new Error('No active bot users found. Run seed:bots first.');
      }
      selectedUser = botUsers[Math.floor(Math.random() * botUsers.length)];
      console.log(`\n📝 Selected bot: ${selectedUser.display_name} (@${selectedUser.username})`);

      // 2. Check LLM availability
      const available = await this.llmProvider.isAvailable();
      if (!available) {
        throw new Error('LLM provider not available. Check GEMINI_API_KEY.');
      }

      // 3. Gather context
      console.log('   📦 Gathering context...');
      const context = await this.contextGatherer.gatherPostContext(selectedUser.id);
      console.log(`   📂 Category: ${context.category.name}`);
      console.log(`   🏷️  Tags pool: ${context.availableTags.length} available`);

      // 4. Build prompt
      console.log('   🔨 Building prompt...');
      const prompt = await this.promptBuilder.buildPostPrompt(context);

      // 5. Call LLM
      console.log(`   🤖 Calling ${this.llmProvider.id}...`);
      const llmOutput = await this.llmProvider.generate(prompt);
      console.log(`   ✅ LLM response received — title: "${llmOutput.title}"`);

      // 6. Validate
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
          success: false,
          actionType: 'post',
          userId: selectedUser.id,
          provider: this.llmProvider.id,
          latencyMs: Date.now() - startTime,
          error: errMsg,
        };
      }

      // 7. Call Forum API to create post
      console.log('   📤 Creating post via API...');
      const apiResult = await this.apiExecutor.createPost(
        selectedUser.id,
        selectedUser.email,
        {
          title: validation.data!.title,
          content: validation.data!.content,
          categoryId: context.category.id,
          tags: validation.data!.tags,
        },
      );

      if (!apiResult.success) {
        console.log(`   ❌ API error: ${apiResult.error}`);
        return {
          success: false,
          actionType: 'post',
          userId: selectedUser.id,
          provider: this.llmProvider.id,
          latencyMs: Date.now() - startTime,
          error: apiResult.error,
        };
      }

      const latencyMs = Date.now() - startTime;
      console.log(`   🎉 Post created! ID: ${apiResult.postId} (${latencyMs}ms)`);
      console.log(`   📌 Title: "${validation.data!.title}"`);
      console.log(`   🏷️  Tags: [${validation.data!.tags.join(', ')}]`);

      return {
        success: true,
        actionType: 'post',
        userId: selectedUser.id,
        provider: this.llmProvider.id,
        latencyMs,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      console.error(`   ❌ Error: ${error.message}`);
      return {
        success: false,
        actionType: 'post',
        userId: selectedUser?.id || 0,
        provider: this.llmProvider.id,
        latencyMs,
        error: error.message,
      };
    }
  }

  async disconnect(): Promise<void> {
    await this.contextGatherer.disconnect();
    await this.validator.disconnect();
  }
}
