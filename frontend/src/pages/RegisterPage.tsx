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
import { MessageSquare, Loader2, Eye, EyeOff, Check, X, ArrowRight, ArrowLeft, Mail, User, Lock, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import apiClient from '@/api/axios';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';

// Step 1: Email validation
const emailSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
});

// Step 2: Username and display name validation
const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(50, 'Tên đăng nhập tối đa 50 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ được sử dụng chữ, số và dấu gạch dưới'),
  displayName: z
    .string()
    .max(100, 'Tên hiển thị tối đa 100 ký tự')
    .optional(),
});

// Step 3: Password validation
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type UsernameFormData = z.infer<typeof usernameSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Ít nhất 8 ký tự', valid: password.length >= 8 },
    { label: 'Có chữ hoa', valid: /[A-Z]/.test(password) },
    { label: 'Có chữ thường', valid: /[a-z]/.test(password) },
    { label: 'Có số', valid: /[0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1 animate-slide-expand">
      {checks.map((check, index) => (
        <div key={index} className="flex items-center gap-2 text-xs transition-all duration-200">
          {check.valid ? (
            <Check className="h-3 w-3 text-green-500 animate-fade-in-scale" />
          ) : (
            <X className="h-3 w-3 text-muted-foreground" />
          )}
          <span className={cn(
            'transition-colors duration-200',
            check.valid ? 'text-green-500' : 'text-muted-foreground'
          )}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = [
    { icon: Mail, label: 'Email' },
    { icon: User, label: 'Thông tin' },
    { icon: Lock, label: 'Mật khẩu' },
  ];

  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = index + 1 === currentStep;
        const isCompleted = index + 1 < currentStep;

        return (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                isActive && 'border-primary bg-primary text-primary-foreground scale-110',
                isCompleted && 'border-green-500 bg-green-500 text-white',
                !isActive && !isCompleted && 'border-muted-foreground/30 text-muted-foreground/50'
              )}
            >
              {isCompleted ? (
                <Check className="h-5 w-5 animate-fade-in-scale" />
              ) : (
                <StepIcon className="h-5 w-5" />
              )}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  'w-12 h-1 mx-2 transition-colors duration-300',
                  isCompleted ? 'bg-green-500' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RegisterPage() {
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // Form data storage
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
  });

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check email availability
  const checkEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      return response.data.data;
    },
  });

  // Check username availability
  const checkUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiClient.get(`/auth/check-username?username=${encodeURIComponent(username)}`);
      return response.data.data;
    },
  });

  // Step 1: Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: formData.email },
  });

  // Step 2: Username form
  const usernameForm = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: formData.username, displayName: formData.displayName },
  });

  // Step 3: Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const password = passwordForm.watch('password', '');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Handle Step 1: Email submission
  const onSubmitEmail = async (data: EmailFormData) => {
    try {
      const result = await checkEmailMutation.mutateAsync(data.email);
      if (!result.available) {
        emailForm.setError('email', { message: 'Email này đã được sử dụng' });
        return;
      }
      setFormData((prev) => ({ ...prev, email: data.email }));
      setCurrentStep(2);
    } catch (error) {
      toast.error('Không thể kiểm tra email. Vui lòng thử lại.');
    }
  };

  // Handle Step 2: Username submission
  const onSubmitUsername = async (data: UsernameFormData) => {
    try {
      const result = await checkUsernameMutation.mutateAsync(data.username);
      if (!result.available) {
        usernameForm.setError('username', { message: 'Tên đăng nhập đã được sử dụng' });
        return;
      }
      setFormData((prev) => ({ 
        ...prev, 
        username: data.username, 
        displayName: data.displayName || data.username 
      }));
      setCurrentStep(3);
    } catch (error) {
      toast.error('Không thể kiểm tra tên đăng nhập. Vui lòng thử lại.');
    }
  };

  // Handle Step 3: Password submission and final registration
  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      await registerUser(formData.username, formData.email, data.password, formData.displayName);
      navigate('/');
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || 'Đăng ký thất bại';
        toast.error(message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Đăng ký thất bại');
      }
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
          <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Bước 1: Nhập địa chỉ email của bạn'}
            {currentStep === 2 && 'Bước 2: Chọn tên đăng nhập và tên hiển thị'}
            {currentStep === 3 && 'Bước 3: Tạo mật khẩu an toàn'}
          </CardDescription>
        </CardHeader>

        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* Step 1: Email */}
        {currentStep === 1 && (
          <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="animate-fade-in-up">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  autoComplete="email"
                  className="input-focus-animate"
                  disabled={checkEmailMutation.isPending}
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive animate-error-shake">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full btn-interactive" disabled={checkEmailMutation.isPending}>
                {checkEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    Tiếp tục
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </CardFooter>
          </form>
        )}

        {/* Step 2: Username and Display Name */}
        {currentStep === 2 && (
          <form onSubmit={usernameForm.handleSubmit(onSubmitUsername)} className="animate-fade-in-up">
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm animate-highlight-flash">
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{formData.email}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  autoComplete="username"
                  className="input-focus-animate"
                  disabled={checkUsernameMutation.isPending}
                  {...usernameForm.register('username')}
                />
                {usernameForm.formState.errors.username && (
                  <p className="text-sm text-destructive animate-error-shake">{usernameForm.formState.errors.username.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Chỉ được sử dụng chữ, số và dấu gạch dưới (_)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Tên hiển thị (không bắt buộc)</Label>
                <Input
                  id="displayName"
                  placeholder="John Doe"
                  className="input-focus-animate"
                  disabled={checkUsernameMutation.isPending}
                  {...usernameForm.register('displayName')}
                />
                {usernameForm.formState.errors.displayName && (
                  <p className="text-sm text-destructive">{usernameForm.formState.errors.displayName.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Tên hiển thị sẽ được hiển thị công khai trên hồ sơ của bạn
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="flex gap-3 w-full">
                <Button type="button" variant="outline" onClick={goBack} className="flex-1 btn-press">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <Button type="submit" className="flex-1 btn-interactive" disabled={checkUsernameMutation.isPending}>
                  {checkUsernameMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      Tiếp tục
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </form>
        )}

        {/* Step 3: Password */}
        {currentStep === 3 && (
          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="animate-fade-in-up">
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1 animate-highlight-flash">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tên đăng nhập: </span>
                  <span className="font-medium">@{formData.username}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="input-focus-animate"
                    disabled={passwordForm.formState.isSubmitting}
                    {...passwordForm.register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors btn-press"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 animate-icon-swap" /> : <Eye className="h-4 w-4 animate-icon-swap" />}
                  </button>
                </div>
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-destructive animate-error-shake">{passwordForm.formState.errors.password.message}</p>
                )}
                <PasswordStrength password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="input-focus-animate"
                    disabled={passwordForm.formState.isSubmitting}
                    {...passwordForm.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors btn-press"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 animate-icon-swap" /> : <Eye className="h-4 w-4 animate-icon-swap" />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive animate-error-shake">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="flex gap-3 w-full">
                <Button type="button" variant="outline" onClick={goBack} className="flex-1 btn-press">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <Button type="submit" className="flex-1 btn-interactive" disabled={passwordForm.formState.isSubmitting}>
                  {passwordForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo tài khoản...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Hoàn tất đăng ký
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
