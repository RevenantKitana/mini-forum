import { ILLMProvider, LLMError } from './ILLMProvider.js';
import { LLMOutput } from '../../types/index.js';
import config from '../../config/index.js';

const BEEKNOEE_CHAT_COMPLETIONS_URL = 'https://platform.beeknoee.com/v1/chat/completions';

export class BeeknoeeProvider implements ILLMProvider {
  id: string;
  private model: string;
  private modelCandidates: string[];
  private timeoutMs: number;

  constructor(id: string, model: string) {
    this.id = id;
    this.model = model;
    this.modelCandidates = this.buildModelCandidates(model);
    this.timeoutMs = config.llm.providerTimeoutMs;
  }

  async isAvailable(): Promise<boolean> {
    return !!config.llm.beeknoeeApiKey;
  }

  async generate(prompt: string): Promise<LLMOutput> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let lastError: LLMError | null = null;

      for (const modelCandidate of this.modelCandidates) {
        // Try OpenAI-compatible JSON mode first
        let attempt = await this.sendRequest(prompt, modelCandidate, controller.signal, true);

        // Some compatible APIs reject response_format=json_object
        if (!attempt.ok && attempt.status === 400 && this.isResponseFormatError(attempt.errorBody)) {
          attempt = await this.sendRequest(prompt, modelCandidate, controller.signal, false);
        }

        if (!attempt.ok) {
          if (attempt.status === 400 && this.isModelNotFoundError(attempt.errorBody)) {
            lastError = new LLMError(
              `Beeknoee HTTP 400 (model invalid: ${modelCandidate}): ${attempt.errorBody || 'unknown error'}`,
              'UNKNOWN',
              400,
            );
            continue;
          }

          if (attempt.status === 429) {
            throw new LLMError(`Beeknoee rate limit exceeded: ${attempt.errorBody || ''}`.trim(), 'RATE_LIMIT', 429);
          }
          if (attempt.status === 401 || attempt.status === 403) {
            throw new LLMError(`Beeknoee auth error: ${attempt.errorBody || ''}`.trim(), 'AUTH', attempt.status);
          }
          throw new LLMError(
            `Beeknoee HTTP ${attempt.status}${attempt.errorBody ? `: ${attempt.errorBody}` : ''}`,
            'UNKNOWN',
            attempt.status,
          );
        }

        const data = attempt.data;
        let text = data.choices?.[0]?.message?.content || '';

        if (!text) {
          throw new LLMError('Empty response from Beeknoee', 'VALIDATION');
        }

        // Clean markdown wrappers
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(text);

        return {
          title: parsed.title,
          content: parsed.content,
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          explain: parsed.explain,
          shouldVote: parsed.shouldVote,
          voteType: parsed.voteType,
          reason: parsed.reason,
        };
      }

      throw lastError || new LLMError(`Beeknoee HTTP 400: model "${this.model}" is invalid`, 'UNKNOWN', 400);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new LLMError('Beeknoee request timed out', 'TIMEOUT');
      }
      if (error instanceof LLMError) throw error;
      if (error instanceof SyntaxError) {
        throw new LLMError(`Invalid JSON from Beeknoee: ${error.message}`, 'VALIDATION');
      }
      throw new LLMError(`Beeknoee error: ${error.message}`, 'UNKNOWN');
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildModelCandidates(model: string): string[] {
    const normalized = model
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return Array.from(new Set([model, normalized]));
  }

  private isResponseFormatError(errorBody: string): boolean {
    const value = errorBody.toLowerCase();
    return value.includes('response_format');
  }

  private isModelNotFoundError(errorBody: string): boolean {
    const value = errorBody.toLowerCase();
    return value.includes('model') && (
      value.includes('not found')
      || value.includes('does not exist')
      || value.includes('invalid')
      || value.includes('unsupported')
    );
  }

  private async sendRequest(
    prompt: string,
    model: string,
    signal: AbortSignal,
    useJsonResponseFormat: boolean,
  ): Promise<{ ok: true; data: any } | { ok: false; status: number; errorBody: string }> {
    const body: Record<string, unknown> = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 4096,
    };
    if (useJsonResponseFormat) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(BEEKNOEE_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.beeknoeeApiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return { ok: false, status: res.status, errorBody };
    }

    return { ok: true, data: await res.json() };
  }
}
