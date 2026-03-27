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

export interface PersonalityInfo {
  traits: string[];
  tone: string;
  topics: string[];
  writingStyle?: string;
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
}

export interface SelectedAction {
  userId: number;
  actionType: ActionType;
  targetId?: number;
  targetType?: 'post' | 'comment';
}
