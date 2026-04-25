import { memo } from 'react';
import type { PostBlock } from '@/api/services/postService';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { ImageBlockScroller } from '@/components/post/ImageBlockScroller';

interface BlockRendererProps {
  blocks: PostBlock[];
  className?: string;
}

/**
 * Phase 3: Renders an array of post blocks.
 * TEXT blocks → markdown rendered content.
 * IMAGE blocks → horizontal image scroller (Phase 4).
 *
 * Memoized (Phase 6) — avoids re-render when parent re-renders with the same blocks array.
 */
export const BlockRenderer = memo(function BlockRenderer({ blocks, className }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className={className}>
      {sorted.map((block) => (
        <div key={block.id} className="mb-4 last:mb-0">
          {block.type === 'TEXT' && block.content && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownRenderer content={block.content} />
            </div>
          )}
          {block.type === 'IMAGE' && block.media && block.media.length > 0 && (
            <ImageBlockScroller images={block.media} />
          )}
        </div>
      ))}
    </div>
  );
});
