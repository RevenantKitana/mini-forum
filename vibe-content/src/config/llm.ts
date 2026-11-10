export interface LLMStackEntry {
  id: string;
  providerType: 'gemini' | 'groq' | 'nvidia' | 'openrouter' | 'cliproxy';
  model: string;
}

export const LLM_STACK: LLMStackEntry[] = [
  // Rank 1: Gemini 3.8 Flash (Mạnh nhất - RPM 5, RPD 20)
  { id: 'cliproxy-3-8-flash', providerType: 'cliproxy', model: 'gemini-3.8-flash' },

  // Rank 2: Gemini 3.6 Flash (Cân bằng, đa dụng - RPM 5, RPD 20)
  { id: 'cliproxy-3-6-flash', providerType: 'cliproxy', model: 'gemini-3.6-flash' },

  // Rank 3: Gemini 3 Flash Preview (Năng lực cao, Preview - RPM 5, RPD 20)
  { id: 'cliproxy-3-flash', providerType: 'cliproxy', model: 'gemini-3-flash' },

  // Rank 4: Gemini 3.5 Flash Lite (Tác vụ nhẹ, số lượng lớn - RPM 15, RPD 500)
  { id: 'cliproxy-3-5-flash-lite', providerType: 'cliproxy', model: 'gemini-3.5-flash-lite' },

  // Rank 5: Gemini 3.1 Flash Lite (Nhẹ, tiết kiệm tài nguyên - RPM 15, RPD 500)
  { id: 'cliproxy-3-1-flash-lite', providerType: 'cliproxy', model: 'gemini-3.1-flash-lite' },

  // Cứu hộ trực tiếp (Direct Fallback nếu Proxy chưa sẵn sàng)
  { id: 'gemini-flash', providerType: 'gemini', model: 'gemini-2.5-flash' },
  { id: 'groq-gpt-oss-120b', providerType: 'groq', model: 'openai/gpt-oss-120b' },
  { id: 'groq-gpt-oss-20b', providerType: 'groq', model: 'openai/gpt-oss-20b' },
  { id: 'openrouter-nemotron-3-ultra-550b-a55b', providerType: 'openrouter', model: 'nvidia/nemotron-3-ultra-550b-a55b:free' },
];

// Thứ tự ưu tiên BÀI VIẾT: 3.8 Flash -> 3.6 Flash -> 3 Flash -> 3.5 Lite -> 3.1 Lite -> Fallback
export const POST_PROVIDER_QUEUE = [
  'cliproxy-3-8-flash',
  'cliproxy-3-6-flash',
  'cliproxy-3-flash',
  'cliproxy-3-5-flash-lite',
  'cliproxy-3-1-flash-lite',
  'gemini-flash',
  'groq-gpt-oss-120b',
];

// Thứ tự ưu tiên BÌNH LUẬN: 3.8 Flash -> 3.6 Flash -> 3 Flash -> 3.5 Lite -> 3.1 Lite -> Fallback
export const COMMENT_PROVIDER_QUEUE = [
  'cliproxy-3-8-flash',
  'cliproxy-3-6-flash',
  'cliproxy-3-flash',
  'cliproxy-3-5-flash-lite',
  'cliproxy-3-1-flash-lite',
  'gemini-flash',
  'groq-gpt-oss-120b',
];

// Thứ tự ưu tiên VOTE: Đi thẳng vào Rank 4 (3.5 Lite - 500 RPD) -> Rank 5 (3.1 Lite - 500 RPD) để bảo toàn 100% quota cho bài viết
export const VOTE_LLM_PROVIDER_QUEUE = [
  'cliproxy-3-5-flash-lite',
  'cliproxy-3-1-flash-lite',
  'gemini-flash',
];

export const MODEL_LABEL_MAP: Record<number, string> = {
  1: 'cliproxy-3-8-flash',
  2: 'cliproxy-3-6-flash',
  3: 'cliproxy-3-flash',
  4: 'cliproxy-3-5-flash-lite',
  5: 'cliproxy-3-1-flash-lite',
  6: 'gemini-flash',
  7: 'groq-gpt-oss-120b',
  8: 'groq-gpt-oss-20b',
  9: 'openrouter-nemotron-3-ultra-550b-a55b',
};
