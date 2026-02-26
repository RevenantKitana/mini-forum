import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService, DashboardStats, AdminAuditLog, PinnedPost } from '@/api/services/adminService';
import { 
  Users, FileText, MessageSquare, Flag, TrendingUp, Activity, 
  Pin, UserCheck, Shield, Tag, Calendar, GripVertical, PinOff
} from 'lucide-react';
import { formatDate, decodeHtmlEntities } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLog[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<PinnedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date range state
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, logsData, pinnedData] = await Promise.all([
        adminService.getDashboardStats({ startDate, endDate }),
        adminService.getAuditLogs({ page: 1, limit: 10 }).catch(() => ({ data: [] })),
        adminService.getPinnedPosts().catch(() => []),
      ]);
      setStats(statsData);
      setRecentLogs(logsData.data || []);
      setPinnedPosts(pinnedData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleUnpinPost = async (postId: number) => {
    try {
      await adminService.togglePostPin(postId.toString());
      toast.success('Đã bỏ ghim bài viết');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể bỏ ghim');
    }
  };

  const handleUpdatePinOrder = async (postId: number, newOrder: number) => {
    try {
      await adminService.updatePinOrder(postId.toString(), newOrder);
      toast.success('Đã cập nhật thứ tự ghim');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật thứ tự');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive bg-destructive/10 rounded-md">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: stats?.overview?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Tổng bài viết',
      value: stats?.overview?.totalPosts || 0,
      icon: FileText,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Tổng bình luận',
      value: stats?.overview?.totalComments || 0,
      icon: MessageSquare,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Báo cáo chờ xử lý',
      value: stats?.overview?.pendingReports || 0,
      icon: Flag,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Người dùng hoạt động',
      value: stats?.overview?.activeUsers || 0,
      icon: UserCheck,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Bài viết ghim',
      value: stats?.overview?.pinnedPostsCount || 0,
      icon: Pin,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  const rangeStats = [
    {
      title: 'Người dùng mới',
      value: stats?.dateRange?.newUsers || 0,
      icon: TrendingUp,
      color: 'text-emerald-500',
    },
    {
      title: 'Bài viết mới',
      value: stats?.dateRange?.newPosts || 0,
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      title: 'Bình luận mới',
      value: stats?.dateRange?.newComments || 0,
      icon: MessageSquare,
      color: 'text-violet-500',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_REGISTERED':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'POST_CREATED':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'COMMENT_CREATED':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'USER_REGISTERED':
        return `${activity.data.displayName || activity.data.username} đã đăng ký`;
      case 'POST_CREATED':
        return `${activity.data.author?.displayName || activity.data.author?.username} đăng bài "${activity.data.title?.substring(0, 40)}..."`;
      case 'COMMENT_CREATED':
        return `${activity.data.author?.displayName || activity.data.author?.username} bình luận trong "${activity.data.post?.title?.substring(0, 30)}..."`;
      default:
        return 'Hoạt động không xác định';
    }
  };

  const getAuditActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      PIN: 'bg-yellow-100 text-yellow-800',
      UNPIN: 'bg-gray-100 text-gray-800',
      LOCK: 'bg-orange-100 text-orange-800',
      UNLOCK: 'bg-teal-100 text-teal-800',
      BAN: 'bg-red-100 text-red-800',
      UNBAN: 'bg-green-100 text-green-800',
      HIDE: 'bg-gray-100 text-gray-800',
      SHOW: 'bg-blue-100 text-blue-800',
      ROLE_CHANGE: 'bg-purple-100 text-purple-800',
    };
    return actionColors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Tổng quan về hoạt động của diễn đàn
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Thống kê theo khoảng thời gian
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="startDate" className="text-sm font-normal">Từ:</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[150px] h-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="endDate" className="text-sm font-normal">Đến:</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[150px] h-8"
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {rangeStats.map((stat) => (
              <div key={stat.title} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.title}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pinned Posts Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5" />
            Quản lý bài viết ghim ({pinnedPosts.length} bài)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pinnedPosts.length > 0 ? (
            <div className="space-y-2">
              {pinnedPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex items-center gap-2 min-w-[60px]">
                    <Input
                      type="number"
                      value={post.pinOrder}
                      onChange={(e) => handleUpdatePinOrder(post.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center"
                      min={0}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{decodeHtmlEntities(post.title)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{post.author.displayName || post.author.username}</span>
                      <span>•</span>
                      <span>{post.viewCount} lượt xem</span>
                      <span>•</span>
                      <span>{post.commentCount} bình luận</span>
                    </div>
                  </div>
                  {post.category && (
                    <Badge 
                      variant="outline"
                      style={{ borderColor: post.category.color || undefined }}
                    >
                      {post.category.name}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnpinPost(post.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <PinOff className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              Chưa có bài viết nào được ghim
            </p>
          )}
        </CardContent>
      </Card>

      {/* User Roles & Top Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Phân loại người dùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <span className="font-medium">Admin</span>
                <Badge variant="destructive">{stats?.usersByRole?.ADMIN || 0}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <span className="font-medium">Moderator</span>
                <Badge variant="secondary">{stats?.usersByRole?.MODERATOR || 0}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20">
                <span className="font-medium">Thành viên</span>
                <Badge variant="outline">{stats?.usersByRole?.MEMBER || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Top danh mục
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topCategories?.length ? (
                stats.topCategories.map((category) => (
                  <div 
                    key={category.id} 
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color || '#6b7280' }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Badge variant="outline">{category.postCount} bài</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Chưa có danh mục nào</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Audit Logs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats?.recentActivities?.length ? (
                stats.recentActivities.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{getActivityText(activity)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Chưa có hoạt động nào</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pin className="h-5 w-5" />
              Nhật ký quản trị
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentLogs.length ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getAuditActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.targetType}
                        </Badge>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">{log.user?.username}</span>
                        {log.targetName && (
                          <span className="text-muted-foreground"> → {log.targetName}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Chưa có nhật ký nào</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
