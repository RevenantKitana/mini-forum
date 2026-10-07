import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePost, useDeletePost } from '@/hooks/usePosts';
import { useComments, useCreateComment, useUpdateComment, useDeleteComment, Comment } from '@/hooks/useComments';
import { useCommentConfig } from '@/hooks/useConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/app/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Textarea } from '@/app/components/ui/textarea';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Separator } from '@/app/components/ui/separator';
import { VoteButtons } from '@/components/common/VoteButtons';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { ROLE_CONFIG, AUTHOR_ROLE_MAP } from '@/constants/roles';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { BlockRenderer } from '@/components/post/BlockRenderer';
import { ImageBlockScroller } from '@/components/post/ImageBlockScroller';
import { getAvatarUrl } from '@/utils/imageHelpers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowBigUp,
  ArrowBigDown,
  Bookmark,
  Edit,
  Trash2,
  Pin,
  Lock,
  Eye,
  MessageSquare,
  Share2,
  Flag,
  X,
  Check,
  TrendingUp,
  Clock,
  History,
  Reply,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useState, useRef, useMemo, useEffect } from 'react';
import { ReportModal } from '@/components/common/ReportModal';
import { PostFormDialog } from '@/components/common/PostFormDialog';
import { EmojiPicker } from '@/components/common/EmojiPicker';
import { AvatarPreviewModal } from '@/components/common/AvatarPreviewModal';
import { decodeHtmlEntities } from '@/lib/utils';

// Default fallback - will be overridden by config from API
const DEFAULT_COMMENT_EDIT_TIME_LIMIT_MINUTES = 30;
const DEFAULT_VISIBLE_REPLIES = 1;

// Permission labels for Vietnamese display
const permissionLabels: Record<string, string> = {
  MEMBER: 'thành viên',
  MODERATOR: 'điều hành viên',
  ADMIN: 'quản trị viên',
  BOT: 'bot',
};

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
});

type CommentFormData = z.infer<typeof commentSchema>;

