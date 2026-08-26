export interface LLMStackEntry {
  id: string;
  providerType: 'gemini' | 'groq' | 'nvidia' | 'openrouter';
  model: string;
}

export const LLM_STACK: LLMStackEntry[] = [
  { id: 'gemini-flash', providerType: 'gemini', model: 'gemini-2.5-flash' },
  { id: 'groq-gpt-oss-120b', providerType: 'groq', model: 'openai/gpt-oss-120b' },
  { id: 'groq-gpt-oss-20b', providerType: 'groq', model: 'openai/gpt-oss-20b' },
  { id: 'openrouter-nemotron-3-ultra-550b-a55b', providerType: 'openrouter', model: 'nvidia/nemotron-3-ultra-550b-a55b:free' },
];

export const POST_PROVIDER_QUEUE = LLM_STACK.map((entry) => entry.id);

export const COMMENT_PROVIDER_QUEUE = ['groq-gpt-oss-120b', 'groq-gpt-oss-20b', 'gemini-flash', 'openrouter-nemotron-3-ultra-550b-a55b'];

export const VOTE_LLM_PROVIDER_QUEUE = [...POST_PROVIDER_QUEUE].reverse();

export const MODEL_LABEL_MAP: Record<number, string> = {
  1: 'gemini-flash',
  2: 'groq-gpt-oss-120b',
  3: 'groq-gpt-oss-20b',
  4: 'openrouter-nemotron-3-ultra-550b-a55b',
};
