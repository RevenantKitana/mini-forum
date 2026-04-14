import { ILLMProvider, LLMError } from './ILLMProvider.js';
import {
  COMMENT_PROVIDER_QUEUE,
  LLM_STACK,
  MODEL_LABEL_MAP,
  POST_PROVIDER_QUEUE,
  VOTE_LLM_PROVIDER_QUEUE,
} from '../../config/llm.js';
import {
  LLMOutput,
  ProviderStackItem,
  ProviderStatusSnapshot,
  ProviderUnavailableReason,
} from '../../types/index.js';
import { GeminiProvider } from './GeminiProvider.js';
import { GroqProvider } from './GroqProvider.js';
import { CerebrasProvider } from './CerebrasProvider.js';
import { NvidiaProvider } from './NvidiaProvider.js';
import { BeeknoeeProvider } from './BeeknoeeProvider.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface LLMGenerateResult {
  output: LLMOutput;
  provider: string;
}

export type LLMTaskType = 'post' | 'comment' | 'vote_llm' | 'default';

const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
const TRANSIENT_UNAVAILABLE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const VALID_UNAVAILABLE_REASONS: ProviderUnavailableReason[] = [
  'missing_api_key',
  'cooldown',
  'auth_error',
  'rate_limited',
  'timeout',
  'unavailable',
];

interface ProviderRuntimeState {
  reason: ProviderUnavailableReason;
  message?: string;
  at: number;
}

interface LLMProviderManagerOptions {
  providers?: ILLMProvider[];
  now?: () => number;
  hasApiKey?: (providerId: string) => boolean;
}

export class LLMProviderManager {
  private providers: ILLMProvider[] = [];
  private cooldowns = new Map<string, number>(); // providerId -> cooled-down-until timestamp
  private lastUnavailable = new Map<string, ProviderRuntimeState>();
  private now: () => number;
  private hasApiKey: (providerId: string) => boolean;

