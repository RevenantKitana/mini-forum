import { ILLMProvider, LLMError } from './ILLMProvider.js';
import { LLMOutput } from '../../types/index.js';
import config from '../../config/index.js';

export class GroqProvider implements ILLMProvider {
  id: string;
  private model: string;
  private timeoutMs: number;

  constructor(id: string, model: string) {
    this.id = id;
    this.model = model;
    this.timeoutMs = config.llm.providerTimeoutMs;
  }

  async isAvailable(): Promise<boolean> {
    return !!config.llm.groqApiKey;
  }

  async generate(prompt: string): Promise<LLMOutput> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.llm.groqApiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new LLMError('Groq rate limit exceeded', 'RATE_LIMIT', 429);
        }
        if (res.status === 401 || res.status === 403) {
          throw new LLMError('Groq auth error', 'AUTH', res.status);
        }
        throw new LLMError(`Groq HTTP ${res.status}`, 'UNKNOWN', res.status);
      }

      const data = await res.json();
      let text = data.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new LLMError('Empty response from Groq', 'VALIDATION');
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
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new LLMError('Groq request timed out', 'TIMEOUT');
      }
      if (error instanceof LLMError) throw error;
      if (error instanceof SyntaxError) {
        throw new LLMError(`Invalid JSON from Groq: ${error.message}`, 'VALIDATION');
      }
      throw new LLMError(`Groq error: ${error.message}`, 'UNKNOWN');
    } finally {
      clearTimeout(timeout);
    }
  }
}
