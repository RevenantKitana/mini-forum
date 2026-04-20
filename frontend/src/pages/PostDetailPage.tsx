import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { CategoryColorIcon } from '@/components/common/CategoryColorIcon';
import { VoteScore } from '@/components/common/VoteScore';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { ROLE_CONFIG, AUTHOR_ROLE_MAP } from '@/constants/roles';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
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
  const queryClient = useQueryClient();
  const [replyToId, setReplyToId] = useState<number | undefined>();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [quotedCommentId, setQuotedCommentId] = useState<number | undefined>();
  const [quotedComment, setQuotedComment] = useState<Comment | undefined>();
  const [replyContent, setReplyContent] = useState<string>('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: number } | null>(null);
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
  const authorAvatar = post?.author?.avatar_url;

  return (
    <div className="animate-fade-in-up">
      {/* Post Card */}
      <Card className="animate-fade-in-scale">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3 text-center">
                {/* Status Badges (Pinned/Locked) */}
                {post.is_pinned && (
                  <Badge variant="default">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                {post.is_locked && (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
                
                {/* Category & Title */}
                {post.category && (
                  <Link to={`/?category=${post.category.slug}`} className="inline-flex items-center">
                    <Badge variant="outline" size="sm" className="font-bold sm:size-default">
                      {post.category.name}
                    </Badge>
                  </Link>
                )}
                {/* Category color indicator (postcard-like icon) */}
                {post.category?.color && (
                  <span className="inline-flex items-center">
                    <CategoryColorIcon
                      color={post.category.color}
                      name={post.category.name}
                    />
                  </span>
                )}
                <span className="text-muted-foreground/50 hidden sm:inline">»</span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold w-full sm:w-auto text-center">
                  {decodeHtmlEntities(post.title)}
                </h1>
              </div>
              {post.author && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
                  <Link
                    to={`/users/${post.author.username}`}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={authorAvatar || undefined} alt={authorDisplayName} />
                      <AvatarFallback>{authorDisplayName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium flex items-center gap-2">
                      {authorDisplayName}
                      {/* Role badge */}
                      {post.author?.role && (() => {
                        const roleKey = (AUTHOR_ROLE_MAP as any)[post.author.role as keyof typeof AUTHOR_ROLE_MAP];
                        const cfg = (ROLE_CONFIG as any)[roleKey];
                        if (!cfg) return null;
                        const Icon = cfg.icon as any;
                        return (
                          <Badge role={roleKey} variant="outline" size="xs" className="flex items-center gap-1">
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        );
                      })()}
                    </span>
                    <span className="text-muted-foreground/70">@{post.author.username}</span>
                  </Link>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.view_count} views</span>
                  </div>
                </div>
              )}
            </div>

            {canEdit && (
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)} className="btn-press hover:animate-wiggle">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeletePost} className="btn-press hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader> 

        <CardContent>

          <MarkdownRenderer content={post.content} />
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
              {post.tags.map((tag) => (
                <Link key={tag.id} to={`/?tag=${tag.slug}`}>
                  <Badge variant="secondary" size="sm">{tag.name}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t pt-2">
          {/* Mobile (<640px): 2 rows — vote+stats on top, actions below
              sm+(640px): single row, actions pushed to right */}
          <div className="w-full flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Row 1: Vote + Stats */}
            <div className="flex items-center gap-2 flex-wrap">
              <VoteButtons
                targetId={post.id}
                targetType="post"
                upvoteCount={post.upvote_count}
                downvoteCount={post.downvote_count}
                authorId={post.author_id}
                size="md"
                orientation="horizontal"
              />
              <VoteScore
                score={voteScore}
                upvoteCount={post.upvote_count}
                downvoteCount={post.downvote_count}
              />
              <Separator orientation="vertical" className="h-6 mx-1" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{post.comment_count} bình luận</span>
              </div>
            </div>

            {/* Row 2 (mobile) / Right side (sm+): Actions */}
            <div className="flex items-center gap-1 sm:ml-auto">
              <BookmarkButton postId={post.id} size="sm" showText showConfirmOnRemove />
              <Button variant="ghost" size="sm" className="btn-press" onClick={() => {
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
                  className="text-muted-foreground hover:text-destructive"
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
                    <Button className="mt-4" onClick={() => navigate('/login')}>
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
                  <Button onClick={() => navigate('/login')}>Đăng nhập</Button>
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
            <Card className="gap-1">
              <CardContent className="pt-3 pb-0">
                <form id="comment-form" onSubmit={handleSubmit(onSubmitComment)} className="space-y-0">
                  <div className="relative">
                    <Textarea
                      {...register('content')}
                      ref={(e) => {
                        register('content').ref(e);
                        (commentTextareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                      }}
                      placeholder="Viết bình luận của bạn..."
                      rows={2}
                      className="pr-10 input-focus-animate"
                    />
                    <div className="absolute right-2 bottom-2">
                      <EmojiPicker 
                        onEmojiSelect={handleInsertEmoji}
                        side="top"
                        align="end"
                      />
                    </div>
                  </div>
                  {errors.content && (
                    <p className="text-sm text-destructive animate-error-shake">{errors.content.message}</p>
                  )}
                </form>
              </CardContent>
              <CardFooter className="pb-1 pt-1">
                <Button form="comment-form" type="submit" className="btn-interactive" disabled={createCommentMutation.isPending}>
                  {createCommentMutation.isPending ? 'Đang đăng...' : 'Đăng bình luận'}
                </Button>
              </CardFooter>
            </Card>
          );
        })()}
        <div className="pt-1 pb-2 px-2 text-sm border-b flex items-center justify-between">
          {/* Comment Sort Dropdown */}
          {post.comment_count > 0 && (
            <Select value={commentSort} onValueChange={(v) => setCommentSort(v as typeof commentSort)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Quan tâm nhất</span>
                  </div>
                </SelectItem>
                <SelectItem value="latest">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Mới nhất</span>
                  </div>
                </SelectItem>
                <SelectItem value="oldest">
                  <div className="flex items-center gap-1">
                    <History className="h-4 w-4" />
                    <span>Cũ nhất</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        {/* Comments List */}
        {commentsLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : comments && comments.length > 0 ? (
          <div className="space-y-2">
            {comments.map((comment, index) => {
              // Calculate canComment for each comment/reply context
              const canCommentInCategory = checkPermissionLevel(
                user?.role,
                post.category?.comment_permission
              );
              
              return (
              <div
                key={comment.id}
                className="pt-0 mt-0 animate-stagger"
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
          <Card>
            <CardContent className="pt-5 text-center text-muted-foreground">
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
  
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  const voteScore = comment.upvote_count - comment.downvote_count;
  const authorDisplayName = comment.author?.display_name || comment.author?.username || 'Unknown';
  const authorAvatar = comment.author?.avatar_url;

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
    <div id={`comment-${comment.id}`} className={isReply ? 'ml-3 sm:ml-4 mt-1' : ''}>
      <Card
        className={
          isReply
            ? 'border border-border/60 bg-muted/45 shadow-none'
            : 'border border-border/70 shadow-sm'
        }
      >
        <CardContent className={isReply ? 'pt-1 !pb-0 space-y-0' : 'pt-1.8 !pb-1 space-y-0'}>
          {/* Quoted Comment - Clickable to scroll */}
          {comment.quotedComment && (
            <div 
              className={isReply
                ? 'mb-1 p-1 bg-muted/55 rounded border-l-2 border-primary/45 cursor-pointer hover:bg-muted/65 transition-colors'
                : 'mb-1 p-1 bg-muted rounded-lg border-l-4 border-primary cursor-pointer hover:bg-muted/80 transition-colors'}
              onClick={handleQuotedCommentClick}
              title="Click để xem bình luận gốc"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block max-w-[50%] whitespace-nowrap">Trả lời @{comment.quotedComment.author?.username || 'Unknown'}</span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {comment.quotedComment.author?.username || 'Unknown'}
                  </TooltipContent>
                </Tooltip>
                <span className="text-primary">↩</span>

                <div className="text-sm text-muted-foreground line-clamp-1">
                  <MarkdownRenderer content={comment.quotedComment.content} />
                </div>
              </div>

            </div>
          )}
          
          <div className={isReply ? 'flex gap-2' : 'flex gap-2 sm:gap-4'}>
            <div className={isReply ? 'flex-1 min-w-0 mb-1 mt-0' : 'flex-1 min-w-0 mb-1.5 mt-1.5'}>
              {comment.author && (
                <div className={isReply ? 'flex flex-wrap items-center gap-x-2 gap-y-1 mb-1' : 'flex flex-wrap items-center gap-x-2 gap-y-1 mb-2'}>
                  <Link to={`/users/${comment.author.username}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Avatar className={isReply ? 'h-5 w-5 flex-shrink-0' : 'h-6 w-6 flex-shrink-0'}>
                      <AvatarImage src={authorAvatar || undefined} alt={authorDisplayName} />
                      <AvatarFallback>{authorDisplayName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link to={`/users/${comment.author.username}`} className="inline-flex items-center font-medium hover:text-foreground transition-colors">
                      {authorDisplayName}
                    </Link>

                    {/* Role badge for comment author */}
                    {comment.author?.role && (() => {
                      const roleKey = (AUTHOR_ROLE_MAP as any)[comment.author.role as keyof typeof AUTHOR_ROLE_MAP];
                      const cfg = (ROLE_CONFIG as any)[roleKey];
                      if (!cfg) return null;
                      const Icon = cfg.icon as any;
                      return (
                        <Badge role={roleKey} variant="outline" size="xs" className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      );
                    })()}

                    <span className="text-muted-foreground/70 text-xs">@{comment.author.username}</span>
                  </div>

                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  {comment.is_edited && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">(đã chỉnh sửa)</span>
                  )}
                </div>
              )}

              {isEditing ? (
                <div className="space-y-2 animate-slide-expand">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full input-focus-animate"
                    placeholder="Chỉnh sửa bình luận..."
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button 
                      size="sm" 
                      className="btn-interactive"
                      onClick={handleSaveEdit}
                      disabled={updateCommentMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {updateCommentMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="btn-press"
                      onClick={handleCancelEdit}
                      disabled={updateCommentMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <MarkdownRenderer content={comment.content} className={isReply ? 'text-[0.92rem] leading-relaxed' : 'text-[0.95rem] leading-relaxed'} />
              )}

              {!isEditing && (
                <div className={isReply ? 'mt-2' : 'mt-3'}>
                  <div className={isReply ? 'flex items-center justify-between gap-2 flex-wrap' : 'flex items-center justify-between gap-2'}>
                    <div className="flex items-center gap-2">
                      <VoteButtons
                        targetId={comment.id}
                        targetType="comment"
                        upvoteCount={comment.upvote_count}
                        downvoteCount={comment.downvote_count}
                        authorId={comment.author_id}
                        size="sm"
                        orientation="horizontal"
                      />
                      <VoteScore
                        score={voteScore}
                        upvoteCount={comment.upvote_count}
                        downvoteCount={comment.downvote_count}
                      />
                      {!isReply && totalCommentCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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

                    <div className={isReply ? 'flex items-center gap-0.5 flex-wrap' : 'flex items-center gap-1'}>
                      {!isReply && canToggleReplies && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="btn-press text-muted-foreground"
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
                              Xem thêm phản hồi
                            </>
                          )}
                        </Button>
                      )}
                      {isAuthenticated && canComment && !isPostLocked && comment.status !== 'DELETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={isReply ? 'btn-press h-7 px-2 text-xs text-muted-foreground hover:text-foreground' : 'btn-press'}
                          onClick={() => onReply(comment)}
                        >
                          Trả lời
                        </Button>
                      )}
                      {canEdit && comment.status !== 'DELETED' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={isReply ? 'btn-press h-7 px-2 text-xs text-muted-foreground hover:text-foreground' : 'btn-press'}
                          onClick={() => setIsEditing(true)}
                          title={!isModOrAdmin && canEditTimeLimit ? `Còn ${getRemainingEditTime()} để chỉnh sửa` : undefined}
                        >
                          <Edit className={isReply ? 'h-3.5 w-3.5 mr-1' : 'h-4 w-4 mr-1'} />
                          Sửa
                        </Button>
                      )}
                      {canDelete && comment.status !== 'DELETED' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={isReply ? 'btn-press h-7 px-2 text-xs text-muted-foreground hover:text-destructive' : 'btn-press'}
                          onClick={handleDelete}
                          disabled={deleteCommentMutation.isPending}
                        >
                          <Trash2 className={isReply ? 'h-3.5 w-3.5 mr-1' : 'h-4 w-4 mr-1'} />
                          Xóa
                        </Button>
                      )}
                      {isAuthenticated && comment.status !== 'DELETED' && onReport && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onReport(comment.id)}
                          className={isReply ? 'text-muted-foreground hover:text-destructive btn-press h-7 px-2 text-xs' : 'text-muted-foreground hover:text-destructive btn-press'}
                        >
                          <Flag className={isReply ? 'h-3.5 w-3.5 mr-1' : 'h-4 w-4 mr-1'} />
                          Báo cáo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Inline Reply Form */}
              {isReplyingToThis && (
                <div className="mt-2 p-2 bg-muted/50 rounded-lg border animate-slide-expand">
                  {quotedComment && (
                    <div className="p-1 mb-1 bg-background rounded-lg border-l-4 border-primary">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          Trích dẫn từ <span className="font-medium">@{quotedComment.author?.username || 'Unknown'}</span>
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
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
                      className="mb-3 pr-10"
                    />
                    <div className="absolute right-2 bottom-5">
                      <EmojiPicker 
                        onEmojiSelect={(emoji) => setReplyContent(replyContent + emoji)}
                        side="top"
                        align="end"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="btn-interactive"
                      onClick={onSubmitReply}
                      disabled={isSubmittingReply}
                    >
                      {isSubmittingReply ? 'Đang gửi...' : 'Gửi trả lời'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="btn-press"
                      onClick={onCancelReply}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
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
    </div>
  );
}
