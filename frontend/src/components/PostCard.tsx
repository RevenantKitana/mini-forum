import { Link } from 'react-router-dom';
import { useMemo, useRef, useEffect, useState } from 'react';
import { Post } from '@/api/services/postService';
import { Card } from '@/app/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { VoteButtons } from '@/components/common/VoteButtons';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { ImagePreviewModal } from '@/components/common/ImagePreviewModal';
import { AvatarPreviewModal } from '@/components/common/AvatarPreviewModal';
import { MessageSquare, Eye, Pin, Lock, ImageIcon } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ROLE_CONFIG, AUTHOR_ROLE_MAP } from '@/constants/roles';
import { trackPostInteraction } from '@/utils/analytics';
import { getAvatarUrl, getPostMediaUrl } from '@/utils/imageHelpers';

/**
 * Decode HTML entities recursively to handle double-encoding
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  let decoded = text;
  let prevDecoded = '';
  
  while (decoded !== prevDecoded) {
    prevDecoded = decoded;
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x22;/g, '"');
  }
  
  return decoded;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const authorDisplayName = post.author?.display_name || post.author?.username || 'Unknown';
  const authorAvatar = getAvatarUrl(post.author, 'preview');
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [showImageTooltip, setShowImageTooltip] = useState(false);
  
  // Subtle author role badge
  const getAuthorBadge = () => {
    if (!post.author) return null;
    const role = AUTHOR_ROLE_MAP[post.author.role];
    if (!role || role === 'MEMBER') return null;

    const { label } = ROLE_CONFIG[role];

    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
        {label}
      </span>
    );
  };

  const decodedTitle = useMemo(() => decodeHtmlEntities(post.title || ''), [post.title]);
  const decodedExcerpt = useMemo(() => {
    const text = post.excerpt || (post.content ? post.content.substring(0, 240) + (post.content.length > 240 ? '...' : '') : '');
    return decodeHtmlEntities(text);
  }, [post.excerpt, post.content]);

  return (
    <Card className="group relative overflow-hidden bg-card rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-all duration-200 flex flex-col p-5 sm:p-7 space-y-4">
      {/* Top Meta Line: Category • Author • Time • Pin/Lock */}
      <div className="flex items-center justify-between gap-2.5 text-sm sm:text-base text-muted-foreground flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          {post.category && (
            <Link
              to={`/?category=${post.category.slug}`}
              className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm uppercase tracking-wider text-foreground hover:text-primary transition-colors"
            >
              {post.category.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: post.category.color }}
                />
              )}
              <span>{post.category.name}</span>
            </Link>
          )}

          <span className="text-muted-foreground/40 font-bold">•</span>

          {post.author && (
            <Link
              to={`/users/${post.author.username}`}
              className="inline-flex items-center gap-2 hover:text-foreground transition-colors group/author"
            >
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAvatarModalOpen(true); }}
                className="flex-shrink-0 rounded-full"
                aria-label={`Xem ảnh đại diện của ${authorDisplayName}`}
              >
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 transition-transform group-hover/author:scale-105 ring-1 ring-border/50">
                  <AvatarImage src={authorAvatar || undefined} alt={authorDisplayName} />
                  <AvatarFallback className="text-xs font-semibold">{authorDisplayName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
              <span className="font-semibold text-sm sm:text-base text-foreground truncate max-w-[160px] sm:max-w-[240px]">
                {authorDisplayName}
              </span>
            </Link>
          )}

          {getAuthorBadge()}

          <span className="text-muted-foreground/40 font-bold">•</span>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs sm:text-sm text-muted-foreground cursor-default">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {format(new Date(post.created_at), 'dd/MM/yyyy HH:mm')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Pin & Lock indicators */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {post.is_pinned && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                  <Pin className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ghim</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Bài viết được ghim
              </TooltipContent>
            </Tooltip>
          )}
          {post.is_locked && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Đã khóa bình luận
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Post Title */}
      <div>
        <Link
          to={`/posts/${post.id}`}
          onClick={() => trackPostInteraction('click', post.id, { title: post.title })}
          className="block group/title"
        >
          <h3 className="text-lg sm:text-xl font-bold leading-snug tracking-tight text-foreground group-hover/title:text-primary transition-colors">
            {decodedTitle}
          </h3>
        </Link>
      </div>

      {/* Excerpt Content */}
      <div className="flex gap-3.5 items-start justify-between flex-1">
        <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground/90 line-clamp-3">
          {decodedExcerpt}
        </p>

        {/* Media indicator badge */}
        {(post.mediaCount || 0) > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsImageModalOpen(true)}
                onMouseEnter={() => setShowImageTooltip(true)}
                onMouseLeave={() => setShowImageTooltip(false)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors cursor-pointer text-xs sm:text-sm font-medium"
                aria-label={`${post.mediaCount} image(s) in this post`}
              >
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-semibold">{post.mediaCount}</span>
              </button>
            </TooltipTrigger>
            {showImageTooltip && post.media && post.media.length > 0 && (
              <TooltipContent side="left" className="p-2">
                <div className="flex flex-nowrap gap-2 items-center">
                  {post.media.slice(0, 3).map((img) => {
                    const url = getPostMediaUrl(img, 'standard');
                    return url ? (
                      <img
                        key={img.id}
                        src={url}
                        alt=""
                        className="block h-28 w-auto flex-shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : null;
                  })}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </div>

      {/* Tags Row */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {post.tags.slice(0, 5).map((tag) => (
            <Link
              key={tag.id}
              to={`/?tag=${tag.slug}`}
              className="text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
          {post.tags.length > 5 && (
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              +{post.tags.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Bottom Action Bar - Spacing-based separation */}
      <div className="pt-2 flex items-center justify-between text-sm sm:text-base text-muted-foreground">
        <div className="flex items-center gap-3 sm:gap-4">
          <VoteButtons
            targetId={post.id}
            targetType="post"
            upvoteCount={post.upvote_count}
            downvoteCount={post.downvote_count}
            authorId={post.author_id}
            size="sm"
            orientation="horizontal"
          />

          <Link
            to={`/posts/${post.id}#comments`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl hover:bg-muted/70 hover:text-foreground transition-colors font-medium text-xs sm:text-sm"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="tabular-nums font-semibold">{post.comment_count}</span>
            <span className="hidden sm:inline">thảo luận</span>
          </Link>

          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground font-medium text-xs sm:text-sm">
            <Eye className="h-4 w-4" />
            <span className="tabular-nums font-semibold">{post.view_count}</span>
          </span>
        </div>

        <div className="flex items-center">
          <BookmarkButton postId={post.id} size="sm" />
        </div>
      </div>

      {/* Modals */}
      <ImagePreviewModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={post.media || []}
        postTitle={post.title}
      />

      {post.author && (
        <AvatarPreviewModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          user={post.author}
        />
      )}
    </Card>
  );
}
