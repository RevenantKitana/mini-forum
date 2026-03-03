import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { KeyRound, Loader2, Eye, EyeOff, Check, X, ArrowRight, ArrowLeft, Mail, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { cn } from '@/lib/utils';
import { OtpVerification } from '@/components/auth/OtpVerification';
import { sendOtpReset, verifyOtpReset, resetPassword } from '@/api/services/authService';

// Step 1: Email
const emailSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
});

// Step 3: New password
const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type EmailFormData = z.infer<typeof emailSchema>;
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

// Step indicator
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = [
    { icon: Mail, label: 'Email' },
    { icon: ShieldCheck, label: 'Xác thực' },
    { icon: Lock, label: 'Mật khẩu mới' },
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

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // State
  const [email, setEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Step 3: Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = passwordForm.watch('newPassword', '');

  // Handle Step 1: Send OTP
  const onSubmitEmail = async (data: EmailFormData) => {
    setIsSendingOtp(true);
    try {
      const result = await sendOtpReset(data.email);
      setEmail(data.email);
      setVerificationToken(result.verificationToken);
      if (result.expiresIn) {
        setOtpExpiresIn(result.expiresIn);
      }
      setOtpError(null);
      setCurrentStep(2);
      toast.success('Nếu email tồn tại, mã OTP đã được gửi');
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.';
        toast.error(message);
      } else {
        toast.error('Không thể gửi mã OTP. Vui lòng thử lại.');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = useCallback(async (otp: string) => {
    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const result = await verifyOtpReset(email, verificationToken, otp);
      setResetToken(result.resetToken);
      toast.success('Xác thực thành công! Hãy đặt mật khẩu mới');
      setCurrentStep(3);
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;
        const message = data?.message || 'Mã OTP không hợp lệ';
        if (data?.attemptsRemaining !== undefined) {
          setOtpError(`${message} (còn ${data.attemptsRemaining} lần thử)`);
        } else {
          setOtpError(message);
        }
      } else {
        setOtpError('Xác thực thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [email, verificationToken]);

  // Handle OTP resend
  const handleResendOtp = useCallback(async () => {
    try {
      const result = await sendOtpReset(email);
      setVerificationToken(result.verificationToken);
      if (result.expiresIn) {
        setOtpExpiresIn(result.expiresIn);
      }
      setOtpError(null);
      toast.success('Mã OTP mới đã được gửi');
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || 'Không thể gửi lại mã OTP';
        toast.error(message);
      } else {
        toast.error('Không thể gửi lại mã OTP');
      }
      throw error;
    }
  }, [email]);

  // Handle Step 3: Reset password
  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      await resetPassword(email, resetToken, data.newPassword);
      setIsResetSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || 'Đặt lại mật khẩu thất bại';
        toast.error(message);
      } else {
        toast.error('Đặt lại mật khẩu thất bại');
      }
    }
  };

  // Go back
  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Success screen
  if (isResetSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md animate-fade-in-up">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-500 p-3 animate-fade-in-scale">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Đặt lại mật khẩu thành công!</CardTitle>
            <CardDescription>
              Bạn có thể đăng nhập bằng mật khẩu mới
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full btn-interactive"
              onClick={() => navigate('/login')}
            >
              Đăng nhập ngay
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary p-3 animate-fade-in-scale">
              <KeyRound className="h-6 w-6 text-primary-foreground animate-float" />
            </div>
          </div>
          <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Nhập email để nhận mã xác thực'}
            {currentStep === 2 && 'Nhập mã OTP đã gửi đến email'}
            {currentStep === 3 && 'Tạo mật khẩu mới cho tài khoản'}
          </CardDescription>
        </CardHeader>

        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* Step 1: Email */}
        {currentStep === 1 && (
          <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="animate-fade-in-up">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="email@example.com"
                  autoComplete="email"
                  className="input-focus-animate"
                  disabled={isSendingOtp}
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive animate-error-shake">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full btn-interactive" disabled={isSendingOtp}>
                {isSendingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi mã OTP...
                  </>
                ) : (
                  <>
                    Gửi mã xác thực
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Nhớ mật khẩu?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </CardFooter>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {currentStep === 2 && (
          <div className="animate-fade-in-up">
            <CardContent>
              <OtpVerification
                email={email}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                isVerifying={isVerifyingOtp}
                error={otpError}
                expiresIn={otpExpiresIn}
                resendDelay={60}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="button" variant="outline" onClick={goBack} className="w-full btn-press">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại nhập email
              </Button>
            </CardFooter>
          </div>
        )}

        {/* Step 3: New Password */}
        {currentStep === 3 && (
          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="animate-fade-in-up">
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm animate-highlight-flash flex items-center gap-2">
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{email}</span>
                <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="input-focus-animate"
                    disabled={passwordForm.formState.isSubmitting}
                    {...passwordForm.register('newPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors btn-press"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 animate-icon-swap" /> : <Eye className="h-4 w-4 animate-icon-swap" />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive animate-error-shake">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
                <PasswordStrength password={newPassword} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
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
                  <p className="text-sm text-destructive animate-error-shake">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full btn-interactive" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đặt lại mật khẩu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Đặt lại mật khẩu
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
