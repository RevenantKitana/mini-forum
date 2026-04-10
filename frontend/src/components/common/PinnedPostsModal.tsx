import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFeaturedPosts, usePost } from '@/hooks/usePosts';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Pin, Eye, MessageSquare, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { decodeHtmlEntities } from '@/lib/utils';

// Key for storing last shown timestamp
const PINNED_MODAL_LAST_SHOWN_KEY = 'pinned_posts_modal_last_shown';
// Minimum interval between showing the modal (in milliseconds) - 10 minutes
const MODAL_COOLDOWN_MS = 10 * 60 * 1000;

/**
 * Component hiển thị NỘI DUNG chi tiết của bài viết ghim trong dialog
 * Hỗ trợ chuyển bài khi có nhiều bài ghim
 */
function PinnedPostContent({ postId }: { postId: number }) {
  const { data: post, isLoading } = usePost(postId);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Không tìm thấy bài viết
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base pr-6">
          <Pin className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="line-clamp-2">{decodeHtmlEntities(post.title)}</span>
        </DialogTitle>
        <DialogDescription className="text-xs flex items-center gap-3 flex-wrap">
          {post.category && (
            <Badge variant="secondary" size="xs">
              {post.category.name}
            </Badge>
          )}
          <span>{post.author?.displayName || post.author?.username}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}</span>
          <span className="flex items-center gap-0.5">
            <Eye className="h-3 w-3" />
            {post.viewCount}
          </span>
          <span className="flex items-center gap-0.5">
            <MessageSquare className="h-3 w-3" />
            {post.commentCount}
          </span>
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[55vh] pr-2">
        <div className="py-2">
          <MarkdownRenderer content={post.content || ''} />
        </div>
      </ScrollArea>
    </>
  );
}

export function PinnedPostsModal() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: featuredPosts } = useFeaturedPosts(20);

  // Filter only globally pinned posts
  const pinnedPosts = featuredPosts?.filter(
    (p: any) => p.isPinned && p.pinType === 'GLOBAL'
  ) ?? [];

  const shouldShowModal = useCallback(() => {
    if (!isAuthenticated) return false;
    if (pinnedPosts.length === 0) return false;

    const lastShown = localStorage.getItem(PINNED_MODAL_LAST_SHOWN_KEY);
    if (!lastShown) return true;

    const elapsed = Date.now() - parseInt(lastShown, 10);
    return elapsed >= MODAL_COOLDOWN_MS;
  }, [isAuthenticated, pinnedPosts.length]);

  // Show modal when navigating to homepage after cooldown
  useEffect(() => {
    if (location.pathname !== '/') return;

    // Small delay to avoid showing immediately on page load
    const timer = setTimeout(() => {
      if (shouldShowModal()) {
        setCurrentIndex(0);
        setOpen(true);
        localStorage.setItem(PINNED_MODAL_LAST_SHOWN_KEY, Date.now().toString());
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [location.pathname, shouldShowModal]);

  // Also show on login (isAuthenticated transition)
  useEffect(() => {
    if (!isAuthenticated) return;

    // When user just logged in and is on homepage
    if (location.pathname === '/') {
      const timer = setTimeout(() => {
        if (shouldShowModal()) {
          setCurrentIndex(0);
          setOpen(true);
          localStorage.setItem(PINNED_MODAL_LAST_SHOWN_KEY, Date.now().toString());
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated || pinnedPosts.length === 0) {
    return null;
  }

  const currentPost = pinnedPosts[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < pinnedPosts.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        {currentPost ? (
          <PinnedPostContent postId={currentPost.id} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Pin className="h-4 w-4 text-primary" />
                Bài viết nổi bật
              </DialogTitle>
              <DialogDescription>Đang tải bài viết...</DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center text-sm text-muted-foreground">
              <div className="animate-spin inline-flex items-center justify-center h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          </>
        )}
        
        {/* Footer: navigation + view full post */}
        <div className="flex items-center justify-between pt-2 border-t">
          {/* Pagination controls (only if multiple pinned posts) */}
          {pinnedPosts.length > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={!hasPrev}
                onClick={() => setCurrentIndex(i => i - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[4rem] text-center">
                {currentIndex + 1} / {pinnedPosts.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={!hasNext}
                onClick={() => setCurrentIndex(i => i + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Đóng
            </Button>
            {currentPost && (
              <Link to={`/posts/${currentPost.id}`} onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Xem đầy đủ
                </Button>
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
