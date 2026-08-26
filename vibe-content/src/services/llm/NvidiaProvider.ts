import { ILLMProvider, LLMError } from './ILLMProvider.js';
import { LLMOutput } from '../../types/index.js';
import config from '../../config/index.js';

export class NvidiaProvider implements ILLMProvider {
  id: string;
  private model: string;
  private timeoutMs: number;

  constructor(id: string, model: string) {
    this.id = id;
    this.model = model;
    this.timeoutMs = config.llm.providerTimeoutMs;
    console.log(`[NVIDIA] Initialized with ID: ${id}, Model: ${model}`);
  }

  async isAvailable(): Promise<boolean> {
    return !!config.llm.nvidiaApiKey;
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
      };

      console.log(`[NVIDIA] Sending request with model: ${this.model}`);
      console.log(`[NVIDIA] Request body:`, JSON.stringify(requestBody, null, 2));

      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.llm.nvidiaApiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[NVIDIA] HTTP ${res.status}: ${errorText}`);
        
        if (res.status === 429) {
          throw new LLMError('NVIDIA rate limit exceeded', 'RATE_LIMIT', 429);
        }
        if (res.status === 401 || res.status === 403) {
          throw new LLMError('NVIDIA auth error', 'AUTH', res.status);
        }
        throw new LLMError(`NVIDIA HTTP ${res.status}`, 'UNKNOWN', res.status);
      }

      const data = await res.json();
      let text = data.choices?.[0]?.message?.content || '';

      if (!text) {
        console.error('[NVIDIA] Empty response - full response data:', JSON.stringify(data, null, 2));
        throw new LLMError('Empty response from NVIDIA', 'VALIDATION');
      }

      console.log('[NVIDIA] Raw response text:', text.substring(0, 200));

      // Try to parse as JSON first
      try {
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
      } catch (jsonError: any) {
        console.warn(`[NVIDIA] Failed to parse JSON, treating as plain text: ${jsonError.message}`);
        
        // Fallback: treat plain text response as a simple post
        return {
          title: text.split('\n')[0] || 'Untitled',
          content: text,
          tags: [],
          explain: '',
          shouldVote: false,
          voteType: 'neutral',
          reason: '',
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new LLMError('NVIDIA request timed out', 'TIMEOUT');
      }
      if (error instanceof LLMError) throw error;
      if (error instanceof SyntaxError) {
        throw new LLMError(`Invalid JSON from NVIDIA: ${error.message}`, 'VALIDATION');
      }
      throw new LLMError(`NVIDIA error: ${error.message}`, 'UNKNOWN');
    } finally {
      clearTimeout(timeout);
    }
  }
}
