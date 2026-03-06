import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { Post } from '@/api/services/postService';
import { Card, CardContent, CardFooter, CardHeader } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { VoteButtons } from '@/components/common/VoteButtons';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { MessageSquare, Eye, Pin, Lock, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Decode HTML entities recursively to handle double-encoding
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  let decoded = text;
  let prevDecoded = '';
  
  // Keep decoding until no more changes (handles double/triple encoding)
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
  const voteScore = post.upvoteCount - post.downvoteCount;
  const authorDisplayName = post.author?.displayName || post.author?.username || 'Unknown';
  const authorAvatar = post.author?.avatarUrl;
  
  // Determine author badge based on role
  const getAuthorBadge = () => {
    if (!post.author) return null;
    switch (post.author.role) {
      case 'ADMIN':
        return <Badge variant="destructive" className="gap-1 text-responsive-xs"><Shield className="h-3 w-3" /> Admin</Badge>;
      case 'MODERATOR':
        return <Badge variant="default" className="gap-1 bg-blue-600 text-responsive-xs"><Shield className="h-3 w-3" /> Mod</Badge>;
      default:
        return null;
    }
  };

  // Decode HTML entities in title and excerpt to fix &quot; display issue
  const decodedTitle = useMemo(() => decodeHtmlEntities(post.title || ''), [post.title]);
  const decodedExcerpt = useMemo(() => {
    const text = post.excerpt || (post.content ? post.content.substring(0, 200) + '...' : '');
    return decodeHtmlEntities(text);
  }, [post.excerpt, post.content]);

  return (
    <Card className="card-hover-lift border-l-4 border-l-transparent hover:border-l-primary transition-all duration-200 flex flex-col">
      <CardHeader className="pb-2 md:pb-3">
        {/* Title & Status Row */}
        <div className="space-y-2 mb-1">
          <div className="flex items-start gap-2 flex-wrap">
            {post.isPinned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-shrink-0">
                    <Pin className={`h-4 w-4 ${post.pinType === 'GLOBAL' ? 'text-primary' : 'text-orange-500'}`} />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {post.pinType === 'GLOBAL' ? 'Ghim toàn cục' : 'Ghim trong danh mục'}
                </TooltipContent>
              </Tooltip>
            )}
            {post.isLocked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-shrink-0">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Bài viết đã khóa
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <Link to={`/posts/${post.id}`} className="block group">
            <div className="flex items-start gap-2">
              {/* Category color indicator */}
              {post.category?.color && (
                <span
                  className="flex-shrink-0 mt-1 w-3 h-3 rounded-full border-2 transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: post.category.color,
                    borderColor: post.category.color,
                    boxShadow: `0 0 0 1px rgba(0,0,0,0.1)`
                  }}
                  title={post.category.name}
                />
              )}
              <h3 className="text-responsive-lg font-semibold group-hover:text-primary transition-colors line-clamp-2 break-words flex-1">
                {decodedTitle}
              </h3>
            </div>
          </Link>
        </div>

        {/* Author & Meta Row */}
        <div className="flex items-center gap-2 flex-wrap text-responsive-sm">
          {post.author && (
            <Link
              to={`/users/${post.author.username}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors group/author flex-shrink-0"
            >
              <Avatar className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover/author:scale-110">
                <AvatarImage src={authorAvatar || undefined} alt={authorDisplayName} />
                <AvatarFallback className="text-xs">{authorDisplayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate font-medium text-foreground">{authorDisplayName}</span>
            </Link>
          )}
          
          {/* Author role badge */}
          {getAuthorBadge()}
          
          <span className="text-muted-foreground flex-shrink-0">•</span>
          <span className="text-muted-foreground text-responsive-xs flex-shrink-0">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
          </span>
          
          {/* Category */}
          {post.category && (
            <>
              <span className="text-muted-foreground hidden sm:inline flex-shrink-0">•</span>
              <Link
                to={`/?category=${post.category.slug}`}
                className="hover:text-foreground transition-colors truncate hidden sm:inline flex-shrink-0"
              >
                <span className="flex items-center gap-1">
                  <span className="text-responsive-xs">{post.category.name}</span>
                  {/* Show permission indicator if category has restricted permissions */}
                  {post.category.viewPermission && post.category.viewPermission !== 'ALL' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Danh mục có quyền hạn chế
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
              </Link>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-1 space-y-3">
        {/* Excerpt */}
        <p className="text-responsive-sm text-muted-foreground line-clamp-2 whitespace-pre-line">
          {decodedExcerpt}
        </p>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-responsive-sm">
            {post.tags.slice(0, 3).map((tag) => (
              <Link key={tag.id} to={`/?tag=${tag.slug}`}>
                <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground cursor-pointer text-responsive-xs transition-all duration-200 btn-press inline-block">
                  {tag.name}
                </Badge>
              </Link>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="outline" className="text-responsive-xs">
                +{post.tags.length - 3} thêm
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer Stats & Actions */}
      <CardFooter className="border-t pt-3 pb-3 flex items-center justify-between gap-2 flex-wrap">
        {/* Stats Row */}
        <div className="flex items-center gap-3 text-responsive-sm text-muted-foreground flex-wrap">
          {/* Vote score with visual indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                voteScore > 0 ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 
                voteScore < 0 ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' : 
                'bg-muted'
              }`}>
                <span className="font-semibold text-responsive-sm">{voteScore}</span>
                <span className="text-responsive-xs">điểm</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {post.upvoteCount} upvote {post.downvoteCount} downvote
            </TooltipContent>
          </Tooltip>

          {/* Comments count */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-all cursor-help">
                <MessageSquare className="h-4 w-4" />
                <span className="text-responsive-sm">{post.commentCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Bình luận
            </TooltipContent>
          </Tooltip>

          {/* Views count - hidden on mobile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-all cursor-help">
                <Eye className="h-4 w-4" />
                <span className="text-responsive-sm">{post.viewCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Lượt xem
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <VoteButtons
            targetId={post.id}
            targetType="post"
            upvoteCount={post.upvoteCount}
            downvoteCount={post.downvoteCount}
            authorId={post.authorId}
            size="sm"
            orientation="horizontal"
          />
          <BookmarkButton postId={post.id} size="sm" />
        </div>
      </CardFooter>
    </Card>
  );
}
