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

export interface GenerationContext {
  user: BotUser;
  category: Category;
  availableTags: Tag[];
  recentPosts?: { title: string; excerpt: string }[];
}

export interface LLMOutput {
  content: string;
  title?: string;
  tags?: string[];
  explain?: string;
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
}
