import { Link } from 'react-router-dom';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface RestrictedContentProps {
  title: string;
  requiredPermission: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  type?: 'category' | 'post' | 'comment';
  className?: string;
}

const permissionLabels: Record<string, string> = {
  MEMBER: 'thành viên',
  MODERATOR: 'điều hành viên',
  ADMIN: 'quản trị viên',
};

export function RestrictedContent({
  title,
  requiredPermission,
  type = 'category',
  className = '',
}: RestrictedContentProps) {
  const { isAuthenticated } = useAuth();
  
  const permissionLabel = permissionLabels[requiredPermission] || 'người dùng được ủy quyền';
  
  const getMessage = () => {
    if (!isAuthenticated) {
      return `Vui lòng đăng nhập để xem nội dung này. Chỉ ${permissionLabel} trở lên mới có thể truy cập.`;
    }
    return `Bạn cần quyền ${permissionLabel} trở lên để xem nội dung này.`;
  };

  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="relative mb-6">
          {/* Blurred background icon */}
          <div className="absolute inset-0 blur-xl opacity-20">
            <Lock className="h-24 w-24 text-muted-foreground" />
          </div>
          {/* Main icon */}
          <div className="relative bg-muted/50 rounded-full p-4">
            {!isAuthenticated ? (
              <Lock className="h-12 w-12 text-muted-foreground" />
            ) : (
              <ShieldAlert className="h-12 w-12 text-orange-500" />
            )}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {getMessage()}
        </p>
        
        {!isAuthenticated && (
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Đăng nhập
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/register">
                Đăng ký
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
