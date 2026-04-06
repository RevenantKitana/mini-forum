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

interface BlockedUser {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  blockedAt: string;
}

// Legacy interface for backward compatibility
interface BlockedUserLegacy {
  id: number;
  blocked: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
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
          displayName: item.blocked.displayName,
          avatarUrl: item.blocked.avatarUrl,
          blockedAt: item.createdAt,
        };
      } else {
        // New format with direct properties
        return {
          id: item.id,
          username: item.username,
          displayName: item.displayName,
          avatarUrl: item.avatarUrl,
          blockedAt: item.blockedAt,
        };
      }
    });
  };

  const blockedUsers = normalizeBlockedUsers(data?.data || []);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Link to="/settings/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Người dùng đã chặn</h1>
          <p className="text-sm text-muted-foreground">Quản lý danh sách người dùng bạn đã chặn</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Danh sách chặn ({blockedUsers.length})
          </CardTitle>
          <CardDescription>
            Người dùng bị chặn sẽ không thể xem profile của bạn và bạn sẽ không thấy nội dung của họ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Bạn chưa chặn người dùng nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage
                        src={user.avatarUrl || undefined}
                        alt={user.displayName || user.username}
                      />
                      <AvatarFallback>
                        {(user.displayName || user.username)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Link
                        to={`/users/${user.username}`}
                        className="font-medium hover:underline truncate block"
                      >
                        {user.displayName || user.username}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">
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
                    size="sm"
                    className="w-full sm:w-auto flex-shrink-0"
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
