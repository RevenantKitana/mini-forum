export interface LLMStackEntry {
  id: string;
  providerType: 'gemini' | 'groq' | 'cerebras' | 'nvidia' | 'beeknoee';
  model: string;
}

export const LLM_STACK: LLMStackEntry[] = [
  { id: 'beeknoee-qwen3-235b', providerType: 'beeknoee', model: 'qwen-3-235b-a22b-instruct-2507' },
  { id: 'gemini-flash', providerType: 'gemini', model: 'gemini-2.5-flash' },
  { id: 'beeknoee-gpt-oss-120b', providerType: 'beeknoee', model: 'openai/gpt-oss-120b' },
  { id: 'beeknoee-glm-4.7-flash', providerType: 'beeknoee', model: 'glm-4.7-flash' },
  { id: 'nvidia-llama-70b', providerType: 'nvidia', model: 'meta/llama-3.3-70b-instruct' },
  { id: 'cerebras-llama', providerType: 'cerebras', model: 'llama-3.1-8b' },
  { id: 'cerebras-qwen', providerType: 'cerebras', model: 'qwen-3-235b-a22b' },
  { id: 'groq-70b', providerType: 'groq', model: 'llama-3.3-70b-versatile' },
  { id: 'beeknoee-llama-3.1-8b', providerType: 'beeknoee', model: 'llama3.1-8b' },
  { id: 'groq-8b', providerType: 'groq', model: 'llama-3.1-8b-instant' },
];

export const POST_PROVIDER_QUEUE = LLM_STACK.map((entry) => entry.id);

export const COMMENT_PROVIDER_QUEUE = [
  'groq-70b',
  'cerebras-qwen',
  'cerebras-llama',
  'nvidia-llama-70b',
];

export const VOTE_LLM_PROVIDER_QUEUE = [...POST_PROVIDER_QUEUE].reverse();

export const MODEL_LABEL_MAP: Record<number, string> = {
  1: 'beeknoee-qwen3-235b',
  2: 'gemini-flash',
  3: 'beeknoee-gpt-oss-120b',
  4: 'beeknoee-glm-4.7-flash',
  5: 'nvidia-llama-70b',
  6: 'cerebras-llama',
  7: 'cerebras-qwen',
  8: 'groq-70b',
  9: 'beeknoee-llama-3.1-8b',
  10: 'groq-8b',
};
