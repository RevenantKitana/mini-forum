import { useDashboardStats } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import {
  Users,
  FileText,
  MessageSquare,
  Flag,
  TrendingUp,
  UserPlus,
  Clock,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Không thể tải dữ liệu dashboard</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={stats.overview.totalUsers}
          description={`+${stats.today.newUsers} hôm nay`}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Tổng bài viết"
          value={stats.overview.totalPosts}
          description={`+${stats.today.newPosts} hôm nay`}
          icon={FileText}
          trend="up"
        />
        <StatCard
          title="Tổng bình luận"
          value={stats.overview.totalComments}
          description={`+${stats.today.newComments} hôm nay`}
          icon={MessageSquare}
          trend="up"
        />
        <StatCard
          title="Báo cáo chờ xử lý"
          value={stats.overview.pendingReports}
          description="Cần xem xét"
          icon={Flag}
          variant={stats.overview.pendingReports > 0 ? 'warning' : 'default'}
          href="/admin/reports"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng hoạt động</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Trong 30 ngày qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bài viết đã xuất bản</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.publishedPosts}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.overview.publishedPosts / stats.overview.totalPosts) * 100).toFixed(1)}% tổng số
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phân bố vai trò</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{stats.usersByRole.ADMIN} Admin</Badge>
              <Badge variant="secondary">{stats.usersByRole.MODERATOR} Mod</Badge>
              <Badge>{stats.usersByRole.MEMBER} Member</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Hoạt động gần đây
            </CardTitle>
            <CardDescription>10 hoạt động mới nhất trên hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivities.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top danh mục
            </CardTitle>
            <CardDescription>Danh mục có nhiều bài viết nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color || '#6b7280' }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <Badge variant="secondary">{category.postCount} bài viết</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <QuickLinkCard
          title="Quản lý người dùng"
          description="Xem và quản lý tài khoản"
          href="/admin/users"
          icon={Users}
        />
        <QuickLinkCard
          title="Quản lý bài viết"
          description="Kiểm duyệt nội dung"
          href="/admin/posts"
          icon={FileText}
        />
        <QuickLinkCard
          title="Xử lý báo cáo"
          description={`${stats.overview.pendingReports} đang chờ`}
          href="/admin/reports"
          icon={Flag}
        />
        <QuickLinkCard
          title="Thêm người dùng"
          description="Tạo tài khoản mới"
          href="/admin/users/new"
          icon={UserPlus}
        />
      </div>
    </div>
  );
}

// Sub-components
interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  variant?: 'default' | 'warning';
  href?: string;
}

function StatCard({ title, value, description, icon: Icon, variant = 'default', href }: StatCardProps) {
  const content = (
    <Card className={variant === 'warning' && value > 0 ? 'border-orange-300 bg-orange-50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}

interface QuickLinkCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function QuickLinkCard({ title, description, href, icon: Icon }: QuickLinkCardProps) {
  return (
    <Link to={href}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="pb-2">
          <Icon className="h-8 w-8 text-primary" />
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

interface ActivityItemProps {
  activity: {
    type: 'USER_REGISTERED' | 'POST_CREATED' | 'COMMENT_CREATED';
    data: any;
    createdAt: string;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'USER_REGISTERED':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'POST_CREATED':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'COMMENT_CREATED':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
    }
  };

  const getActivityText = () => {
    switch (activity.type) {
      case 'USER_REGISTERED':
        return (
          <span>
            <strong>{activity.data.displayName || activity.data.username}</strong> đã đăng ký
          </span>
        );
      case 'POST_CREATED':
        return (
          <span>
            <strong>{activity.data.author?.displayName || activity.data.author?.username}</strong>{' '}
            đăng bài "{activity.data.title}"
          </span>
        );
      case 'COMMENT_CREATED':
        return (
          <span>
            <strong>{activity.data.author?.displayName || activity.data.author?.username}</strong>{' '}
            bình luận trong "{activity.data.post?.title}"
          </span>
        );
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{getActivityIcon()}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm">{getActivityText()}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: vi })}
        </p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
