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

    if (!notification.related_type || !notification.related_id) {
      return undefined;
    }

    switch (notification.related_type) {
      case 'POST':
        // Fallback: use relatedId for POST type
        return `/posts/${notification.related_id}`;
      case 'COMMENT':
        // For comments, relatedId is commentId - need postId which isn't available
        return undefined;
      default:
        return undefined;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl xl:max-w-6xl mx-auto w-full space-y-6">
        <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
          <CardContent className="py-12 px-6 text-center">
            <Bell className="h-14 w-14 mx-auto mb-4 text-muted-foreground/60 animate-bounce" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Đăng nhập để xem thông báo</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
              Bạn cần đăng nhập để xem và tương tác với các thông báo của mình.
            </p>
            <Link to="/login">
              <Button className="h-11 px-6 text-sm sm:text-base font-semibold rounded-xl">Đăng nhập ngay</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl xl:max-w-6xl mx-auto w-full space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Bell className="h-6 w-6 animate-float" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Thông báo</h1>
            {unreadCount > 0 ? (
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
                Bạn có <span className="font-bold text-primary">{unreadCount}</span> thông báo chưa đọc
              </p>
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
                Tất cả thông báo đã được đọc
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Button
            variant="outline"
            className="h-10 px-4 text-sm font-semibold rounded-xl btn-press flex-1 sm:flex-none border-0 bg-muted/40 hover:bg-muted/70"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="h-10 px-4 text-sm font-semibold rounded-xl btn-press flex-1 sm:flex-none border-0 bg-primary/10 text-primary hover:bg-primary/20"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
              <span className="sm:hidden">Đã đọc hết</span>
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-6 w-6 rounded-lg mt-1 flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
          <CardContent className="py-16 text-center animate-fade-in-up">
            <Bell className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg sm:text-xl font-bold mb-1.5">Không có thông báo</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Bạn chưa có thông báo mới nào vào lúc này.
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
                  'rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-all duration-200 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] cursor-pointer',
                  !notification.is_read && !isFading && 'bg-primary/5 ring-1 ring-primary/20',
                  isFading && 'opacity-50 scale-95 pointer-events-none'
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5 p-2 rounded-xl bg-muted/60">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm sm:text-base leading-relaxed', !notification.is_read ? 'font-semibold text-foreground' : 'text-foreground/90')}>
                        {notification.content}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.is_read && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" title="Chưa đọc" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl btn-press text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!notification.is_read) {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                        disabled={notification.is_read || markAsReadMutation.isPending}
                        title="Đánh dấu đã đọc"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      {link && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
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
                      if (!notification.is_read) {
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
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            className="h-10 px-4 text-sm font-semibold rounded-xl border-0 bg-muted/40 hover:bg-muted/70 btn-press"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trang trước
          </Button>
          <span className="text-sm sm:text-base font-medium text-muted-foreground px-2">
            Trang {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            className="h-10 px-4 text-sm font-semibold rounded-xl border-0 bg-muted/40 hover:bg-muted/70 btn-press"
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
