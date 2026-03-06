import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { Bell, Check, Trash2, MessageCircle, ThumbsUp, AtSign, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/useNotifications';
import { NotificationItem } from '@/api/services/notificationService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Disable bell when user is on /notifications page
  const isOnNotificationsPage = location.pathname === '/notifications';

  const { data: countData } = useUnreadNotificationCount(isAuthenticated);
  // Only show unread notifications in bell dropdown
  const { data: notificationsData, isLoading } = useNotifications(1, 10, true, isAuthenticated && open);
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const unreadCount = countData ?? 0;
  const notifications = notificationsData?.data ?? [];

  // Animate bell when there are new unread notifications
  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsReadMutation.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'COMMENT':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'REPLY':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'UPVOTE':
        return <ThumbsUp className="h-4 w-4 text-orange-500" />;
      case 'MENTION':
        return <AtSign className="h-4 w-4 text-purple-500" />;
      case 'SYSTEM':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationLink = (notification: NotificationItem) => {
    // Use postId for navigation
    if (notification.postId) {
      if (notification.commentId) {
        // Navigate to post with comment anchor
        return `/posts/${notification.postId}#comment-${notification.commentId}`;
      }
      return `/posts/${notification.postId}`;
    }
    
    // Fallback to relatedId
    if (!notification.relatedType || !notification.relatedId) {
      return '#';
    }

    switch (notification.relatedType) {
      case 'POST':
        return `/posts/${notification.relatedId}`;
      case 'COMMENT':
        // For comments, relatedId is commentId, need postId
        return '#';
      default:
        return '#';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 btn-press hover:animate-wiggle"
                disabled={isOnNotificationsPage}
              >
                <Bell 
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isAnimating && "animate-bell-ring"
                  )} 
                />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Thông báo{unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}</p>
          </TooltipContent>
        </Tooltip>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Thông báo</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              Đánh dấu đã đọc
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-sm text-muted-foreground">Đang tải...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-20 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <span className="text-sm">Không có thông báo</span>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 p-3 cursor-pointer',
                  !notification.isRead && 'bg-muted/50'
                )}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id);
                  }
                }}
                asChild
              >
                <Link to={getNotificationLink(notification)}>
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{notification.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                  )}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="justify-center">
              <Link to="/notifications" className="text-sm text-center w-full">
                Xem tất cả thông báo
              </Link>
            </DropdownMenuItem>
          </>
      </DropdownMenuContent>
    </DropdownMenu>
    </TooltipProvider>
  );
}
