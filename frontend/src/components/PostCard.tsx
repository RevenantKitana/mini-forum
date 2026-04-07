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
      case 'BOT':
        return <Badge variant="default" className="gap-1 bg-emerald-600 text-responsive-xs"><Shield className="h-3 w-3" /> Bot</Badge>;
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
    <Card className="relative overflow-visible card-hover-lift border-l-2  border-l-transparent hover:border-l-primary transition-all duration-1000 flex flex-col">
      {/* Corner icons: pinned (left) and locked (right) */}
      {post.isPinned && post.pinType === 'CATEGORY' && (
        <div className="absolute top-0 left-0 translate-x-1/2 -translate-y-1/2 -rotate-45">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex-shrink-0">
                <Pin className={`h-4 w-4 ${post.pinType === 'GLOBAL' ? 'text-primary' : 'text-orange-500'}`} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {'Pinnded category'}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      {post.isLocked && (
        <div className="absolute top-2 right-2 z-10 pointer-events-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex-shrink-0">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Bị admin khóa mõm!
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <CardHeader className="pb-2 relative">
        {/* Title & Status Row */}
        <div className="space-y-1 mb-0 min-w-0 w-full">
          
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
              <h3 className="text-responsive-lg font-semibold group-hover:text-primary transition-colors truncate min-w-0 flex-1">
                {decodedTitle}
              </h3>
            </div>
          </Link>
        </div>

        {/* Category Badge - Mobile & Desktop */}
        {post.category && (
          <Link
            to={`/?category=${post.category.slug}`}
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <Badge variant="outline" className="gap-1 text-responsive-xs font-medium">
              {post.category.name}
              {post.category.viewPermission && post.category.viewPermission !== 'ALL' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Danh mục có quyền hạn chế
                  </TooltipContent>
                </Tooltip>
              )}
            </Badge>
          </Link>
        )}

        {/* Author & Meta Row */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-sm">
          {post.author && (
            <Link
              to={`/users/${post.author.username}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors group/author flex-shrink-0"
            >
              <Avatar className="h-5 w-5 sm:h-5 sm:w-5 flex-shrink-0 transition-transform duration-200 group-hover/author:scale-110">
                <AvatarImage src={authorAvatar || undefined} alt={authorDisplayName} />
                <AvatarFallback className="text-[10px]">{authorDisplayName[0]?.toUpperCase()}</AvatarFallback>
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
        </div>
      </CardHeader>

      <CardContent className="pb-2 flex-1 space-y-2">
        {/* Excerpt */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 whitespace-pre-line leading-relaxed">
          {decodedExcerpt}
        </p>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
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
      <CardFooter className="border-t pt-2 pb-2 flex items-center justify-between gap-2 flex-wrap">
        {/* Stats Row */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          {/* Vote score with visual indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md transition-all ${
                voteScore > 0 ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 
                voteScore < 0 ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' : 
                'bg-muted'
              }`}>
                <span className="font-semibold">{voteScore}</span>
                <span className="hidden md:inline text-xs">điểm</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {post.upvoteCount} upvote · {post.downvoteCount} downvote
            </TooltipContent>
          </Tooltip>

          {/* Comments count */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-muted transition-all cursor-help">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{post.commentCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Bình luận
            </TooltipContent>
          </Tooltip>

          {/* Views count - hidden on mobile (<768px) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-muted transition-all cursor-help">
                <Eye className="h-3.5 w-3.5" />
                <span>{post.viewCount}</span>
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
