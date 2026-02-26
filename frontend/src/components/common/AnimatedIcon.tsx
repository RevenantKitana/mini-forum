import { LucideIcon, LucideProps, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

export type AnimationType = 
  | 'spin'        // Continuous rotation
  | 'pulse'       // Scale up/down
  | 'bounce'      // Vertical bounce
  | 'shake'       // Horizontal shake
  | 'ping'        // Ping effect (like notification)
  | 'wiggle'      // Slight rotation wiggle
  | 'float'       // Gentle floating motion
  | 'heartbeat'   // Heartbeat pulse
  | 'vote-pop'    // Vote button pop effect
  | 'vote-up'     // Upvote animation
  | 'vote-down'   // Downvote animation
  | 'bookmark-save' // Bookmark save animation
  | 'bell-ring'   // Notification bell ring
  | 'theme-rotate' // Theme toggle rotation
  | 'none';       // No animation

interface AnimatedIconProps extends LucideProps {
  icon: LucideIcon;
  animation?: AnimationType;
  animateOnHover?: boolean;
  animateOnClick?: boolean;
  duration?: 'slow' | 'normal' | 'fast';
  className?: string;
  onAnimationEnd?: () => void;
}

const animationClasses: Record<AnimationType, string> = {
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  shake: 'animate-shake',
  ping: 'animate-ping',
  wiggle: 'animate-wiggle',
  float: 'animate-float',
  heartbeat: 'animate-heartbeat',
  'vote-pop': 'animate-vote-pop',
  'vote-up': 'animate-vote-up',
  'vote-down': 'animate-vote-down',
  'bookmark-save': 'animate-bookmark-save',
  'bell-ring': 'animate-bell-ring',
  'theme-rotate': 'animate-theme-rotate',
  none: '',
};

const durationClasses: Record<'slow' | 'normal' | 'fast', string> = {
  slow: 'duration-1000',
  normal: 'duration-500',
  fast: 'duration-200',
};

/**
 * AnimatedIcon - Wrapper component for Lucide icons with CSS animations
 * 
 * Usage:
 * ```tsx
 * import { Bell, Heart, RefreshCw, ThumbsUp, Bookmark } from 'lucide-react';
 * import { AnimatedIcon } from '@/components/common/AnimatedIcon';
 * 
 * // Continuous spinning
 * <AnimatedIcon icon={RefreshCw} animation="spin" />
 * 
 * // Animate on hover only
 * <AnimatedIcon icon={Bell} animation="bell-ring" animateOnHover />
 * 
 * // Animate on click (great for vote/bookmark buttons)
 * <AnimatedIcon icon={ThumbsUp} animation="vote-pop" animateOnClick />
 * 
 * // Heartbeat effect
 * <AnimatedIcon icon={Heart} animation="heartbeat" className="text-red-500" />
 * ```
 */
export function AnimatedIcon({
  icon: Icon,
  animation = 'none',
  animateOnHover = false,
  animateOnClick = false,
  duration = 'normal',
  className,
  onAnimationEnd,
  ...props
}: AnimatedIconProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleClick = useCallback(() => {
    if (animateOnClick) {
      setIsAnimating(true);
    }
  }, [animateOnClick]);
  
  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false);
    onAnimationEnd?.();
  }, [onAnimationEnd]);

  const animationClass = animationClasses[animation];
  const durationClass = durationClasses[duration];
  
  // Determine if animation should be applied
  const shouldAnimate = !animateOnHover && !animateOnClick;
  const clickAnimating = animateOnClick && isAnimating;
  
  return (
    <Icon
      className={cn(
        'transition-transform',
        durationClass,
        // Continuous animation
        shouldAnimate && animationClass,
        // Click-triggered animation
        clickAnimating && animationClass,
        // Hover animations
        animateOnHover && animation === 'wiggle' && 'hover:animate-wiggle',
        animateOnHover && animation === 'bounce' && 'hover:animate-bounce',
        animateOnHover && animation === 'pulse' && 'hover:animate-pulse',
        animateOnHover && animation === 'shake' && 'hover:animate-shake',
        animateOnHover && animation === 'vote-pop' && 'hover:animate-vote-pop',
        animateOnHover && animation === 'bell-ring' && 'hover:animate-bell-ring',
        className
      )}
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
      {...props}
    />
  );
}

interface SpinnerIconProps extends Omit<LucideProps, 'ref'> {
  className?: string;
}

/**
 * SpinnerIcon - Convenience component for loading spinner
 */
export function SpinnerIcon({ className, ...props }: SpinnerIconProps) {
  return (
    <Loader2
      className={cn('animate-spin', className)}
      {...props}
    />
  );
}

export default AnimatedIcon;
