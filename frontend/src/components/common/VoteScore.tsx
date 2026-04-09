import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface VoteScoreProps {
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  className?: string;
}

/**
 * Vote score display with visual color indicator
 * Green for positive, red for negative, gray for zero
 */
export function VoteScore({
  score,
  upvoteCount,
  downvoteCount,
  className = '',
}: VoteScoreProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all ${
            score > 0
              ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
              : score < 0
              ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
              : 'bg-muted text-muted-foreground'
          } ${className}`}
        >
          {score > 0 ? (
            <TrendingUp className="h-4 w-4" />
          ) : score < 0 ? (
            <TrendingDown className="h-4 w-4" />
          ) : (
            <TrendingUp className="h-4 w-4 opacity-50" />
          )}
          <span className="text-sm font-medium">{score}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {upvoteCount} upvote · {downvoteCount} downvote
      </TooltipContent>
    </Tooltip>
  );
}
