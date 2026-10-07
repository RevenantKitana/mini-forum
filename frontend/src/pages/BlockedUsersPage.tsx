import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '@/api/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { toast } from 'sonner';
import { UserX, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getAvatarUrl } from '@/utils/imageHelpers';

interface BlockedUser {
  id: number;
  username: string;
  display_name: string | null;
  avatar_preview_url: string | null;
  avatar_standard_url: string | null;
  blockedAt: string;
}

// Legacy interface for backward compatibility
interface BlockedUserLegacy {
  id: number;
  blocked: {
    id: number;
    username: string;
    display_name: string | null;
    avatar_preview_url: string | null;
    avatar_standard_url: string | null;
  };
  created_at: string;
}

export function BlockedUsersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['blockedUsers'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me/blocked');
      return response.data;
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiClient.delete(`/users/${userId}/block`);
    },
    onSuccess: () => {
      toast.success('Đã bỏ chặn người dùng');
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể bỏ chặn người dùng');
    },
  });

  // Normalize data - support both old and new API format
  const normalizeBlockedUsers = (rawData: any[]): BlockedUser[] => {
    if (!rawData || rawData.length === 0) return [];
    
    // Check if it's the new format (has direct username) or old format (has blocked object)
    return rawData.map((item) => {
      if (item.blocked) {
        // Old format with nested blocked object
        return {
          id: item.blocked.id,
          username: item.blocked.username,
          display_name: item.blocked.display_name,
          avatar_preview_url: item.blocked.avatar_preview_url,
          avatar_standard_url: item.blocked.avatar_standard_url,
          blockedAt: item.created_at,
        };
      } else {
        // New format with direct properties
        return {
          id: item.id,
          username: item.username,
          display_name: item.display_name,
          avatar_preview_url: item.avatar_preview_url,
          avatar_standard_url: item.avatar_standard_url,
          blockedAt: item.blockedAt,
        };
      }
    });
  };

  const blockedUsers = normalizeBlockedUsers(data?.data || []);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl xl:max-w-5xl mx-auto w-full space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Link to="/settings/profile">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted btn-press">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Người dùng đã chặn</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5">Quản lý danh sách tài khoản bạn đã chặn tương tác</p>
        </div>
      </div>

      <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
        <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
            <UserX className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Danh sách chặn ({blockedUsers.length})
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground mt-1">
            Người dùng bị chặn sẽ không thể xem trang cá nhân của bạn và các nội dung của họ sẽ bị ẩn khỏi bảng tin của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-2 sm:pt-2">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20">
                  <div className="flex items-center gap-3.5">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
              ))}
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserX className="h-14 w-14 mx-auto mb-3 opacity-30" />
              <p className="text-sm sm:text-base font-medium">Bạn chưa chặn người dùng nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-background">
                      <AvatarImage
                        src={getAvatarUrl(user, 'preview') || undefined}
                        alt={user.display_name || user.username}
                      />
                      <AvatarFallback className="font-bold text-base">
                        {(user.display_name || user.username)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Link
                        to={`/users/${user.username}`}
                        className="font-bold text-base sm:text-lg hover:underline truncate block"
                      >
                        {user.display_name || user.username}
                      </Link>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                        @{user.username} • Đã chặn{' '}
                        {formatDistanceToNow(new Date(user.blockedAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 px-5 text-sm font-semibold rounded-xl w-full sm:w-auto flex-shrink-0 border-0 bg-muted/50 hover:bg-muted btn-press"
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn bỏ chặn @${user.username}?`)) {
                        unblockMutation.mutate(user.id);
                      }
                    }}
                    disabled={unblockMutation.isPending}
                  >
                    {unblockMutation.isPending ? 'Đang xử lý...' : 'Bỏ chặn'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
