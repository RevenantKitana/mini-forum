import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/useNotifications';
import { NotificationItem } from '@/api/services/notificationService';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import {
  Bell,
  Check,
  CheckCheck,
  MessageCircle,
  ThumbsUp,
  AtSign,
  Settings,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  // Track notifications that are fading out (marked as read)
  const [fadingNotifications, setFadingNotifications] = useState<Set<number>>(new Set());

  const { data: countData } = useUnreadNotificationCount(isAuthenticated);
  const { data: notificationsData, isLoading, refetch } = useNotifications(
    page,
    20,
    false,
    isAuthenticated
  );
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const unreadCount = countData ?? 0;
  const notifications = notificationsData?.data ?? [];
  const pagination = notificationsData?.pagination;

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      toast.error('Không thể đánh dấu đã đọc');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      toast.error('Không thể đánh dấu tất cả');
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'COMMENT':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'REPLY':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'UPVOTE':
        return <ThumbsUp className="h-5 w-5 text-orange-500" />;
      case 'MENTION':
        return <AtSign className="h-5 w-5 text-purple-500" />;
      case 'SYSTEM':
        return <Settings className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationLink = (notification: NotificationItem) => {
    // Use postId for navigation
    if (notification.postId) {
      if (notification.commentId) {
        return `/posts/${notification.postId}#comment-${notification.commentId}`;
      }
      return `/posts/${notification.postId}`;
    }

    if (!notification.relatedType || !notification.relatedId) {
      return undefined;
    }

    switch (notification.relatedType) {
      case 'POST':
        // Fallback: use relatedId for POST type
        return `/posts/${notification.relatedId}`;
      case 'COMMENT':
        // For comments, relatedId is commentId - need postId which isn't available
        return undefined;
      default:
        return undefined;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Đăng nhập để xem thông báo</h2>
            <p className="text-muted-foreground mb-4">
              Bạn cần đăng nhập để xem các thông báo của mình.
            </p>
            <Link to="/login">
              <Button>Đăng nhập</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary animate-float" />
          <div>
            <h1 className="text-2xl font-bold">Thông báo</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} thông báo chưa đọc
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="btn-press" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="btn-press"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
      </div>



      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center animate-fade-in-up">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Không có thông báo</h3>
            <p className="text-muted-foreground">
              Bạn chưa có thông báo nào.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: NotificationItem, index: number) => {
            const link = getNotificationLink(notification);
            const isFading = fadingNotifications.has(notification.id);
            const NotificationContent = (
              <Card
                className={cn(
                  'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
                  !notification.isRead && !isFading && 'bg-primary/5 border-primary/20',
                  isFading && 'opacity-50 scale-95 pointer-events-none'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !notification.isRead && 'font-medium')}>
                        {notification.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="Chưa đọc" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 btn-press"
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!notification.isRead) {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                        disabled={notification.isRead || markAsReadMutation.isPending}
                        title="Đánh dấu đã đọc"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      {link && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );

            if (link) {
              return (
                <div
                  key={notification.id}
                  className="animate-stagger"
                  style={{ '--stagger-index': index } as React.CSSProperties}
                >
                  <Link
                    to={link}
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    {NotificationContent}
                  </Link>
                </div>
              );
            }

            return (
              <div
                key={notification.id}
                className="animate-stagger"
                style={{ '--stagger-index': index } as React.CSSProperties}
              >
                {NotificationContent}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="btn-press"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trang trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="btn-press"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}
