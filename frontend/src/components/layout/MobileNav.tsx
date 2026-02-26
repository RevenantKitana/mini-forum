import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Home, FileText, User, LogIn, LogOut, Settings, Shield, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { Separator } from '@/app/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { PostFormDialog } from '@/components/common/PostFormDialog';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isModerator = user?.role === 'MODERATOR';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('md:hidden', className)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="text-left">Mini Forum</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigate('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Trang chủ
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleNavigate('/search')}
            >
              <Search className="mr-2 h-4 w-4" />
              Tìm kiếm
            </Button>
          </div>

          <Separator />

          {/* User Section */}
          {isAuthenticated ? (
            <div className="space-y-1">
              <p className="px-3 text-sm font-medium text-muted-foreground mb-2">
                Xin chào, {user?.displayName || user?.username}
              </p>
              <PostFormDialog
                mode="create"
                trigger={
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Tạo bài viết
                  </Button>
                }
              />
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigate(`/users/${user?.username}`)}
              >
                <User className="mr-2 h-4 w-4" />
                Trang cá nhân
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigate('/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Cài đặt
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigate('/login')}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Đăng nhập
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigate('/register')}
              >
                <User className="mr-2 h-4 w-4" />
                Đăng ký
              </Button>
            </div>
          )}

          {/* Admin Section */}
          {(isAdmin || isModerator) && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="px-3 text-sm font-medium text-muted-foreground mb-2">
                  Quản trị
                </p>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigate('/admin')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              </div>
            </>
          )}

          {/* Logout */}
          {isAuthenticated && (
            <>
              <Separator />
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </Button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
