import { ILLMProvider, LLMError } from './ILLMProvider.js';
import { LLMOutput } from '../../types/index.js';
import config from '../../config/index.js';

export class OpenRouterProvider implements ILLMProvider {
  id: string;
  private model: string;
  private timeoutMs: number;

  constructor(id: string, model: string) {
    this.id = id;
    this.model = model;
    this.timeoutMs = config.llm.providerTimeoutMs;
    console.log(`[OpenRouter] Initialized with ID: ${id}, Model: ${model}`);
  }

  async isAvailable(): Promise<boolean> {
    return !!config.llm.openRouterApiKey;
  }

  async generate(prompt: string): Promise<LLMOutput> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const requestBody = {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      };
      
      console.log(`[OpenRouter] Sending request with model: ${this.model}`);
      console.log(`[OpenRouter] Request body:`, JSON.stringify(requestBody, null, 2));

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.llm.openRouterApiKey}`,
          'HTTP-Referer': 'https://mini-forum.local',
          'X-Title': 'Mini Forum Vibe Content',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[OpenRouter] HTTP ${res.status}: ${errorText}`);
        
        if (res.status === 429) {
          throw new LLMError('OpenRouter rate limit exceeded', 'RATE_LIMIT', 429);
        }
        if (res.status === 401 || res.status === 403) {
          throw new LLMError('OpenRouter auth error', 'AUTH', res.status);
        }
        throw new LLMError(`OpenRouter HTTP ${res.status}`, 'UNKNOWN', res.status);
      }

      const data = await res.json();
      let text = data.choices?.[0]?.message?.content || '';

      if (!text) {
        console.error('[OpenRouter] Empty response - full response data:', JSON.stringify(data, null, 2));
        throw new LLMError('Empty response from OpenRouter', 'VALIDATION');
      }

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
        throw new LLMError('OpenRouter request timed out', 'TIMEOUT');
      }
      if (error instanceof LLMError) throw error;
      if (error instanceof SyntaxError) {
        throw new LLMError(`Invalid JSON from OpenRouter: ${error.message}`, 'VALIDATION');
      }
      throw new LLMError(`OpenRouter error: ${error.message}`, 'UNKNOWN');
    } finally {
      clearTimeout(timeout);
    }
  }
}
