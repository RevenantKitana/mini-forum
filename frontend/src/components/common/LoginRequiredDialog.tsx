import { Link, useNavigate } from 'react-router-dom';
import { Lock, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  requiredPermission?: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  redirectOnClose?: boolean;
}

const permissionLabels: Record<string, string> = {
  MEMBER: 'thành viên',
  MODERATOR: 'điều hành viên',
  ADMIN: 'quản trị viên',
};

export function LoginRequiredDialog({
  open,
  onOpenChange,
  title = 'Yêu cầu đăng nhập',
  description,
  requiredPermission = 'MEMBER',
  redirectOnClose = true,
}: LoginRequiredDialogProps) {
  const navigate = useNavigate();
  const permissionLabel = permissionLabels[requiredPermission] || 'thành viên';
  
  const defaultDescription = `Bạn cần đăng nhập để tiếp tục. Chỉ ${permissionLabel} trở lên mới có thể truy cập nội dung này.`;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && redirectOnClose) {
      navigate('/');
    }
    onOpenChange(newOpen);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[35vw] max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* Blurred background effect */}
              <div className="absolute inset-0 blur-xl opacity-20">
                <Lock className="h-20 w-20 text-muted-foreground" />
              </div>
              {/* Main icon */}
              <div className="relative bg-muted/50 rounded-full p-4">
                <Lock className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-xl text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button asChild className="w-full gap-2">
            <Link to="/login" onClick={() => onOpenChange(false)}>
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full gap-2">
            <Link to="/register" onClick={() => onOpenChange(false)}>
              <UserPlus className="h-4 w-4" />
              Đăng ký tài khoản mới
            </Link>
          </Button>
          <Button variant="ghost" onClick={handleGoBack} className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay về trang chủ
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của chúng tôi.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default LoginRequiredDialog;
