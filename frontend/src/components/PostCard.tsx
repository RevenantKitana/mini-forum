import { Link } from 'react-router-dom';
import { useMemo, useRef, useEffect, useState } from 'react';
import { Post } from '@/api/services/postService';
import { Card, CardContent, CardFooter, CardHeader } from '@/app/components/ui/card';
import { Badge} from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { VoteButtons } from '@/components/common/VoteButtons';
import { BookmarkButton } from '@/components/common/BookmarkButton';
import { CategoryColorIcon } from '@/components/common/CategoryColorIcon';
import { VoteScore } from '@/components/common/VoteScore';
import { MessageSquare, Eye, Pin, Lock, Shield } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ROLE_CONFIG, AUTHOR_ROLE_MAP } from '@/constants/roles';

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

    const role = AUTHOR_ROLE_MAP[post.author.role];
    if (!role) return null;

    const { icon: Icon, label } = ROLE_CONFIG[role];

    return (
      <Badge role={role} size="xs">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Decode HTML entities in title and excerpt to fix &quot; display issue
  const decodedTitle = useMemo(() => decodeHtmlEntities(post.title || ''), [post.title]);
  const decodedExcerpt = useMemo(() => {
    const text = post.excerpt || (post.content ? post.content.substring(0, 200) + '...' : '');
    return decodeHtmlEntities(text);
  }, [post.excerpt, post.content]);

  // Detect if author name is truncated (width > 50% of card)
  const authorNameRef = useRef<HTMLSpanElement>(null);
  const [isAuthorNameTruncated, setIsAuthorNameTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (authorNameRef.current) {
        const isOverflow = authorNameRef.current.scrollWidth > authorNameRef.current.clientWidth;
        setIsAuthorNameTruncated(isOverflow);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [authorDisplayName]);

  return (
    <Card className="ml-2 relative overflow-visible card-hover-lift border-l-2  border-l-transparent hover:border-l-primary transition-all duration-1000 flex flex-col">
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
              {'Pinned category'}
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
              Khóa bình luận!
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <CardHeader className="pb-2 relative">
        {/* Title & Status Row */}
        <div className="space-y-1 mb-0 min-w-0 w-full">
          <Link to={`/posts/${post.id}`} className="block group">
            <div className="flex items-center gap-2">
              {/* Category color indicator: SendHorizontal icon filled with category color */}
              {post.category?.color && (
                <CategoryColorIcon color={post.category.color} name={post.category.name} />
              )}
              <h3 className="text-responsive-lg font-semibold group-hover:text-primary transition-colors truncate min-w-0 flex-1">
                {decodedTitle}
              </h3>
            </div>
          </Link>
        </div>

        {/* Category & Tags Row (single row, separated) */}
        {(post.category || (post.tags && post.tags.length > 0)) && (
          <div className="flex items-center gap-3 flex-wrap">
            {post.category && (
              <Link
                to={`/?category=${post.category.slug}`}
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <Badge variant="outline" size="sm" className="gap-1 font-medium inline-flex items-center">
                  {post.category.name}
                  {post.category.viewPermission && post.category.viewPermission !== 'ALL' }
                </Badge>
              </Link>
            )}

            {post.tags && post.tags.length > 0 && (
              <>
                <span className="hidden sm:inline text-muted-foreground">·</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {post.tags.slice(0, 4).map((tag) => (
                    <Link key={tag.id} to={`/?tag=${tag.slug}`}>
                      <Badge variant="secondary" size="sm" className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-all duration-200 btn-press">
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                  {post.tags.length > 4 && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" size="sm" className="cursor-help">
                          +{post.tags.length - 4} {post.tags.length - 4 === 1 ? 'tag' : 'tags'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {post.tags.slice(4).map((tag) => tag.name).join(', ')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </>
            )}
          </div>
        )}


        {/* Author & Meta Row */}
        <div className="border-t flex items-center gap-3 pt-2 flex-wrap text-xs sm:text-sm">
          {post.author && (
            <Link
              to={`/users/${post.author.username}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors group/author flex-shrink-0 min-w-0 max-w-[50%]"
            >
              <Avatar className="h-5 w-5 sm:h-5 sm:w-5 flex-shrink-0 transition-transform duration-200 group-hover/author:scale-110">
                <AvatarImage src={authorAvatar || undefined} alt={authorDisplayName} />
                <AvatarFallback className="text-[10px]">{authorDisplayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              {isAuthorNameTruncated ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span 
                      ref={authorNameRef}
                      className="truncate font-medium text-foreground cursor-help"
                    >
                      {authorDisplayName}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {authorDisplayName}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span 
                  ref={authorNameRef}
                  className="truncate font-medium text-foreground"
                >
                  {authorDisplayName}
                </span>
              )}
            </Link>
          )}
          
          {/* Author role badge */}
          {getAuthorBadge()}
          
          <span className="text-muted-foreground flex-shrink-0">•</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground text-responsive-xs flex-shrink-0">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {format(new Date(post.createdAt), 'dd/MM/yyyy')}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-1 space-y-2 border-b">
        {/* Excerpt */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 whitespace-pre-line leading-relaxed">
          {decodedExcerpt}
        </p>
      </CardContent>

      {/* Footer Stats & Actions */}
      <CardFooter className="pb-2 pt-2 flex items-center justify-between gap-2 flex-wrap">
        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">

          <VoteButtons
            targetId={post.id}
            targetType="post"
            upvoteCount={post.upvoteCount}
            downvoteCount={post.downvoteCount}
            authorId={post.authorId}
            size="sm"
            orientation="horizontal"
          />
          <VoteScore
            score={voteScore}
            upvoteCount={post.upvoteCount}
            downvoteCount={post.downvoteCount}
          />

          {/* Comments count */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-muted transition-all cursor-help">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="ml-1.5">{post.commentCount}</span>
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
                <span className="ml-1.5">{post.viewCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Lượt xem
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center">
          <BookmarkButton postId={post.id} size="sm" />
        </div>
      </CardFooter>
    </Card>
  );
}
