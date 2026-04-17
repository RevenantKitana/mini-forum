import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleBookmark, useBookmarkStatus } from '@/hooks/useBookmarks';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';

interface BookmarkButtonProps {
  postId: number;
  isBookmarked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  showConfirmOnRemove?: boolean;
}

export function BookmarkButton({
  postId,
  isBookmarked: initialBookmarked,
  size = 'md',
  className,
  showText = false,
  showConfirmOnRemove = false,
}: BookmarkButtonProps) {
  const { isAuthenticated } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Fetch bookmark status from API if not provided
  const { data: bookmarkStatusData, isLoading: statusLoading } = useBookmarkStatus(
    postId, 
    isAuthenticated && initialBookmarked === undefined
  );
  
  // Use API data if available, otherwise use initial prop, otherwise false
  const isBookmarkedFromApi = bookmarkStatusData ?? initialBookmarked ?? false;
  const [bookmarked, setBookmarked] = useState(isBookmarkedFromApi);
  
  // Sync state when API data loads
  useEffect(() => {
    if (bookmarkStatusData !== undefined) {
      setBookmarked(bookmarkStatusData);
    }
  }, [bookmarkStatusData]);
  
  // Sync state when initial prop changes
  useEffect(() => {
    if (initialBookmarked !== undefined) {
      setBookmarked(initialBookmarked);
    }
  }, [initialBookmarked]);

  const toggleMutation = useToggleBookmark();

  const handleToggle = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    // Show confirm dialog when removing bookmark if enabled
    if (bookmarked && showConfirmOnRemove) {
      setShowConfirmDialog(true);
      return;
    }

    await performToggle();
  }, [isAuthenticated, bookmarked, showConfirmOnRemove]);

  const performToggle = async () => {
    // Trigger animation
    setIsAnimating(true);
    
    // Optimistic update
    const previousState = bookmarked;
    setBookmarked(!bookmarked);

    try {
      const result = await toggleMutation.mutateAsync(postId);
      // Sync with server response
      setBookmarked(result.bookmarked);
    } catch (error) {
      // Rollback on error
      setBookmarked(previousState);
    }
  };

  const handleConfirmRemove = async () => {
    setShowConfirmDialog(false);
    await performToggle();
  };

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const getTooltipText = () => {
    if (!isAuthenticated) return 'Đăng nhập để bookmark';
    return bookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết';
  };

  if (showText) {
    return (
      <>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={bookmarked ? 'secondary' : 'outline'}
                size={size === 'lg' ? 'default' : 'sm'}
                className={cn(
                  'btn-press transition-all duration-200',
                  bookmarked && 'text-yellow-600 border-yellow-600',
                  className
                )}
                onClick={handleToggle}
                disabled={toggleMutation.isPending || statusLoading || !isAuthenticated}
              >
                <Bookmark
                  className={cn(
                    iconSizeClasses[size], 
                    'mr-2 transition-transform',
                    bookmarked && 'fill-current',
                    isAnimating && 'animate-bookmark-save'
                  )}
                  onAnimationEnd={() => setIsAnimating(false)}
                />
                {bookmarked ? 'Đã lưu' : 'Lưu'}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{getTooltipText()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa bookmark</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa bài viết này khỏi danh sách đã lưu?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRemove}>Xóa</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={getTooltipText()}
              aria-pressed={bookmarked}
              className={cn(
                sizeClasses[size],
                'btn-press transition-all duration-200',
                bookmarked && 'text-yellow-600',
                className
              )}
              onClick={handleToggle}
              disabled={toggleMutation.isPending || statusLoading || !isAuthenticated}
            >
              <Bookmark
                className={cn(
                  iconSizeClasses[size], 
                  'transition-transform',
                  bookmarked && 'fill-current',
                  isAnimating && 'animate-bookmark-save'
                )}
                onAnimationEnd={() => setIsAnimating(false)}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bookmark</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết này khỏi danh sách đã lưu?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
