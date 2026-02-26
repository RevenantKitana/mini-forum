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

  // Decode HTML entities in title and excerpt to fix &quot; display issue
  const decodedTitle = useMemo(() => decodeHtmlEntities(post.title || ''), [post.title]);
  const decodedExcerpt = useMemo(() => {
    const text = post.excerpt || (post.content ? post.content.substring(0, 200) + '...' : '');
    return decodeHtmlEntities(text);
  }, [post.excerpt, post.content]);

  return (
    <Card className="card-hover-lift border-l-4 border-l-transparent hover:border-l-primary transition-all duration-200">
      <CardHeader className="pb-2 md:pb-3">
        <div className="flex items-start justify-between gap-responsive flex-col sm:flex-row">
          {/* Vote buttons on the left */}
          <div className="flex-shrink-0 order-2 sm:order-1">
            <VoteButtons
              targetId={post.id}
              targetType="post"
              upvoteCount={post.upvoteCount}
              downvoteCount={post.downvoteCount}
              authorId={post.authorId}
              size="sm"
              orientation="vertical"
            />
          </div>
          
          <div className="flex-1 min-w-0 order-1 sm:order-2">
            <Link
              to={`/posts/${post.id}`}
              className="block group"
            >
              <div className="flex items-center gap-responsive-sm mb-2 flex-wrap">
                {post.isPinned && (
                  <span title={post.pinType === 'GLOBAL' ? 'Ghim toàn cục' : 'Ghim trong danh mục'}>
                    <Pin className={`h-4 w-4 flex-shrink-0 ${post.pinType === 'GLOBAL' ? 'text-primary' : 'text-orange-500'}`} />
                  </span>
                )}
                {post.isLocked && <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
              </div>
              <div className="flex items-start gap-responsive-sm">
                {/* Category color badge */}
                {post.category?.color && (
                  <span
                    className="flex-shrink-0 mt-1.5 w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: post.category.color,
                      borderColor: post.category.color,
                      boxShadow: `0 0 0 1px rgba(0,0,0,0.1)`
                    }}
                    title={post.category.name}
                  />
                )}
                <h3 className="text-responsive-lg font-semibold group-hover:text-primary transition-colors line-clamp-2 break-words">
                  {decodedTitle}
                </h3>
              </div>
            </Link>
            
            <div className="flex items-center gap-responsive-sm mt-2 text-responsive-sm text-muted-foreground flex-wrap">
              {post.author && (
                <Link
                  to={`/users/${post.author.username}`}
                  className="flex items-center gap-responsive-sm hover:text-foreground transition-colors min-w-0"
                >
                  <Avatar className="h-5 w-5 flex-shrink-0 transition-transform duration-200 hover:scale-110">
                    <AvatarImage src={authorAvatar || undefined} alt={authorDisplayName} />
                    <AvatarFallback>{authorDisplayName[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{authorDisplayName}</span>
                  <span className="text-muted-foreground/70 hidden sm:inline truncate">@{post.author.username}</span>
                </Link>
              )}
              <span className="hidden sm:inline">•</span>
              <span className="truncate">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}</span>
              {post.category && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <Link
                    to={`/?category=${post.category.slug}`}
                    className="hover:text-foreground transition-colors truncate hidden sm:inline"
                  >
                    <span className="flex items-center gap-1">
                      {post.category.name}
                      {/* Show permission indicator if category has restricted permissions */}
                      {post.category.viewPermission && post.category.viewPermission !== 'ALL' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            </div>
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
          </div>

          {/* Bookmark button on the right */}
          <div className="flex-shrink-0 order-3">
            <BookmarkButton postId={post.id} size="sm" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-responsive-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
          {decodedExcerpt}
        </p>
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-responsive-sm mt-3">
            {post.tags.map((tag) => (
              <Link key={tag.id} to={`/?tag=${tag.slug}`}>
                <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground cursor-pointer text-responsive-sm transition-all duration-200 btn-press">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center gap-responsive text-responsive-sm text-muted-foreground w-full flex-wrap">
          <div className="flex items-center gap-1 transition-colors duration-200">
            <span className={voteScore > 0 ? 'text-green-500' : voteScore < 0 ? 'text-red-500' : ''}>
              {voteScore} điểm
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 hover:text-foreground transition-colors duration-200">
            <MessageSquare className="h-4 w-4" />
            <span>{post.commentCount} bình luận</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 hover:text-foreground transition-colors duration-200">
            <Eye className="h-4 w-4" />
            <span>{post.viewCount} lượt xem</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
