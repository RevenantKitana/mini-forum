import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Flag,
  Settings,
  ChevronLeft,
  Shield,
  Menu,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Quản lý người dùng',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Quản lý bài viết',
    href: '/admin/posts',
    icon: FileText,
  },
  {
    title: 'Quản lý bình luận',
    href: '/admin/comments',
    icon: MessageSquare,
  },
  {
    title: 'Báo cáo vi phạm',
    href: '/admin/reports',
    icon: Flag,
  },
];

export function AdminLayout() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user is admin or moderator
  const userRole = user?.role;
  const isAdmin = userRole === 'ADMIN';
  const isModerator = userRole === 'MODERATOR';

  if (!isAuthenticated || (!isAdmin && !isModerator)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen && (
            <Link to="/admin" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold">Admin Panel</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(!sidebarOpen && 'mx-auto')}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  !sidebarOpen && 'justify-center'
                )}
                title={!sidebarOpen ? item.title : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <Link
            to="/"
            className={cn(
              'flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground',
              !sidebarOpen && 'justify-center'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            {sidebarOpen && <span>Quay lại trang chủ</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {adminNavItems.find(
                (item) =>
                  item.href === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.href)
              )?.title || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Xin chào, <span className="font-medium text-foreground">{user?.displayName}</span>
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-1 text-xs font-medium',
                isAdmin ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              )}
            >
              {isAdmin ? 'Admin' : 'Moderator'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
