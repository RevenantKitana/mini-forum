import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
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
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { PostFormDialog } from '@/components/common/PostFormDialog';
import { MobileNav } from './MobileNav';
import {
  Search,
  User,
  LogOut,
  Settings,
  Bookmark,
  MessageSquare,
  Shield,
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

  const isAdmin = user?.role === 'ADMIN';
  const isModerator = user?.role === 'MODERATOR' || isAdmin;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-14 items-center px-responsive gap-responsive">
        {/* Mobile hamburger menu */}
        <MobileNav />

        {/* Logo - Left side */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 flex-shrink-0 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3">
            <MessageSquare className="h-4 w-4" />
          </div>
          <span className="font-bold text-responsive-lg hidden sm:block">Forum</span>
        </Link>

        {/* Navigation - Center-left */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/">
            <Button 
              variant={location.pathname === '/' ? 'secondary' : 'ghost'} 
              size="sm"
              className="font-medium btn-press transition-all duration-200"
            >
              Trang chủ
            </Button>
          </Link>
          <Link to="/categories">
            <Button 
              variant={location.pathname === '/categories' ? 'secondary' : 'ghost'} 
              size="sm"
              className="font-medium btn-press transition-all duration-200"
            >
              Danh mục
            </Button>
          </Link>
          <Link to="/tags">
            <Button 
              variant={location.pathname === '/tags' ? 'secondary' : 'ghost'} 
              size="sm"
              className="font-medium btn-press transition-all duration-200"
            >
              Tags
            </Button>
          </Link>
          {isModerator && (
            <Link to="/admin">
              <Button 
                variant={location.pathname.startsWith('/admin') ? 'secondary' : 'ghost'} 
                size="sm"
                className="font-medium gap-1 btn-press transition-all duration-200"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Button>
            </Link>
          )}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search - Center */}
        <form onSubmit={handleSearch} className="hidden md:block flex-shrink">
          <div className="relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
              isSearchFocused ? "text-primary" : "text-muted-foreground"
            )} />
            <Input
              type="search"
              placeholder="Tìm kiếm bài viết..."
              className={cn(
                "pl-9 pr-4 h-9 transition-all duration-200",
                "w-[clamp(180px,20vw,320px)]",
                isSearchFocused && "w-[clamp(220px,25vw,400px)] ring-2 ring-primary/20"
              )}
              style={{
                minWidth: 'min(180px, 100%)',
                maxWidth: 'min(400px, 40vw)'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
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

          {/* Theme Toggle */}
          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              {/* Real Notification Bell */}
              <NotificationBell />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1 btn-press">
                    <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.displayName || user?.username} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {(user?.displayName || user?.username || 'U')?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 animate-fade-in-scale">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.displayName || user?.username || 'User'}</p>
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
              <Button variant="ghost" size="sm" className="btn-press transition-all duration-200" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
              <Button size="sm" onClick={() => navigate('/register')} className="btn-press">
                Đăng ký
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
