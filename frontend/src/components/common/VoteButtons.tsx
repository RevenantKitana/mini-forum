import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useVotePost, useVoteComment, usePostVote, useCommentVote } from '@/hooks/useVotes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoteButtonsProps {
  targetType: 'post' | 'comment';
  targetId: number;
  upvoteCount: number;
  downvoteCount: number;
  authorId?: number; // Author ID to prevent self-voting
  userVote?: 'up' | 'down' | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function VoteButtons({
  targetType,
  targetId,
  upvoteCount: initialUpvotes,
  downvoteCount: initialDownvotes,
  authorId,
  userVote: initialUserVote = null,
  size = 'md',
  className,
  orientation = 'vertical',
}: VoteButtonsProps) {
  const { isAuthenticated, user } = useAuth();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentVote, setCurrentVote] = useState<'up' | 'down' | null>(initialUserVote);
  const [upvoteAnimating, setUpvoteAnimating] = useState(false);
  const [downvoteAnimating, setDownvoteAnimating] = useState(false);

  // Fetch current vote status from server (fixes reload issue)
  const postVoteQuery = usePostVote(targetType === 'post' ? targetId : -1, isAuthenticated && targetType === 'post');
  const commentVoteQuery = useCommentVote(targetType === 'comment' ? targetId : -1, isAuthenticated && targetType === 'comment');
  
  // Update local state with server vote status
  useEffect(() => {
    if (targetType === 'post' && postVoteQuery.data) {
      setCurrentVote(postVoteQuery.data.voteType);
    }
  }, [postVoteQuery.data, targetType]);

  useEffect(() => {
    if (targetType === 'comment' && commentVoteQuery.data) {
      setCurrentVote(commentVoteQuery.data.voteType);
    }
  }, [commentVoteQuery.data, targetType]);

  const votePostMutation = useVotePost();
  const voteCommentMutation = useVoteComment();

  const isLoading = votePostMutation.isPending || voteCommentMutation.isPending;
  
  // Check if current user is the author (prevent self-voting)
  const isAuthor = authorId !== undefined && user && (user.id === authorId || Number(user.id) === authorId);

  const handleVote = useCallback(async (voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để vote');
      return;
    }
    
    if (isAuthor) {
      toast.error('Bạn không thể vote cho nội dung của chính mình');
      return;
    }

    // Trigger animation
    if (voteType === 'up') {
      setUpvoteAnimating(true);
    } else {
      setDownvoteAnimating(true);
    }

    // Optimistic update
    const previousVote = currentVote;
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;

    if (currentVote === voteType) {
      // Remove vote
      setCurrentVote(null);
      if (voteType === 'up') {
        setUpvotes((prev) => prev - 1);
      } else {
        setDownvotes((prev) => prev - 1);
      }
    } else {
      // Add or change vote
      setCurrentVote(voteType);
      if (voteType === 'up') {
        setUpvotes((prev) => prev + 1);
        if (previousVote === 'down') {
          setDownvotes((prev) => prev - 1);
        }
      } else {
        setDownvotes((prev) => prev + 1);
        if (previousVote === 'up') {
          setUpvotes((prev) => prev - 1);
        }
      }
    }

    try {
      if (targetType === 'post') {
        await votePostMutation.mutateAsync({ postId: targetId, voteType });
      } else {
        await voteCommentMutation.mutateAsync({ commentId: targetId, voteType });
      }
    } catch (error) {
      // Rollback on error
      setCurrentVote(previousVote);
      setUpvotes(previousUpvotes);
      setDownvotes(previousDownvotes);
    }
  }, [isAuthenticated, isAuthor, currentVote, upvotes, downvotes, targetType, targetId, votePostMutation, voteCommentMutation]);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const score = upvotes - downvotes;
  
  // Generate tooltip text based on current state
  const getUpvoteTooltip = () => {
    if (isAuthor) return 'Bạn không thể vote cho nội dung của chính mình';
    if (!isAuthenticated) return 'Đăng nhập để vote';
    if (currentVote === 'up') return 'Bỏ upvote';
    return 'Upvote';
  };

  const getDownvoteTooltip = () => {
    if (isAuthor) return 'Bạn không thể vote cho nội dung của chính mình';
    if (!isAuthenticated) return 'Đăng nhập để vote';
    if (currentVote === 'down') return 'Bỏ downvote';
    return 'Downvote';
  };

  interface ActionButtonProps {
    voteType: 'up' | 'down';
    Icon: any;
    tooltip: string;
    active: boolean;
    animating: boolean;
    onAnimEnd: () => void;
    onClick: () => void;
    side?: 'top' | 'bottom';
  }

  function ActionButton({ voteType, Icon, tooltip, active, animating, onAnimEnd, onClick, side = 'top' }: ActionButtonProps) {
    const activeClass = voteType === 'up'
      ? 'text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900'
      : 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900';

    const animClass = voteType === 'up' ? 'animate-vote-up' : 'animate-vote-down';

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={tooltip}
            aria-pressed={active}
            className={cn(
              sizeClasses[size],
              'btn-press transition-all duration-200',
              active && activeClass,
              isAuthor && 'opacity-50 cursor-not-allowed'
            )}
            onClick={onClick}
            disabled={isLoading || !isAuthenticated || isAuthor}
          >
            <Icon
              className={cn(
                iconSizeClasses[size],
                'transition-transform',
                animating && animClass,
                active && 'fill-current'
              )}
              onAnimationEnd={onAnimEnd}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="group"
        aria-label="Vote"
        className={cn(
          'flex items-center gap-4',
          orientation === 'vertical' ? 'flex-col' : 'flex-row',
          className
        )}
      >
        <ActionButton
          voteType="up"
          Icon={ThumbsUp}
          tooltip={getUpvoteTooltip()}
          active={currentVote === 'up'}
          animating={upvoteAnimating}
          onAnimEnd={() => setUpvoteAnimating(false)}
          onClick={() => {
            setUpvoteAnimating(true);
            handleVote('up');
          }}
          side="top"
        />


        <ActionButton
          voteType="down"
          Icon={ThumbsDown}
          tooltip={getDownvoteTooltip()}
          active={currentVote === 'down'}
          animating={downvoteAnimating}
          onAnimEnd={() => setDownvoteAnimating(false)}
          onClick={() => {
            setDownvoteAnimating(true);
            handleVote('down');
          }}
          side="bottom"
        />
      </div>
    </TooltipProvider>
  );
}
