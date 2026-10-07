import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { getAvatarUrl } from '@/utils/imageHelpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Input } from '@/app/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/common/NotificationBell';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';
import { FontSizeSelector } from '@/components/common/FontSizeSelector';
import { PostFormDialog } from '@/components/common/PostFormDialog';
import { MobileNav } from './MobileNav';
import {
  Search,
  User,
  LogOut,
  Settings,
  Bookmark,
  MessageSquare,
  UserX,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header role="banner" className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-md">
      <a href="#main-content" className="skip-to-main">Chuyển đến nội dung chính</a>
      {/* h-14 on mobile, h-16 on sm+ | px-4 mobile (16px), px-responsive on sm+ */}
      <div className="w-full flex h-14 sm:h-16 items-center px-4 sm:px-6 md:px-8 gap-2 sm:gap-4">
        {/* Mobile hamburger menu */}
        <MobileNav />

        {/* Logo - Left side */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all duration-200 flex-shrink-0 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-105">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl hidden sm:block tracking-tight">Forum</span>
        </Link>

        {/* Navigation - Center-left */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1.5 ml-2">
          <Link to="/">
            <Button 
              variant={location.pathname === '/' ? 'secondary' : 'ghost'} 
              size="sm"
              className="font-semibold text-sm sm:text-base h-9 sm:h-10 px-4 rounded-xl btn-press transition-all duration-200"
            >
              Trang chủ
            </Button>
          </Link>
          <Link to="/categories">
            <Button 
              variant={location.pathname === '/categories' ? 'secondary' : 'ghost'} 
              size="sm"
              className="font-semibold text-sm sm:text-base h-9 sm:h-10 px-4 rounded-xl btn-press transition-all duration-200"
            >
              Danh mục
            </Button>
          </Link>
          <Link to="/tags">
            <Button 
              variant={location.pathname === '/tags' ? 'secondary' : 'ghost'} 
              size="sm"
              className="font-semibold text-sm sm:text-base h-9 sm:h-10 px-4 rounded-xl btn-press transition-all duration-200"
            >
              Tags
            </Button>
          </Link>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search - Center */}
        <form onSubmit={handleSearch} className="hidden md:block flex-shrink">
          <div className="relative">
            <Search className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 transition-colors",
              isSearchFocused ? "text-primary" : "text-muted-foreground"
            )} />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              aria-label="Tìm kiếm bài viết"
              className={cn(
                "pl-10 pr-4 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 rounded-2xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring/30",
                "w-[clamp(200px,22vw,360px)]",
                isSearchFocused && "w-[clamp(240px,28vw,440px)] ring-1 ring-primary/30"
              )}
              style={{
                minWidth: 'min(200px, 100%)',
                maxWidth: 'min(440px, 40vw)'
              }}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px]"
            onClick={() => navigate('/search')}
            aria-label="Tìm kiếm"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* New Post Button - Only when authenticated */}
          {isAuthenticated && (
            <div className="hidden sm:block">
              <PostFormDialog mode="create" />
            </div>
          )}

          {/* Theme Switcher - hide on very small screens to save space */}
          <div className="hidden min-[400px]:block">
            <ThemeSwitcher />
          </div>

          {/* Font Size Selector - hide on small screens */}
          <div className="hidden sm:block">
            <FontSizeSelector />
          </div>

          {isAuthenticated && user ? (
            <>
              {/* Real Notification Bell */}
              <NotificationBell />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-full ml-1 btn-press p-0">
                    <Avatar className="h-9 w-9 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                      <AvatarImage src={getAvatarUrl(user, 'preview') || undefined} alt={user?.display_name || user?.username} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {(user?.display_name || user?.username || 'U')?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 min-w-[min(224px,calc(100vw-2rem))] animate-fade-in-scale">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{user?.display_name || user?.username || 'User'}</p>
                      <p className="text-xs text-muted-foreground">@{user?.username || 'unknown'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/users/${user?.username}`)} className="cursor-pointer transition-colors duration-150">
                    <User className="mr-2 h-4 w-4" />
                    Trang cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/bookmarks')} className="cursor-pointer transition-colors duration-150">
                    <Bookmark className="mr-2 h-4 w-4" />
                    Bài viết đã lưu
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings/profile')} className="cursor-pointer transition-colors duration-150">
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings/blocked')} className="cursor-pointer transition-colors duration-150">
                    <UserX className="mr-2 h-4 w-4" />
                    Đã chặn
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive transition-colors duration-150">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="btn-press transition-all duration-200 hidden min-[400px]:inline-flex h-10 px-4 text-sm font-semibold"
                onClick={() => navigate('/login', { state: { from: location } })}
              >
                <span className="hidden sm:inline">Đăng nhập</span>
                <span className="sm:hidden">Vào</span>
              </Button>
              <Button size="sm" onClick={() => navigate('/register')} className="btn-press h-10 px-4 text-sm font-semibold rounded-lg">
                Đăng ký
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