// Helper function to check if user has required permission level
function checkPermissionLevel(
  userRole: string | undefined,
  requiredLevel: string | undefined
): boolean {
  if (!requiredLevel || requiredLevel === 'ALL') return true;
  if (!userRole) return false;

  const roleHierarchy = ['MEMBER', 'MODERATOR', 'ADMIN'];
  const effectiveRole = userRole.toUpperCase() === 'BOT' ? 'MEMBER' : userRole.toUpperCase();
  const userLevel = roleHierarchy.indexOf(effectiveRole);
  const requiredLevelIndex = roleHierarchy.indexOf(requiredLevel);

  return userLevel >= requiredLevelIndex;
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [replyToId, setReplyToId] = useState<number | undefined>();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [quotedCommentId, setQuotedCommentId] = useState<number | undefined>();
  const [quotedComment, setQuotedComment] = useState<Comment | undefined>();
  const [replyContent, setReplyContent] = useState<string>('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: number } | null>(null);
  const [authorAvatarModalOpen, setAuthorAvatarModalOpen] = useState(false);
  const [commentSort, setCommentSort] = useState<'popular' | 'latest' | 'oldest'>('popular');
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch dynamic comment edit time limit from backend
  const { data: commentConfig } = useCommentConfig();
  const commentEditTimeLimit = commentConfig?.editTimeLimit ?? DEFAULT_COMMENT_EDIT_TIME_LIMIT_MINUTES;

  const { data: postData, isLoading: postLoading, error: postError } = usePost(id!);
  const post = postData;

  // Trim leading/trailing whitespace to avoid large blank paragraphs
  const sanitizeContent = (s?: string | null) => (typeof s === 'string' ? s.trim() : s);

  const { data: commentsData, isLoading: commentsLoading } = useComments(id!, { sort: commentSort });
  const comments = commentsData?.data || [];

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const createCommentMutation = useCreateComment(id!);
  const deletePostMutation = useDeletePost();

  // Watch comment content for emoji insertion
  const commentContent = watch('content', '');

  // Insert emoji at cursor position or end of textarea
  const handleInsertEmoji = (emoji: string) => {
    const textarea = commentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = commentContent.slice(0, start) + emoji + commentContent.slice(end);
      setValue('content', newValue);
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setValue('content', commentContent + emoji);
    }
  };

  const onSubmitComment = (data: CommentFormData) => {
    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }
    createCommentMutation.mutate(
      { content: data.content },
      {
        onSuccess: () => {
          reset();
          queryClient.invalidateQueries({ queryKey: ['comments', id] });
          queryClient.invalidateQueries({ queryKey: ['post', id] });
        },
        onError: () => {
          toast.error('Failed to post comment');
        },
      }
    );
  };

  // Handler for submitting reply
  const handleSubmitReply = () => {
    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }
    if (!replyContent.trim()) {
      toast.error('Nội dung không được để trống');
      return;
    }
    createCommentMutation.mutate(
      { 
        content: replyContent, 
        parent_id: replyToId, 
        quoted_comment_id: quotedCommentId 
      },
      {
        onSuccess: () => {
          setReplyContent('');
          setReplyToId(undefined);
          setQuotedCommentId(undefined);
          setQuotedComment(undefined);
          queryClient.invalidateQueries({ queryKey: ['comments', id] });
          queryClient.invalidateQueries({ queryKey: ['post', id] });
        },
        onError: () => {
          toast.error('Không thể đăng trả lời');
        },
      }
    );
  };

  const handleDeletePost = () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    deletePostMutation.mutate(id!, {
      onSuccess: () => {
        toast.success('Post deleted');
        navigate('/');
      },
      onError: () => {
        toast.error('Failed to delete post');
      },
    });
  };

  if (postLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (postError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Post not found</h2>
        <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Post not found</h2>
        <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </div>
    );
  }

  const canEdit = user && (user.id === post?.author_id || user.role === 'ADMIN' || user.role === 'MODERATOR');
  
  const voteScore = post ? post.upvote_count - post.downvote_count : 0;
  const authorDisplayName = post?.author?.display_name || post?.author?.username || 'Unknown';
  const authorAvatar = getAvatarUrl(post?.author, 'preview');

  return (
    <div className="max-w-5xl xl:max-w-6xl mx-auto py-4 px-4 sm:px-6 md:px-8 space-y-6 animate-fade-in-up">
      {/* Post Card */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)] p-6 sm:p-8 space-y-5">
        <CardHeader className="p-0 pb-2">
          {/* Breadcrumb & Category */}
          <div className="flex items-center justify-between gap-2.5 mb-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to="/" className="hover:text-foreground transition-colors font-medium">Trang chủ</Link>
              <span>/</span>
              {post.category && (
                <Link
                  to={`/?category=${post.category.slug}`}
                  className="font-bold text-xs sm:text-sm text-foreground uppercase tracking-wider hover:text-primary transition-colors inline-flex items-center gap-1.5"
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
            </div>

            <div className="flex items-center gap-2">
              {post.is_pinned && (
                <Badge variant="default" size="xs" className="rounded-md font-semibold px-2 py-0.5">
                  <Pin className="h-3.5 w-3.5 mr-1" />
                  Ghim
                </Badge>
              )}
              {post.is_locked && (
                <Badge variant="secondary" size="xs" className="rounded-md font-semibold px-2 py-0.5">
                  <Lock className="h-3.5 w-3.5 mr-1" />
                  Đã khóa
                </Badge>
              )}
            </div>
          </div>

          {/* Post Title */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-snug tracking-tight text-foreground flex-1">
              {decodeHtmlEntities(post.title)}
            </h1>

            {canEdit && (
              <div className="flex gap-1.5 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)} className="btn-press h-9 px-3 text-xs sm:text-sm font-semibold rounded-xl">
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Sửa</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeletePost} className="btn-press hover:text-destructive h-9 px-3 text-xs sm:text-sm font-semibold rounded-xl">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Author & Meta Row */}
          {post.author && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground pt-4 border-t border-border/40">
              <Link
                to={`/users/${post.author.username}`}
                className="flex items-center gap-2.5 hover:text-foreground transition-colors group/author"
              >
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthorAvatarModalOpen(true); }}
                  className="rounded-full flex-shrink-0"
                  aria-label={`Xem ảnh đại diện của ${authorDisplayName}`}
                >
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-1 ring-border/50 transition-transform group-hover/author:scale-105">
                    <AvatarImage src={authorAvatar || undefined} alt={authorDisplayName} />
                    <AvatarFallback className="text-xs font-semibold">{authorDisplayName[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
                <span className="font-semibold text-sm sm:text-base text-foreground">
                  {authorDisplayName}
                </span>
                {post.author?.role && (() => {
                  const roleKey = (AUTHOR_ROLE_MAP as any)[post.author.role as keyof typeof AUTHOR_ROLE_MAP];
                  const cfg = (ROLE_CONFIG as any)[roleKey];
                  if (!cfg || roleKey === 'MEMBER') return null;
                  return (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {cfg.label}
                    </span>
                  );
                })()}
              </Link>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.view_count} lượt xem</span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          {/* Block layout content */}
          {post.blocks && post.blocks.length > 0 ? (
            <BlockRenderer blocks={post.blocks} />
          ) : null}

          {/* Images uploaded in non-block mode (block_id = null, not linked to any block) */}
          {(() => {
            const blockMediaIds = new Set(
              (post.blocks || []).flatMap((b) => (b.media || []).map((m) => m.id))
            );
            const orphanMedia = (post.media || []).filter((m) => !blockMediaIds.has(m.id));
            return orphanMedia.length > 0 ? (
              <ImageBlockScroller images={orphanMedia} className="mt-4" />
            ) : null;
          })()}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((tag) => (
                <Link key={tag.id} to={`/?tag=${tag.slug}`}>
                  <Badge variant="secondary" size="sm" className="text-xs sm:text-sm px-3.5 py-1.5 rounded-xl font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                    #{tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-border/40 pt-4 p-0">
          <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Row 1: Vote + Stats */}
            <div className="flex items-center gap-4 flex-wrap">
              <VoteButtons
                targetId={post.id}
                targetType="post"
                upvoteCount={post.upvote_count}
                downvoteCount={post.downvote_count}
                authorId={post.author_id}
                size="md"
                orientation="horizontal"
              />
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground font-medium">
                <MessageSquare className="h-4 w-4" />
                <span>{post.comment_count} bình luận</span>
              </div>
            </div>

            {/* Row 2 (mobile) / Right side (sm+): Actions */}
            <div className="flex items-center gap-2 sm:ml-auto">
              <BookmarkButton postId={post.id} size="sm" showText showConfirmOnRemove />
              <Button variant="ghost" size="sm" className="btn-press h-10 px-3.5 text-xs sm:text-sm font-semibold rounded-xl" onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard');
              }}>
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Chia sẻ</span>
              </Button>
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReportTarget({ type: 'post', id: post.id });
                    setReportModalOpen(true);
                  }}
                  className="text-muted-foreground hover:text-destructive btn-press h-10 px-3.5 text-xs sm:text-sm font-semibold rounded-xl"
                >
                  <Flag className="h-4 w-4" />
                  <span className="hidden min-[480px]:inline ml-1.5">Báo cáo</span>
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Comments Section */}
      <div className="space-y-1">

        {/* Comment Form - for root comments only */}
        {(() => {
          // Check if locked
          if (post.is_locked) {
            return (
              <Card className="bg-muted/50 border-orange-200 dark:border-orange-800">
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Bài viết này đã bị khóa bình luận</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Bạn không thể thêm bình luận mới vào bài viết này.
                  </p>
                </CardContent>
              </Card>
            );
          }

          // Check comment permission based on category
          const commentPermission = post.category?.comment_permission;
          const hasCommentPermission = checkPermissionLevel(user?.role, commentPermission);

          // Not logged in
          if (!isAuthenticated) {
            // If comment requires login (not ALL)
            if (commentPermission && commentPermission !== 'ALL') {
              return (
                <Card className="bg-muted/50 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                      <Lock className="h-5 w-5" />
                      <span className="font-medium">Đăng nhập để bình luận</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Danh mục này yêu cầu quyền {permissionLabels[commentPermission] || commentPermission} trở lên để bình luận.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate('/login', { state: { from: location } })}
                    >
                      Đăng nhập
                    </Button>
                  </CardContent>
                </Card>
              );
            }
            // Default login prompt for ALL
            return (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để bình luận</p>
                  <Button onClick={() => navigate('/login', { state: { from: location } })}>Đăng nhập</Button>
                </CardContent>
              </Card>
            );
          }

          // Logged in but no permission
          if (!hasCommentPermission && commentPermission) {
            return (
              <Card className="bg-muted/50 border-orange-200 dark:border-orange-800">
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Bạn không có quyền bình luận</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Danh mục này yêu cầu quyền {permissionLabels[commentPermission] || commentPermission} trở lên để bình luận.
                  </p>
                </CardContent>
              </Card>
            );
          }

          // Has permission - show comment form
          return (
            <Card className="rounded-2xl border-0 bg-card shadow-xs p-5 space-y-3">
              <form id="comment-form" onSubmit={handleSubmit(onSubmitComment)} className="space-y-3">
                <div className="relative">
                  <Textarea
                    {...register('content')}
                    ref={(e) => {
                      register('content').ref(e);
                      (commentTextareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                    }}
                    placeholder="Viết bình luận của bạn..."
                    rows={3}
                    className="pr-12 text-sm sm:text-base rounded-xl bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-ring/30 p-3.5 input-focus-animate resize-y min-h-[90px]"
                  />
                  <div className="absolute right-3 bottom-3">
                    <EmojiPicker 
                      onEmojiSelect={handleInsertEmoji}
                      side="top"
                      align="end"
                    />
                  </div>
                </div>
                {errors.content && (
                  <p className="text-sm text-destructive animate-error-shake font-medium">{errors.content.message}</p>
                )}
                <div className="flex justify-end pt-1">
                  <Button form="comment-form" type="submit" className="btn-interactive h-10 px-5 text-sm sm:text-base font-semibold rounded-xl" disabled={createCommentMutation.isPending}>
                    {createCommentMutation.isPending ? 'Đang đăng...' : 'Đăng bình luận'}
                  </Button>
                </div>
              </form>
            </Card>
          );
        })()}
        
        <div className="pt-4 pb-2 px-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold">Bình luận</h3>
            <span className="text-sm text-muted-foreground font-mono font-medium">({post.comment_count})</span>
          </div>

          {/* Comment Sort Dropdown */}
          {post.comment_count > 0 && (
            <Select value={commentSort} onValueChange={(v) => setCommentSort(v as typeof commentSort)}>
              <SelectTrigger className="w-[170px] h-9 text-xs sm:text-sm font-semibold rounded-xl bg-muted/50 border-0">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-1.5 font-medium">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span>Quan tâm nhất</span>
                  </div>
                </SelectItem>
                <SelectItem value="latest">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Mới nhất</span>
                  </div>
                </SelectItem>
                <SelectItem value="oldest">
                  <div className="flex items-center gap-1.5 font-medium">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span>Cũ nhất</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Comments List */}
        {commentsLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : comments && comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment, index) => {
              // Calculate canComment for each comment/reply context
              const canCommentInCategory = checkPermissionLevel(
                user?.role,
                post.category?.comment_permission
              );
              
              return (
              <div
                key={comment.id}
                className="animate-stagger"
                style={{ '--stagger-index': index } as React.CSSProperties}
              >
              <CommentItem
                comment={comment}
                postId={id!}
                threadIndex={index}
                isPostLocked={post.is_locked}
                canComment={isAuthenticated && canCommentInCategory}
                commentEditTimeLimit={commentEditTimeLimit}
                onReply={(c: Comment) => {
                  setReplyToId(c.id);
                  setReplyContent('');
                  // Always auto-quote the content when replying to a comment
                  setQuotedCommentId(c.id);
                  setQuotedComment(c);
                }}
                replyToId={replyToId}
                quotedComment={quotedComment}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onSubmitReply={handleSubmitReply}
                onCancelReply={() => {
                  setReplyToId(undefined);
                  setQuotedCommentId(undefined);
                  setQuotedComment(undefined);
                  setReplyContent('');
                }}
                isSubmittingReply={createCommentMutation.isPending}
                onScrollToComment={(commentId) => {
                  const element = document.getElementById(`comment-${commentId}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'animate-highlight-flash');
                    setTimeout(() => {
                      element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'animate-highlight-flash');
                    }, 2000);
                  }
                }}
                onReport={(commentId: number) => {
                  setReportTarget({ type: 'comment', id: commentId });
                  setReportModalOpen(true);
                }}
              />
              </div>
            );
            })}
          </div>
        ) : (
          <Card className="rounded-2xl border-0 bg-card shadow-xs">
            <CardContent className="py-12 text-center text-sm sm:text-base text-muted-foreground">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetName={reportTarget.type === 'post' ? post?.title : undefined}
        />
      )}

      {/* Post Author Avatar Preview Modal */}
      {post?.author && (
        <AvatarPreviewModal
          isOpen={authorAvatarModalOpen}
          onClose={() => setAuthorAvatarModalOpen(false)}
          user={post.author}
        />
      )}

      {/* Edit Post Dialog */}
      {post && (
        <PostFormDialog
          mode="edit"
          postId={post.id}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['post', id] });
          }}
        />
      )}
    </div>
  );
}

// Comment Item Component
interface CommentItemProps {
  comment: Comment;
  postId: string;
  threadIndex?: number;
  isPostLocked?: boolean;
  canComment?: boolean; // Whether user has permission to comment in this category
  commentEditTimeLimit: number; // Dynamic edit time limit from backend config
  onReply: (comment: Comment) => void;
  isReply?: boolean;
  // Props for inline reply form
  replyToId?: number;
  quotedComment?: Comment;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
  isSubmittingReply: boolean;
  onScrollToComment?: (commentId: string) => void;
  onReport?: (commentId: number) => void;
}

function CommentItem({ 
  comment, 
  postId,
  threadIndex = 0,
  isPostLocked = false,
  canComment = true,
  commentEditTimeLimit,
  onReply, 
  isReply = false,
  replyToId,
  quotedComment,
  replyContent,
  setReplyContent,
  onSubmitReply,
  onCancelReply,
  isSubmittingReply,
  onScrollToComment,
  onReport,
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  const isReplyingToThis = replyToId === comment.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isRepliesExpanded, setIsRepliesExpanded] = useState(false);
  // Phase 2 UC-02: Avatar preview modal
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  const voteScore = comment.upvote_count - comment.downvote_count;
  const authorDisplayName = comment.author?.display_name || comment.author?.username || 'Unknown';
  const authorAvatar = getAvatarUrl(comment.author, 'preview');

  // Check if comment can still be edited (within time limit)
  const commentAge = Date.now() - new Date(comment.created_at).getTime();
  const canEditTimeLimit = commentAge < commentEditTimeLimit * 60 * 1000;
  const isCommentAuthor = user && (Number(user.id) === comment.author_id || user.id === comment.author_id);
  const isModOrAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const canEdit = isCommentAuthor && (canEditTimeLimit || isModOrAdmin);
  const canDelete = isCommentAuthor || isModOrAdmin;
  const threadToneIndex = Math.abs(threadIndex) % 4;
  const threadTones = [
    {
      rootBorder: 'border-l-sky-500/50',
      rootRing: 'ring-sky-500/20',
      replyBorder: 'border-sky-500/35',
    },
    {
      rootBorder: 'border-l-emerald-500/50',
      rootRing: 'ring-emerald-500/20',
      replyBorder: 'border-emerald-500/35',
    },
    {
      rootBorder: 'border-l-amber-500/50',
      rootRing: 'ring-amber-500/20',
      replyBorder: 'border-amber-500/35',
    },
    {
      rootBorder: 'border-l-rose-500/50',
      rootRing: 'ring-rose-500/20',
      replyBorder: 'border-rose-500/35',
    },
  ] as const;
  const threadTone = threadTones[threadToneIndex];

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      toast.error('Bình luận không thể trống');
      return;
    }
    
    updateCommentMutation.mutate(
      { id: comment.id, data: { content: editContent } },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to update comment');
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    
    deleteCommentMutation.mutate(
      { id: comment.id, postId },
      {
        onSuccess: () => {

        },
        onError: () => {
          toast.error('Failed to delete comment');
        },
      }
    );
  };

  // Calculate remaining edit time
  const getRemainingEditTime = () => {
    const remaining = (commentEditTimeLimit * 60 * 1000) - commentAge;
    if (remaining <= 0) return null;
    const minutes = Math.floor(remaining / 60000);
    return `${minutes} phút`;
  };

  // Handle click on quoted comment to scroll
  const handleQuotedCommentClick = () => {
    if (comment.quotedComment && onScrollToComment) {
      onScrollToComment(String(comment.quotedComment.id));
    }
  };

  const replies = !isReply && comment.replies ? comment.replies : [];
  const totalCommentCount = !isReply ? replies.length : 0;
  const totalReplyCount = !isReply
    ? replies.filter((reply) => {
        const quotedCommentId = reply.quoted_comment_id ?? reply.quotedComment?.id ?? null;
        return quotedCommentId === Number(comment.id);
      }).length
    : 0;
  const hasReplies = replies.length > 0;
  const visibleReplies = isRepliesExpanded ? replies : replies.slice(0, DEFAULT_VISIBLE_REPLIES);
  const hiddenRepliesCount = Math.max(0, replies.length - visibleReplies.length);
  const canToggleReplies = replies.length > DEFAULT_VISIBLE_REPLIES;

  // Auto-expand if the active reply target is currently hidden.
  useEffect(() => {
    if (isReply || !replyToId || isRepliesExpanded || !hasReplies) return;
    const containsReplyTarget = replies
      .slice(DEFAULT_VISIBLE_REPLIES)
      .some((reply) => reply.id === replyToId);
    if (containsReplyTarget) {
      setIsRepliesExpanded(true);
    }
  }, [isReply, replyToId, isRepliesExpanded, hasReplies, replies]);

  return (
    <div id={`comment-${comment.id}`} className={isReply ? 'ml-3 sm:ml-6 mt-2' : ''}>
      <Card
        className={
          isReply
            ? 'rounded-2xl border-0 bg-muted/30 shadow-none p-4 sm:p-5 transition-all hover:bg-muted/50'
            : 'rounded-2xl border-0 bg-card shadow-xs p-5 sm:p-6 transition-all hover:shadow-md'
        }
      >
        <div className="space-y-2.5">
          {/* Quoted Comment - Clickable to scroll */}
          {comment.quotedComment && (
            <div 
              className="mb-2 p-3 bg-muted/60 rounded-xl border-l-4 border-primary cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={handleQuotedCommentClick}
              title="Click để xem bình luận gốc"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-semibold text-foreground truncate max-w-[50%]">Trả lời @{comment.quotedComment.author?.username || 'Unknown'}</span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {comment.quotedComment.author?.username || 'Unknown'}
                  </TooltipContent>
                </Tooltip>
                <span className="text-primary font-bold">↩</span>

                <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                  <MarkdownRenderer content={comment.quotedComment.content} />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 sm:gap-4 items-start">
            <div className="flex-1 min-w-0">
              {comment.author && (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-2">
                  <Link to={`/users/${comment.author.username}`} className="flex items-center gap-2 hover:text-foreground transition-colors group/author">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAvatarModalOpen(true); }}
                      className="rounded-full ring-1 ring-border/40 hover:ring-primary transition-all duration-200 flex-shrink-0"
                      aria-label={`Xem ảnh đại diện của ${authorDisplayName}`}
                    >
                      <Avatar className={isReply ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-7 w-7 sm:h-8 sm:w-8'}>
                        <AvatarImage src={authorAvatar || undefined} alt={authorDisplayName} />
                        <AvatarFallback className="text-xs font-semibold">{authorDisplayName[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </button>
                  </Link>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/users/${comment.author.username}`} className="inline-flex items-center font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors">
                      {authorDisplayName}
                    </Link>

                    {/* Role badge for comment author */}
                    {comment.author?.role && (() => {
                      const roleKey = (AUTHOR_ROLE_MAP as any)[comment.author.role as keyof typeof AUTHOR_ROLE_MAP];
                      const cfg = (ROLE_CONFIG as any)[roleKey];
                      if (!cfg) return null;
                      const Icon = cfg.icon as any;
                      return (
                        <Badge role={roleKey} variant="outline" size="xs" className="flex items-center gap-1 rounded-md text-[10px]">
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      );
                    })()}

                    <span className="text-muted-foreground/70 text-xs sm:text-sm font-medium">@{comment.author.username}</span>
                  </div>

                  <span className="text-muted-foreground/40 font-bold">•</span>

                  <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  {comment.is_edited && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 italic">(đã sửa)</span>
                  )}
                </div>
              )}

              {isEditing ? (
                <div className="space-y-3 animate-slide-expand pt-1">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full text-sm sm:text-base rounded-xl bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-ring/30 p-3.5 input-focus-animate"
                    placeholder="Chỉnh sửa bình luận..."
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button 
                      size="sm" 
                      className="btn-interactive h-9 px-4 text-xs sm:text-sm font-semibold rounded-xl"
                      onClick={handleSaveEdit}
                      disabled={updateCommentMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {updateCommentMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="btn-press h-9 px-4 text-xs sm:text-sm font-semibold rounded-xl"
                      onClick={handleCancelEdit}
                      disabled={updateCommentMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm sm:text-base leading-relaxed text-foreground/90 pt-0.5">
                  <MarkdownRenderer content={comment.content} />
                </div>
              )}

              {!isEditing && (
                <div className="mt-3 pt-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <VoteButtons
                        targetId={comment.id}
                        targetType="comment"
                        upvoteCount={comment.upvote_count}
                        downvoteCount={comment.downvote_count}
                        authorId={comment.author_id}
                        size="sm"
                        orientation="horizontal"
                      />
                      {!isReply && totalCommentCount > 0 && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
                          <span className="inline-flex items-center gap-1" title="Reply count">
                            <Reply className="h-3.5 w-3.5" />
                            <span>{totalReplyCount}</span>
                          </span>
                          <span className="inline-flex items-center gap-1" title="Comment count">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{totalCommentCount}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {!isReply && canToggleReplies && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="btn-press text-xs sm:text-sm text-muted-foreground hover:text-foreground font-semibold rounded-xl h-8 sm:h-9 px-3"
                          onClick={() => setIsRepliesExpanded((prev) => !prev)}
                        >
                          {isRepliesExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Thu gọn
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Xem thêm phản hồi ({hiddenRepliesCount})
                            </>
                          )}
                        </Button>
                      )}
                      {isAuthenticated && canComment && !isPostLocked && comment.status !== 'DELETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="btn-press text-xs sm:text-sm font-semibold rounded-xl h-8 sm:h-9 px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => onReply(comment)}
                        >
                          Trả lời
                        </Button>
                      )}
                      {canEdit && comment.status !== 'DELETED' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="btn-press text-xs sm:text-sm font-semibold rounded-xl h-8 sm:h-9 px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setIsEditing(true)}
                          title={!isModOrAdmin && canEditTimeLimit ? `Còn ${getRemainingEditTime()} để chỉnh sửa` : undefined}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Sửa
                        </Button>
                      )}
                      {canDelete && comment.status !== 'DELETED' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="btn-press text-xs sm:text-sm font-semibold rounded-xl h-8 sm:h-9 px-3 text-muted-foreground hover:text-destructive"
                          onClick={handleDelete}
                          disabled={deleteCommentMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Xóa
                        </Button>
                      )}
                      {isAuthenticated && comment.status !== 'DELETED' && onReport && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onReport(comment.id)}
                          className={isReply ? 'text-muted-foreground hover:text-destructive btn-press h-8 px-2.5 text-xs rounded-xl' : 'text-muted-foreground hover:text-destructive btn-press h-8 sm:h-9 px-3 text-xs sm:text-sm font-semibold rounded-xl'}
                        >
                          <Flag className="h-3.5 w-3.5 mr-1" />
                          Báo cáo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Inline Reply Form */}
              {isReplyingToThis && (
                <div className="mt-3 p-3.5 bg-muted/40 rounded-2xl border-0 animate-slide-expand space-y-3">
                  {quotedComment && (
                    <div className="p-2.5 bg-background rounded-xl border-l-4 border-primary">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          Trích dẫn từ <span className="font-semibold text-foreground">@{quotedComment.author?.username || 'Unknown'}</span>
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                        {quotedComment.content}
                      </p>
                    </div>
                  )}
                  <div className="relative">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Viết trả lời của bạn..."
                      rows={3}
                      className="pr-12 text-sm sm:text-base rounded-xl bg-background border-0 focus-visible:ring-1 focus-visible:ring-ring/30 p-3 input-focus-animate"
                    />
                    <div className="absolute right-3 bottom-3">
                      <EmojiPicker 
                        onEmojiSelect={(emoji) => setReplyContent(replyContent + emoji)}
                        side="top"
                        align="end"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      size="sm" 
                      className="btn-interactive h-9 px-4 text-xs sm:text-sm font-semibold rounded-xl"
                      onClick={onSubmitReply}
                      disabled={isSubmittingReply}
                    >
                      {isSubmittingReply ? 'Đang gửi...' : 'Gửi trả lời'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="btn-press h-9 px-4 text-xs sm:text-sm font-semibold rounded-xl"
                      onClick={onCancelReply}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Level 1 Replies - Only render if this is a root comment (not a reply) */}
      {!isReply && hasReplies && (
        <div className={`mt-1 ml-2 sm:ml-3 pl-3 space-y-1 border-l border-dashed ${threadTone.replyBorder}`}>
          {visibleReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              threadIndex={threadIndex}
              isPostLocked={isPostLocked}
              canComment={canComment}
              commentEditTimeLimit={commentEditTimeLimit}
              onReply={onReply}
              isReply={true}
              replyToId={replyToId}
              quotedComment={quotedComment}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              isSubmittingReply={isSubmittingReply}
              onScrollToComment={onScrollToComment}
              onReport={onReport}
            />
          ))}
        </div>
      )}

      {/* Phase 2 UC-02: Avatar Preview Modal for comment author */}
      {comment.author && (
        <AvatarPreviewModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          user={comment.author}
        />
      )}
    </div>
  );
}
