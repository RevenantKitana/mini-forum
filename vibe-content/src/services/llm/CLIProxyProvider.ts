import { ILLMProvider, LLMError } from './ILLMProvider.js';
import { LLMOutput } from '../../types/index.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

export class CLIProxyProvider implements ILLMProvider {
  id: string;
  private model: string;
  private timeoutMs: number;

  constructor(id: string = 'cliproxy-gemini', model: string = 'gemini-2.5-flash') {
    this.id = id;
    this.model = model;
    this.timeoutMs = config.llm.providerTimeoutMs;
  }

  async isAvailable(): Promise<boolean> {
    return !!config.llm.cliProxyUrl;
  }

  async generate(prompt: string): Promise<LLMOutput> {
    if (!config.llm.cliProxyUrl) {
      throw new LLMError('CLIProxy URL is not configured', 'AUTH');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const baseUrl = config.llm.cliProxyUrl.replace(/\/+$/, '');
      const url = baseUrl.endsWith('/v1')
        ? `${baseUrl}/chat/completions`
        : `${baseUrl}/v1/chat/completions`;

      const requestBody = {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.llm.cliProxyApiKey) {
        headers['Authorization'] = `Bearer ${config.llm.cliProxyApiKey}`;
      }

      logger.debug(`[CLIProxy] Sending request to ${url} with model: ${this.model}`);

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        logger.error(`[CLIProxy] HTTP ${res.status}: ${errorText}`);

        if (res.status === 429) {
          throw new LLMError('CLIProxy rate limit exceeded', 'RATE_LIMIT', 429);
        }
        if (res.status === 401 || res.status === 403) {
          throw new LLMError('CLIProxy auth error', 'AUTH', res.status);
        }
        throw new LLMError(`CLIProxy HTTP ${res.status}: ${errorText.substring(0, 100)}`, 'UNKNOWN', res.status);
      }

      const data = await res.json();
      let text = data.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new LLMError('Empty response from CLIProxy', 'VALIDATION');
      }

      // Clean up markdown wrapping if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      text = text.replace(/^\uFEFF/, '').trim();

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
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new LLMError('CLIProxy request timed out', 'TIMEOUT');
      }
      if (error instanceof LLMError) throw error;
      if (error instanceof SyntaxError) {
        throw new LLMError(`Invalid JSON from CLIProxy: ${error.message}`, 'VALIDATION');
      }
      throw new LLMError(`CLIProxy error: ${error.message}`, 'UNKNOWN');
    } finally {
      clearTimeout(timeout);
    }
  }
}

