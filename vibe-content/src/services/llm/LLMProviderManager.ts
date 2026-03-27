import { ILLMProvider, LLMError } from './ILLMProvider.js';
import { LLM_STACK } from '../../config/llm.js';
import { LLMOutput } from '../../types/index.js';
import { GeminiProvider } from './GeminiProvider.js';
import { GroqProvider } from './GroqProvider.js';
import { CerebrasProvider } from './CerebrasProvider.js';
import { NvidiaProvider } from './NvidiaProvider.js';
import logger from '../../utils/logger.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface LLMGenerateResult {
  output: LLMOutput;
  provider: string;
}

const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

export class LLMProviderManager {
  private providers: ILLMProvider[] = [];
  private cooldowns = new Map<string, number>(); // providerId -> cooled-down-until timestamp

  private setCooldown(id: string): void {
    const until = Date.now() + COOLDOWN_MS;
    this.cooldowns.set(id, until);
    const untilStr = new Date(until).toLocaleTimeString('vi-VN');
    logger.warn(`${id} — đặt cooldown 2h (bị bỏ qua đến ${untilStr})`);
  }

  private isOnCooldown(id: string): boolean {
    const until = this.cooldowns.get(id);
    if (!until) return false;
    if (Date.now() < until) return true;
    this.cooldowns.delete(id); // hết cooldown, xoá khỏi danh sách
    return false;
  }

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
        case 'nvidia':
          this.providers.push(new NvidiaProvider(entry.id, entry.model));
          break;
      }
    }
  }

  async generate(prompt: string): Promise<LLMGenerateResult> {
    for (const provider of this.providers) {
      if (this.isOnCooldown(provider.id)) {
        const until = new Date(this.cooldowns.get(provider.id)!).toLocaleTimeString('vi-VN');
        logger.debug(`${provider.id} — bỏ qua (cooldown đến ${until})`);
        continue;
      }

      try {
        const available = await provider.isAvailable();
        if (!available) {
          logger.debug(`${provider.id} — skipped (unavailable)`);
          continue;
        }

        const output = await this.callWithRetry(provider, prompt, 3);
        logger.info(`${provider.id} — success`);
        return { output, provider: provider.id };
      } catch (err: any) {
        logger.warn(`${provider.id} — failed: ${err.message}`);
        if (err instanceof LLMError && (err.code === 'RATE_LIMIT' || err.code === 'AUTH')) {
          this.setCooldown(provider.id);
        }
        // continue to next provider
      }
    }
    // All LLM providers exhausted or unavailable
    throw new Error('All LLM providers exhausted - no quota remaining');
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
          logger.info(`${provider.id} retry ${attempt + 1}/${maxRetries} in ${backoff}ms`);
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
      return err.code === 'TIMEOUT'; // RATE_LIMIT và AUTH sẽ trigger cooldown, không retry
    }
    return false;
  }

  getProviderIds(): string[] {
    return this.providers.map((p) => p.id);
  }

  getCooldownStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    for (const [id, until] of this.cooldowns.entries()) {
      if (Date.now() < until) {
        status[id] = `cooldown đến ${new Date(until).toLocaleTimeString('vi-VN')}`;
      }
    }
    return status;
  }
}
