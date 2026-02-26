import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  /** Show the overlay */
  isLoading: boolean;
  /** Optional message */
  message?: string;
  /** Full screen overlay vs inline */
  fullScreen?: boolean;
  /** Make background completely opaque */
  opaque?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Loading overlay component for showing loading state
 * Can be used as full-screen overlay or inline within a container
 */
export function LoadingOverlay({
  isLoading,
  message = 'Đang tải...',
  fullScreen = false,
  opaque = false,
  className,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen
          ? 'fixed inset-0 z-50'
          : 'absolute inset-0 z-10',
        opaque
          ? 'bg-background'
          : 'bg-background/80 backdrop-blur-sm',
        'animate-fade-in',
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className */
  className?: string;
}

/**
 * Simple loading spinner inline
 */
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
}

interface ContentMaskProps {
  /** Show the mask */
  isLoading: boolean;
  /** Children to render */
  children: React.ReactNode;
  /** Optional skeleton to show instead of children */
  skeleton?: React.ReactNode;
  /** Minimum height */
  minHeight?: string;
  /** Custom className */
  className?: string;
}

/**
 * Content mask that shows loading state over content
 * Useful for lazy loading sections
 */
export function ContentMask({
  isLoading,
  children,
  skeleton,
  minHeight = '200px',
  className,
}: ContentMaskProps) {
  if (isLoading && skeleton) {
    return <div className={cn('animate-pulse', className)}>{skeleton}</div>;
  }

  return (
    <div className={cn('relative', className)} style={{ minHeight: isLoading ? minHeight : undefined }}>
      {isLoading && (
        <LoadingOverlay isLoading={true} />
      )}
      <div className={cn(isLoading && 'opacity-50 pointer-events-none transition-opacity')}>
        {children}
      </div>
    </div>
  );
}
