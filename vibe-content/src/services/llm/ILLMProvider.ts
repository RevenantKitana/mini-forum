import { LLMOutput } from '../../types/index.js';

export interface ILLMProvider {
  id: string;
  generate(prompt: string): Promise<LLMOutput>;
  isAvailable(): Promise<boolean>;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'RATE_LIMIT' | 'AUTH' | 'VALIDATION' | 'UNKNOWN',
    public status?: number,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
