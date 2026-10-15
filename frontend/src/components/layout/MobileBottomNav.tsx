import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, Search, Plus, Bell, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { PostFormDialog } from '@/components/common/PostFormDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { getAvatarUrl } from '@/utils/imageHelpers';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: countData } = useUnreadNotificationCount(isAuthenticated);
  const unreadCount = countData ?? 0;

  // Auto-hide on scroll down, show on scroll up
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    let lastScrollTop = 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollTop = scrollContainer.scrollTop;
          // Hide when scrolling down past 80px, show when scrolling up
          if (currentScrollTop > lastScrollTop && currentScrollTop > 80) {
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }
          lastScrollTop = Math.max(0, currentScrollTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Thanh điều hướng dưới"
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-40",
        "bg-background/90 dark:bg-background/95 backdrop-blur-lg border-t border-border/40 shadow-lg",
        "transition-transform duration-300 ease-in-out pb-[env(safe-area-inset-bottom)]",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex items-center justify-around h-13 px-2">
        {/* Tab 1: Trang chủ */}
        <Link
          to="/"
          onClick={handleHomeClick}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-1 transition-colors relative",
            location.pathname === '/' ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className={cn("h-5 w-5 transition-transform", location.pathname === '/' && "scale-110 stroke-[2.25]")} />
          <span className="text-[10px] font-medium mt-0.5">Trang chủ</span>
        </Link>

        {/* Tab 2: Tìm kiếm */}
        <Link
          to="/search"
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-1 transition-colors relative",
            location.pathname === '/search' ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Search className={cn("h-5 w-5 transition-transform", location.pathname === '/search' && "scale-110 stroke-[2.25]")} />
          <span className="text-[10px] font-medium mt-0.5">Tìm kiếm</span>
        </Link>

        {/* Tab 3: Tạo bài viết (Nút nổi bật ở giữa) */}
        <div className="flex-1 flex items-center justify-center">
          {isAuthenticated ? (
            <PostFormDialog
              mode="create"
              trigger={
                <button
                  type="button"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95 transition-all btn-press"
                  aria-label="Tạo bài viết mới"
                >
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                </button>
              }
            />
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: location } })}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95 transition-all btn-press"
              aria-label="Đăng nhập để tạo bài viết"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Tab 4: Thông báo */}
        <Link
          to={isAuthenticated ? "/notifications" : "/login"}
          state={!isAuthenticated ? { from: { pathname: '/notifications' } } : undefined}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-1 transition-colors relative",
            location.pathname === '/notifications' ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <Bell className={cn("h-5 w-5 transition-transform", location.pathname === '/notifications' && "scale-110 stroke-[2.25]")} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground animate-pop-in">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">Thông báo</span>
        </Link>

        {/* Tab 5: Cá nhân / Đăng nhập */}
        {isAuthenticated && user ? (
          <Link
            to={`/users/${user.username}`}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1 transition-colors relative",
              location.pathname.startsWith(`/users/${user.username}`) ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Avatar className={cn(
              "h-5.5 w-5.5 transition-transform ring-1",
              location.pathname.startsWith(`/users/${user.username}`) ? "ring-primary scale-110" : "ring-border/60"
            )}>
              <AvatarImage src={getAvatarUrl(user, 'preview') || undefined} alt={user.display_name || user.username} />
              <AvatarFallback className="text-[9px] font-bold">
                {(user.display_name || user.username || 'U')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-medium mt-0.5 truncate max-w-[50px]">Cá nhân</span>
          </Link>
        ) : (
          <Link
            to="/login"
            state={{ from: location }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1 transition-colors relative",
              location.pathname === '/login' ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LogIn className={cn("h-5 w-5 transition-transform", location.pathname === '/login' && "scale-110 stroke-[2.25]")} />
            <span className="text-[10px] font-medium mt-0.5">Đăng nhập</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
