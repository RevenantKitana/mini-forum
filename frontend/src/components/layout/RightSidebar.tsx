import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFeaturedPosts, usePost } from '@/hooks/usePosts';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Pin, Eye, MessageSquare, ArrowUpRight, ChevronRight, TrendingUp, ExternalLink, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { decodeHtmlEntities } from '@/lib/utils';

function FeaturedPostItem({ post, showOrder, onClick }: { post: any; showOrder?: number; onClick?: (e: React.MouseEvent) => void }) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const hasImage = post.media && post.media.length > 0;

  const handleMouseEnter = () => {
    if (hasImage) setPreviewImageUrl(post.media[0].preview_url);
  };
  const handleMouseLeave = () => setPreviewImageUrl(null);

  const content = (
    <div className="flex items-start gap-3">
      {showOrder !== undefined ? (
        <span className="flex-shrink-0 w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
          {showOrder}
        </span>
      ) : post.is_pinned && post.pin_type === 'GLOBAL' ? (
        <Pin className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" aria-label="Ghim toàn cục" />
      ) : null}
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] sm:text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {decodeHtmlEntities(post.title)}
        </h4>
        <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
          {post.category && (
            <Badge variant="secondary" size="xs" className="font-semibold text-xs">
              {post.category.name}
            </Badge>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {post.view_count}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.comment_count}
          </span>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground/80 mt-1">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );

  // If onClick is provided (for pinned posts), use a button instead of a link
  const item = onClick ? (
    <button
      className="block w-full text-left p-3 rounded-xl hover:bg-muted/60 transition-all duration-200 group hover:translate-x-0.5"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {content}
    </button>
  ) : (
    <Link
      to={`/posts/${post.id}`}
      className="block p-3 rounded-xl hover:bg-muted/60 transition-all duration-200 group hover:translate-x-0.5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {content}
    </Link>
  );

  if (!hasImage) return item;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {item}
      </TooltipTrigger>
      {previewImageUrl && (
        <TooltipContent side="left" className="p-1">
          <img
            src={previewImageUrl}
            alt="Post image preview"
            className="max-h-48 max-w-xs rounded-lg object-contain"
          />
        </TooltipContent>
      )}
    </Tooltip>
  );
}

/**
 * Modal hiển thị NỘI DUNG chi tiết của một bài viết được ghim
 */
