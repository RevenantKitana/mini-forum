import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Flag,
  Tags,
  FolderOpen,
  Settings,
  ChevronLeft,
  Shield,
  Menu,
  LogOut,
  ExternalLink,
  History,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Quản lý người dùng',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Quản lý bài viết',
    href: '/posts',
    icon: FileText,
  },
  {
    title: 'Quản lý bình luận',
    href: '/comments',
    icon: MessageSquare,
  },
  {
    title: 'Báo cáo vi phạm',
    href: '/reports',
    icon: Flag,
  },
  {
    title: 'Categories',
    href: '/categories',
    icon: FolderOpen,
  },
  {
    title: 'Tags',
    href: '/tags',
    icon: Tags,
  },
  {
    title: 'Audit Logs',
    href: '/audit-logs',
    icon: History,
  },
];

const bottomNavItems = [
  {
    title: 'Cài đặt',
    href: '/settings',
    icon: Settings,
  },
];

export function AdminLayout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMobileNavigate = useCallback((path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  }, [navigate]);

  const displayName = user?.displayName || user?.username || 'Admin';
  const avatarUrl = user?.avatarUrl;
  const roleLabel = isAdmin ? 'Administrator' : 'Moderator';

  // Shared navigation renderer
  const renderNavItems = (closeMobile?: boolean) => (
    <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
      {navItems.map((item) => {
        const isActive =
          item.href === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.href);

        return closeMobile ? (
          <button
            key={item.href}
            onClick={() => handleMobileNavigate(item.href)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.title}</span>
          </button>
        ) : (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            title={!sidebarOpen ? item.title : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const renderBottomNav = (closeMobile?: boolean) => (
    <div className="border-t p-2">
      {bottomNavItems.map((item) => {
        const isActive = location.pathname.startsWith(item.href);

        return closeMobile ? (
          <button
            key={item.href}
            onClick={() => handleMobileNavigate(item.href)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.title}</span>
          </button>
        ) : (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            title={!sidebarOpen ? item.title : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>{item.title}</span>}
          </Link>
        );
      })}

      {/* Link to main site */}
      <a
        href="http://localhost:5173"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title={!sidebarOpen ? 'Về trang chính' : undefined}
      >
        <ExternalLink className="h-5 w-5 flex-shrink-0" />
        {(sidebarOpen || closeMobile) && <span>Về trang chính</span>}
      </a>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile Header Bar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Mở menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">Admin Panel</span>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              'fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300',
              mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sliding panel */}
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-[70] w-[min(80vw,280px)] flex flex-col border-r bg-background',
              'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            {/* Mobile Sidebar Header */}
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm">Admin Panel</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* User Info (Mobile) */}
            <div className="border-b p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{roleLabel}</span>
                </div>
              </div>
            </div>

            {/* Navigation (Mobile) */}
            {renderNavItems(true)}

            {/* Bottom Nav (Mobile) */}
            {renderBottomNav(true)}

            {/* Logout (Mobile) */}
            <div className="border-t p-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300',
            sidebarOpen ? 'w-64' : 'w-16'
          )}
        >
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {sidebarOpen && (
              <Link to="/" className="flex items-center gap-2">
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
          {renderNavItems(false)}

          {/* Bottom Navigation */}
          {renderBottomNav(false)}

          {/* User Section */}
          {sidebarOpen && (
            <div className="border-t p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                      <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">{displayName}</span>
                      <span className="text-xs text-muted-foreground">{roleLabel}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Cài đặt
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </aside>
      )}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          isMobile ? 'mt-14' : (sidebarOpen ? 'ml-64' : 'ml-16')
        )}
      >
        <div className="container mx-auto p-4 md:p-6 animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
