import { ILLMProvider, LLMError } from './ILLMProvider.js';
import { LLM_STACK } from '../../config/llm.js';
import { LLMOutput } from '../../types/index.js';
import { GeminiProvider } from './GeminiProvider.js';
import { GroqProvider } from './GroqProvider.js';
import { CerebrasProvider } from './CerebrasProvider.js';
import { TemplateProvider } from './TemplateProvider.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface LLMGenerateResult {
  output: LLMOutput;
  provider: string;
}

export class LLMProviderManager {
  private providers: ILLMProvider[] = [];

  constructor() {
    for (const entry of LLM_STACK) {
      switch (entry.providerType) {
        case 'gemini':
          this.providers.push(new GeminiProvider());
          break;
        case 'groq':
          this.providers.push(new GroqProvider(entry.id, entry.model));
          break;
        case 'cerebras':
          this.providers.push(new CerebrasProvider(entry.id, entry.model));
          break;
        case 'template':
          this.providers.push(new TemplateProvider());
          break;
      }
    }
  }

  async generate(prompt: string): Promise<LLMGenerateResult> {
    for (const provider of this.providers) {
      try {
        const available = await provider.isAvailable();
        if (!available) {
          console.log(`   ⏭️  ${provider.id} — skipped (unavailable)`);
          continue;
        }

        const output = await this.callWithRetry(provider, prompt, 3);
        console.log(`   ✅ ${provider.id} — success`);
        return { output, provider: provider.id };
      } catch (err: any) {
        console.log(`   ⚠️  ${provider.id} — failed: ${err.message}`);
        // continue to next provider
      }
    }
    // Should never reach here because TemplateProvider never fails
    throw new Error('All LLM providers in stack failed (critical error)');
  }

  private async callWithRetry(
    provider: ILLMProvider,
    prompt: string,
    maxRetries: number,
  ): Promise<LLMOutput> {
    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await provider.generate(prompt);
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries - 1 && this.isRetryable(err)) {
          const backoff = Math.pow(2, attempt) * 1000;
          console.log(`   🔄 ${provider.id} retry ${attempt + 1}/${maxRetries} in ${backoff}ms`);
          await sleep(backoff);
          continue;
        }
        break;
      }
    }
    throw lastError;
  }

  private isRetryable(err: any): boolean {
    if (err instanceof LLMError) {
      return err.code === 'TIMEOUT' || err.code === 'RATE_LIMIT';
    }
    return false;
  }

  getProviderIds(): string[] {
    return this.providers.map((p) => p.id);
  }
}
