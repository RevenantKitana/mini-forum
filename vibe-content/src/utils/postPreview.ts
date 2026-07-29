export interface PostPreviewPayload {
  title: string;
  content: string;
  category?: string | null;
  tags?: string[] | null;
}

export interface PostPreviewResult {
  title: string;
  category: string | null;
  tags: string[];
  contentPreview: string;
}

export function buildPostPreview(payload: PostPreviewPayload): PostPreviewResult {
  const contentText = payload.content?.replace(/\s+/g, ' ').trim() ?? '';
  const words = contentText.split(' ').filter(Boolean);
  const previewWords = words.slice(0, 20);

  return {
    title: payload.title ?? '',
    category: payload.category ?? null,
    tags: (payload.tags ?? []).filter(Boolean),
    contentPreview: previewWords.length > 0 ? `${previewWords.join(' ')}${words.length > 20 ? '...' : ''}` : '',
  };
}
