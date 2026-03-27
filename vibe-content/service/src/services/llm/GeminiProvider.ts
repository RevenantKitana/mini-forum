import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILLMProvider, LLMError } from './ILLMProvider.js';
import { LLMOutput } from '../../types/index.js';
import config from '../../config/index.js';

export class GeminiProvider implements ILLMProvider {
  id = 'gemini-flash';
  private model;
  private timeoutMs: number;

  constructor() {
    const genAI = new GoogleGenerativeAI(config.llm.geminiApiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.timeoutMs = config.llm.providerTimeoutMs;
  }

  async isAvailable(): Promise<boolean> {
    return !!config.llm.geminiApiKey;
  }

  async generate(prompt: string): Promise<LLMOutput> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });

      const text = result.response.text();
      if (!text) {
        throw new LLMError('Empty response from Gemini', 'VALIDATION');
      }

      const parsed = JSON.parse(text);
      return {
        title: parsed.title,
        content: parsed.content,
        tags: parsed.tags,
        explain: parsed.explain,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new LLMError('Gemini request timed out', 'TIMEOUT');
      }
      if (error instanceof LLMError) throw error;
      if (error.status === 429) {
        throw new LLMError('Gemini rate limit exceeded', 'RATE_LIMIT', 429);
      }
      if (error.status === 401 || error.status === 403) {
        throw new LLMError('Gemini auth error', 'AUTH', error.status);
      }
      if (error instanceof SyntaxError) {
        throw new LLMError(`Invalid JSON from Gemini: ${error.message}`, 'VALIDATION');
      }
      throw new LLMError(`Gemini error: ${error.message}`, 'UNKNOWN');
    } finally {
      clearTimeout(timeout);
    }
  }
}
