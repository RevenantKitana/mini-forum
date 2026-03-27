export interface LLMStackEntry {
  id: string;
  providerType: 'gemini' | 'groq' | 'cerebras' | 'nvidia';
  model: string;
}

export const LLM_STACK: LLMStackEntry[] = [
  { id: 'gemini-flash', providerType: 'gemini', model: 'gemini-2.5-flash' },
  { id: 'nvidia-llama-70b', providerType: 'nvidia', model: 'meta/llama-3.3-70b-instruct' },
  { id: 'groq-70b', providerType: 'groq', model: 'llama-3.3-70b-versatile' },
  { id: 'groq-8b', providerType: 'groq', model: 'llama-3.1-8b-instant' },
  { id: 'cerebras-qwen', providerType: 'cerebras', model: 'qwen-3-235b-a22b' },
  { id: 'cerebras-llama', providerType: 'cerebras', model: 'llama-3.1-8b' },
];
