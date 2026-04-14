export type ActionType = 'post' | 'comment' | 'vote';

export interface BotUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface PostTarget {
  id: number;
  title: string;
  excerpt: string;
  authorName: string;
  categoryName: string;
}

export interface CommentTarget {
  id: number;
  content: string;
  authorName: string;
  postId: number;
  postTitle: string;
}

export interface GenerationContext {
  user: BotUser;
  category: Category;
  availableTags: Tag[];
  recentPosts?: { title: string; excerpt: string }[];
}

export interface CommentContext {
  user: BotUser;
  targetPost: PostTarget;
  parentComment?: CommentTarget;
}

export interface VoteContext {
  user: BotUser;
  personality: PersonalityInfo | null;
  targetType: 'post' | 'comment';
  targetId: number;
  targetTitle: string;
  targetContent: string;
  targetAuthor: string;
  targetCategory: string;
}

export interface VotePatterns {
  likeTopics: string[];
  dislikeTopics: string[];
  voteFrequency: number;
  upvoteBias: number; // 0-100
}

export interface PersonalityInfo {
  traits: string[];
  tone: string;
  topics: string[];
  writingStyle?: string;
  votePatterns?: VotePatterns;
}

export interface QualityScore {
  lengthOk: boolean;
  languageOk: boolean;
  tagsValid: boolean;
  noJsonArtifacts: boolean;
  notDuplicate: boolean;
  overallPass: boolean;
  details: string[];
}

export interface LLMOutput {
  content: string;
  title?: string;
  tags?: string[];
  explain?: string;
  // Vote-specific fields
  shouldVote?: boolean;
  voteType?: string | null;
  reason?: string;
}

export interface ActionResult {
  success: boolean;
  actionType: ActionType;
  userId: number;
  provider: string;
  latencyMs: number;
  error?: string;
  actionId?: string;
  completedAt?: string;
  triggerSource?: ActionTriggerSource;
}

export interface SelectedAction {
  userId: number;
  actionType: ActionType;
  targetId?: number;
  targetType?: 'post' | 'comment';
}

export type ActionTriggerSource = 'cron' | 'manual' | 'retry';

export type ProviderUnavailableReason =
  | 'missing_api_key'
  | 'cooldown'
  | 'auth_error'
  | 'rate_limited'
  | 'timeout'
  | 'unavailable';

export interface ProviderStatusSnapshot {
  id: string;
  available: boolean;
  reason?: ProviderUnavailableReason;
  message?: string;
  checkedAt: string;
  cooldownUntil?: string;
}

export interface ActionLevelHistoryItem {
  actionId: string;
  actionType: ActionType;
  userId: number;
  provider: string;
  success: boolean;
  latencyMs: number;
  error?: string;
  triggerSource: ActionTriggerSource;
  completedAt: string;
}

export interface ActionStatsSnapshot {
  totalActions: number;
  successCount: number;
  failedCount: number;
  successRate: string;
  byTrigger: Record<ActionTriggerSource, number>;
  byAction: Record<ActionType, number>;
  byActionTrigger: Record<ActionType, Record<ActionTriggerSource, number>>;
}

export interface ProviderStackItem {
  priority: number;
  id: string;
  providerType?: 'gemini' | 'groq' | 'cerebras' | 'nvidia' | 'beeknoee';
  model?: string;
  available: boolean;
  reason?: ProviderUnavailableReason;
  message?: string;
  checkedAt: string;
  cooldownUntil?: string;
}

export interface GeneratorStatusSnapshot {
  providers: string[];
  modelStack: ProviderStackItem[];
  providerStatus: {
    available: ProviderStatusSnapshot[];
    unavailable: ProviderStatusSnapshot[];
    all: ProviderStatusSnapshot[];
  };
  todayStats: ActionStatsSnapshot;
  recentActions: ActionLevelHistoryItem[];
  lastAction: ActionLevelHistoryItem | null;
  todayActions: Record<string, unknown>;
  queue: Record<string, unknown>;
}
