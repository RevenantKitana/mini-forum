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
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      });

      let text = result.response.text();
      if (!text) {
        throw new LLMError('Empty response from Gemini', 'VALIDATION');
      }

      // Clean up response: extract JSON if wrapped in markdown
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Remove BOM and leading whitespace
      text = text.replace(/^\uFEFF/, '').trim();

      // If response starts with anything other than { or [, it's not valid JSON
      if (!text.match(/^[\s]*[{[]/ )) {
        console.log(`   [DEBUG] Gemini response not JSON: ${text.substring(0, 200)}`);
        throw new LLMError(
          `Response is not JSON. Got: ${text.substring(0, 100)}...`,
          'VALIDATION'
        );
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (parseErr: any) {
        console.log(`   [DEBUG] JSON parse error: ${parseErr.message}`);
        console.log(`   [DEBUG] Full response length: ${text.length}`);
        console.log(`   [DEBUG] Full response:\n${text}`);
        
        // Try to fix common JSON issues
        const fixedText = this.fixJSON(text);
        if (fixedText !== text) {
          console.log(`   [DEBUG] Applied fixJSON, trying parse again...`);
        }
        
        try {
          parsed = JSON.parse(fixedText);
        } catch (fixErr: any) {
          console.log(`   [DEBUG] Fixed JSON still invalid: ${fixErr.message}`);
          console.log(`   [DEBUG] Fixed response:\n${fixedText}`);
          throw fixErr;
        }
      }

      return {
        title: parsed.title,
        content: parsed.content,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
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

  private fixJSON(text: string): string {
    // Remove BOM characters
    text = text.replace(/^\uFEFF/, '');

    // Escape actual newlines in string values (but not escaped ones)
    // This is a simplified approach: find all "..." blocks and escape newlines inside them
    text = text.replace(/"([^"]*)"/g, (match) => {
      // Replace literal newlines with escaped newlines
      return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    });

    // Remove control characters (but preserve escaped sequences)
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Remove trailing commas before ] or }
    text = text.replace(/,(\s*[}\]])/g, '$1');

    // Try to close unterminated strings at end
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '\\' && inString && !escaped) {
        escaped = true;
        continue;
      }

      if (char === '"' && !escaped) {
        inString = !inString;
      }

      if (!inString) {
        if (char === '{' || char === '[') depth++;
        if (char === '}' || char === ']') depth--;
      }

      escaped = false;
    }

    // If still in string or unclosed braces, close them
    if (inString) {
      text += '"';
    }

    // Close unclosed braces/brackets
    while (depth > 0) {
      text += '}';
      depth--;
    }

    return text;
  }
}