  constructor(options?: LLMProviderManagerOptions) {
    this.now = options?.now || (() => Date.now());
    this.hasApiKey = options?.hasApiKey || ((providerId: string) => this.defaultHasApiKey(providerId));

    if (options?.providers) {
      this.providers = options.providers;
      return;
    }

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
        case 'beeknoee':
          this.providers.push(new BeeknoeeProvider(entry.id, entry.model));
          break;
      }
    }
  }

  async generate(prompt: string): Promise<LLMGenerateResult> {
    return this.generateByTask(prompt, 'post');
  }

  async generateByTask(prompt: string, taskType: LLMTaskType): Promise<LLMGenerateResult> {
    const queue = this.buildProviderQueue(taskType);
    for (const provider of queue) {
      if (this.isOnCooldown(provider.id)) {
        const cooldownUntil = this.cooldowns.get(provider.id)!;
        const until = new Date(cooldownUntil).toLocaleTimeString('vi-VN');
        logger.debug(`${provider.id} - skipped (cooldown until ${until})`);
        continue;
      }

      try {
        const available = await provider.isAvailable();
        if (!available) {
          const reason = this.hasApiKey(provider.id) ? 'unavailable' : 'missing_api_key';
          this.setUnavailableReason(provider.id, reason);
          logger.debug(`${provider.id} - skipped (unavailable)`);
          continue;
        }

        const output = await this.callWithRetry(provider, prompt, 3);
        this.clearUnavailableReason(provider.id);
        logger.info(`${provider.id} - success`);
        return { output, provider: provider.id };
      } catch (err: any) {
        const unavailableReason = this.mapErrorToReason(err);
        this.setUnavailableReason(provider.id, unavailableReason, err?.message);
        logger.warn(`${provider.id} - failed: ${err.message}`);

        if (err instanceof LLMError && err.code === 'RATE_LIMIT') {
          this.setCooldown(provider.id);
        }
      }
    }

    throw new Error('All LLM providers exhausted - no quota remaining');
  }

  async generateWithProvider(prompt: string, providerId: string): Promise<LLMGenerateResult> {
    const provider = this.providers.find((item) => item.id === providerId);
    if (!provider) {
      throw new Error(`Unknown provider id: ${providerId}`);
    }

    if (this.isOnCooldown(provider.id)) {
      const cooldownUntil = this.cooldowns.get(provider.id)!;
      throw new Error(`${provider.id} is in cooldown until ${new Date(cooldownUntil).toISOString()}`);
    }

    const available = await provider.isAvailable();
    if (!available) {
      const reason = this.hasApiKey(provider.id) ? 'unavailable' : 'missing_api_key';
      this.setUnavailableReason(provider.id, reason);
      throw new Error(`${provider.id} is unavailable (${reason})`);
    }

    try {
      const output = await this.callWithRetry(provider, prompt, 3);
      this.clearUnavailableReason(provider.id);
      logger.info(`${provider.id} - success`);
      return { output, provider: provider.id };
    } catch (err: any) {
      const unavailableReason = this.mapErrorToReason(err);
      this.setUnavailableReason(provider.id, unavailableReason, err?.message);
      logger.warn(`${provider.id} - failed: ${err.message}`);

      if (err instanceof LLMError && err.code === 'RATE_LIMIT') {
        this.setCooldown(provider.id);
      }
      throw err;
    }
  }

  private buildProviderQueue(taskType: LLMTaskType): ILLMProvider[] {
    const providerById = new Map(this.providers.map((provider) => [provider.id, provider]));
    const configuredQueueIds =
      taskType === 'comment'
        ? COMMENT_PROVIDER_QUEUE
        : taskType === 'vote_llm'
          ? VOTE_LLM_PROVIDER_QUEUE
          : POST_PROVIDER_QUEUE;

    const queue: ILLMProvider[] = [];
    for (const providerId of configuredQueueIds) {
      const provider = providerById.get(providerId);
      if (provider) queue.push(provider);
    }

    // Preserve compatibility for test providers or future providers
    for (const provider of this.providers) {
      if (!queue.some((item) => item.id === provider.id)) {
        queue.push(provider);
      }
    }

    return queue;
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
      return err.code === 'TIMEOUT';
    }
    return false;
  }

  private mapErrorToReason(err: unknown): ProviderUnavailableReason {
    if (err instanceof LLMError) {
      if (err.code === 'RATE_LIMIT') return 'rate_limited';
      if (err.code === 'AUTH') return 'auth_error';
      if (err.code === 'TIMEOUT') return 'timeout';
    }
    return 'unavailable';
  }

  private setUnavailableReason(id: string, reason: ProviderUnavailableReason, message?: string): void {
    this.lastUnavailable.set(id, { reason, message, at: this.now() });
  }

  private clearUnavailableReason(id: string): void {
    this.lastUnavailable.delete(id);
  }

  private setCooldown(id: string): void {
    const until = this.now() + COOLDOWN_MS;
    this.cooldowns.set(id, until);
    this.setUnavailableReason(id, 'cooldown', 'Provider is cooling down after rate limit');
    const untilStr = new Date(until).toLocaleTimeString('vi-VN');
    logger.warn(`${id} - set cooldown 2h (until ${untilStr})`);
  }

  private isOnCooldown(id: string): boolean {
    const until = this.cooldowns.get(id);
    if (!until) return false;
    if (this.now() < until) return true;

    this.cooldowns.delete(id);
    const current = this.lastUnavailable.get(id);
    if (current?.reason === 'cooldown') {
      this.lastUnavailable.delete(id);
    }
    return false;
  }

  private defaultHasApiKey(providerId: string): boolean {
    if (providerId.startsWith('gemini')) return !!config.llm.geminiApiKey;
    if (providerId.startsWith('groq')) return !!config.llm.groqApiKey;
    if (providerId.startsWith('cerebras')) return !!config.llm.cerebrasApiKey;
    if (providerId.startsWith('nvidia')) return !!config.llm.nvidiaApiKey;
    if (providerId.startsWith('beeknoee')) return !!config.llm.beeknoeeApiKey;
    return true;
  }

  private normalizeUnavailableReason(reason: unknown): ProviderUnavailableReason {
    if (typeof reason === 'string' && VALID_UNAVAILABLE_REASONS.includes(reason as ProviderUnavailableReason)) {
      return reason as ProviderUnavailableReason;
    }
    return 'unavailable';
  }

  getProviderIds(): string[] {
    return this.providers.map((p) => p.id);
  }

  getProviderIdByLabel(label: number): string | undefined {
    return MODEL_LABEL_MAP[label];
  }

  async getProviderStatusSnapshot(): Promise<ProviderStatusSnapshot[]> {
    const snapshot: ProviderStatusSnapshot[] = [];

    for (const provider of this.providers) {
      const checkedAt = new Date(this.now()).toISOString();
      if (this.isOnCooldown(provider.id)) {
        const cooldownUntilEpoch = this.cooldowns.get(provider.id)!;
        snapshot.push({
          id: provider.id,
          available: false,
          reason: 'cooldown',
          message: 'Provider is in cooldown window after previous failure',
          checkedAt,
          cooldownUntil: new Date(cooldownUntilEpoch).toISOString(),
        });
        continue;
      }

      if (!this.hasApiKey(provider.id)) {
        snapshot.push({
          id: provider.id,
          available: false,
          reason: 'missing_api_key',
          message: 'API key is not configured',
          checkedAt,
        });
        continue;
      }

      const lastUnavailable = this.lastUnavailable.get(provider.id);
      if (lastUnavailable) {
        const isTransientExpired =
          (lastUnavailable.reason === 'timeout' || lastUnavailable.reason === 'unavailable')
          && this.now() - lastUnavailable.at > TRANSIENT_UNAVAILABLE_TTL_MS;

        if (isTransientExpired) {
          this.lastUnavailable.delete(provider.id);
        } else {
          snapshot.push({
            id: provider.id,
            available: false,
            reason: this.normalizeUnavailableReason(lastUnavailable.reason),
            message: lastUnavailable.message,
            checkedAt,
          });
          continue;
        }
      }

      let isAvailable = true;
      try {
        isAvailable = await provider.isAvailable();
      } catch (err: any) {
        const reason = this.mapErrorToReason(err);
        this.setUnavailableReason(provider.id, reason, err?.message);
        snapshot.push({
          id: provider.id,
          available: false,
          reason,
          message: err?.message,
          checkedAt,
        });
        continue;
      }

      if (!isAvailable) {
        snapshot.push({
          id: provider.id,
          available: false,
          reason: this.normalizeUnavailableReason('unavailable'),
          checkedAt,
        });
        continue;
      }

      snapshot.push({
        id: provider.id,
        available: true,
        checkedAt,
      });
    }

    return snapshot;
  }

  async getProviderStackSnapshot(): Promise<ProviderStackItem[]> {
    const statusSnapshot = await this.getProviderStatusSnapshot();
    const statusById = new Map(statusSnapshot.map((item) => [item.id, item]));

    return this.providers.map((provider, index) => {
      const status = statusById.get(provider.id);
      const stackMeta = LLM_STACK.find((entry) => entry.id === provider.id);

      return {
        priority: index + 1,
        id: provider.id,
        providerType: stackMeta?.providerType,
        model: stackMeta?.model,
        available: status?.available ?? false,
        reason: status?.reason ? this.normalizeUnavailableReason(status.reason) : undefined,
        message: status?.message,
        checkedAt: status?.checkedAt || new Date(this.now()).toISOString(),
        cooldownUntil: status?.cooldownUntil,
      };
    });
  }

  getCooldownStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    for (const [id, until] of this.cooldowns.entries()) {
      if (this.now() < until) {
        status[id] = `cooldown until ${new Date(until).toLocaleTimeString('vi-VN')}`;
      }
    }
    return status;
  }
}