function PinnedPostContentDialog({ postId, open, onOpenChange }: { postId: number | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: post, isLoading } = usePost(postId || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base pr-6">
            <Pin className="h-4 w-4 text-primary flex-shrink-0" />
            {post ? (
              <span className="line-clamp-2">{decodeHtmlEntities(post.title)}</span>
            ) : (
              <span>Bài viết được ghim</span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs flex items-center gap-3 flex-wrap">
            {!isLoading && post && (
              <>
                {post.category && (
                  <Badge variant="secondary" size="xs">
                    {post.category.name}
                  </Badge>
                )}
                <span>{post.author?.display_name || post.author?.username}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}</span>
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {post.view_count}
                </span>
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />
                  {post.comment_count}
                </span>
              </>
            )}
            {isLoading && <span>Đang tải...</span>}
            {!isLoading && !post && <span>Không tìm thấy bài viết</span>}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : post ? (
          <>
            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="py-2">
                <MarkdownRenderer content={post.content || ''} />
              </div>
            </ScrollArea>
            <div className="flex justify-end pt-3 border-t border-border/40">
              <Link to={`/posts/${post.id}`} onClick={() => onOpenChange(false)}>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Xem bài viết đầy đủ
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Không thể tải nội dung
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RightSidebar() {
  const { data: featuredPosts, isLoading } = useFeaturedPosts(6);
  const { data: allFeaturedPosts } = useFeaturedPosts(20);
  const [showAllModal, setShowAllModal] = useState(false);
  // State cho dialog hiển thị nội dung bài viết ghim
  const [selectedPinnedPostId, setSelectedPinnedPostId] = useState<number | null>(null);
  const [showPinnedContent, setShowPinnedContent] = useState(false);

  // Separate pinned vs trending for modal display
  const pinnedPosts = allFeaturedPosts?.filter(p => p.is_pinned && p.pin_type === 'GLOBAL') ?? [];
  const trendingPosts = allFeaturedPosts?.filter(p => !(p.is_pinned && p.pin_type === 'GLOBAL')) ?? [];

  // Handle click on pinned post - show content dialog
  const handlePinnedPostClick = (postId: number) => {
    setSelectedPinnedPostId(postId);
    setShowPinnedContent(true);
  };

  return (
    <>
      <aside className="h-full overflow-y-auto scrollbar-gutter-stable animate-enter-right">
        <div className="flex flex-col h-full p-4 space-y-5">
          {/* Pinned/Featured Posts - Main content */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                <Pin className="h-4.5 w-4.5 text-primary flex-shrink-0" />
                <span className="truncate">Bài viết nổi bật</span>
              </h3>
            </div>
            
            <div className="space-y-1">
              {isLoading ? (
                // Loading skeleton
                [...Array(4)].map((_, i) => (
                  <div key={i} className="p-3 space-y-2 rounded-xl bg-muted/20">
                    <Skeleton className="h-5 w-full rounded-lg" />
                    <Skeleton className="h-4 w-2/3 rounded-md" />
                  </div>
                ))
              ) : featuredPosts && featuredPosts.length > 0 ? (
                featuredPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="animate-stagger"
                    style={{ '--stagger-index': index } as React.CSSProperties}
                  >
                    <FeaturedPostItem
                      post={post}
                      onClick={post.is_pinned && post.pin_type === 'GLOBAL'
                        ? (e: React.MouseEvent) => { e.preventDefault(); handlePinnedPostClick(post.id); }
                        : undefined
                      }
                    />
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Chưa có bài viết nổi bật
                </div>
              )}
            </div>

            {/* View all button */}
            {featuredPosts && featuredPosts.length > 0 && (
              <button
                onClick={() => setShowAllModal(true)}
                className="w-full px-4 py-3 text-sm sm:text-[15px] text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 font-semibold btn-press group"
              >
                Xem tất cả ({allFeaturedPosts?.length || featuredPosts.length})
                <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* All Featured Posts Modal */}
      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="sm:max-w-xl lg:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pin className="h-4 w-4 text-primary" />
              Bài viết nổi bật
            </DialogTitle>
            <DialogDescription className="text-xs">
              Các bài viết được ghim và nổi bật theo thứ tự ưu tiên
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            {/* Pinned Posts Section */}
            {pinnedPosts.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5 px-1">
                  <Pin className="h-3 w-3 text-primary" />
                  Bài viết được ghim ({pinnedPosts.length})
                </h4>
                <div className="space-y-1">
                  {pinnedPosts.map((post, index) => (
                    <div key={post.id}>
                      <FeaturedPostItem
                        post={post}
                        showOrder={index + 1}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          setShowAllModal(false);
                          handlePinnedPostClick(post.id);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Posts Section */}
            {trendingPosts.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5 px-1">
                  <TrendingUp className="h-3 w-3 text-orange-500" />
                  Bài viết thịnh hành ({trendingPosts.length})
                </h4>
                <div className="space-y-1">
                  {trendingPosts.map((post) => (
                    <div key={post.id} onClick={() => setShowAllModal(false)}>
                      <FeaturedPostItem post={post} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pinnedPosts.length === 0 && trendingPosts.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Chưa có bài viết nổi bật
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Pinned Post Content Dialog */}
      <PinnedPostContentDialog
        postId={selectedPinnedPostId}
        open={showPinnedContent}
        onOpenChange={setShowPinnedContent}
      />
    </>
  );
}
