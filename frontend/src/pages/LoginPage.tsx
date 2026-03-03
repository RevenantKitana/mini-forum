import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { MessageSquare, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập email hoặc tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.identifier, data.password);
      navigate('/');
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || 'Đăng nhập thất bại';
        toast.error(message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Đăng nhập thất bại');
      }
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary p-3 animate-fade-in-scale">
              <MessageSquare className="h-6 w-6 text-primary-foreground animate-float" />
            </div>
          </div>
          <CardTitle className="text-2xl">Chào mừng trở lại</CardTitle>
          <CardDescription>
            Nhập thông tin đăng nhập để truy cập tài khoản
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2 animate-stagger" style={{ '--stagger-index': 0 } as React.CSSProperties}>
              <Label htmlFor="identifier">Email hoặc Tên đăng nhập</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="email@example.com hoặc username"
                autoComplete="username"
                disabled={isSubmitting}
                className="input-focus-animate"
                {...register('identifier')}
              />
              {errors.identifier && (
                <p className="text-sm text-destructive animate-error-shake">{errors.identifier.message}</p>
              )}
            </div>
            <div className="space-y-2 animate-stagger" style={{ '--stagger-index': 1 } as React.CSSProperties}>
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="input-focus-animate"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors btn-press"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 animate-icon-swap" /> : <Eye className="h-4 w-4 animate-icon-swap" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive animate-error-shake">{errors.password.message}</p>
              )}
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="rounded-lg bg-muted p-4 text-sm animate-stagger hover:bg-muted/80 transition-colors" style={{ '--stagger-index': 2 } as React.CSSProperties}>
              <p className="font-medium mb-2">Tài khoản demo:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Admin: admin@forum.com / Admin@123</p>
                <p>Moderator: mod@forum.com / Moderator@123</p>
                <p>Member: john@example.com / Member@123</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full btn-interactive" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
