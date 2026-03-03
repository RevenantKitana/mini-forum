import { useState, useEffect, useCallback } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';
import { Button } from '@/app/components/ui/button';
import { Loader2, RefreshCw, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OtpVerificationProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  isVerifying: boolean;
  error?: string | null;
  expiresIn: number; // seconds
  resendDelay?: number; // seconds, default 60
}

export function OtpVerification({
  email,
  onVerify,
  onResend,
  isVerifying,
  error,
  expiresIn,
  resendDelay = 60,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(expiresIn);
  const [resendCountdown, setResendCountdown] = useState(resendDelay);
  const [isResending, setIsResending] = useState(false);

  // Expiration countdown
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Resend delay countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && !isVerifying) {
      onVerify(otp);
    }
  }, [otp, isVerifying, onVerify]);

  const handleResend = useCallback(async () => {
    setIsResending(true);
    try {
      await onResend();
      setOtp('');
      setResendCountdown(resendDelay);
      // Reset expiration countdown
      setCountdown(expiresIn);
    } catch {
      // Error handled by parent
    } finally {
      setIsResending(false);
    }
  }, [onResend, resendDelay, expiresIn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = countdown <= 0;

  return (
    <div className="space-y-6">
      {/* Email display */}
      <div className="p-3 bg-muted rounded-lg text-sm text-center">
        <span className="text-muted-foreground">Mã OTP đã gửi đến: </span>
        <span className="font-medium">{email}</span>
      </div>

      {/* OTP Input */}
      <div className="flex flex-col items-center space-y-4">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}
          disabled={isVerifying || isExpired}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <span className="mx-1 text-muted-foreground">-</span>
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        {/* Loading indicator */}
        {isVerifying && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in-up">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang xác thực...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive text-center animate-error-shake">
            {error}
          </p>
        )}

        {/* Expiration timer */}
        <div className={cn(
          'flex items-center gap-2 text-sm',
          isExpired ? 'text-destructive' : 'text-muted-foreground'
        )}>
          <Timer className="h-4 w-4" />
          {isExpired ? (
            <span>Mã OTP đã hết hạn</span>
          ) : (
            <span>Hết hạn sau: {formatTime(countdown)}</span>
          )}
        </div>
      </div>

      {/* Resend section */}
      <div className="text-center">
        {resendCountdown > 0 ? (
          <p className="text-sm text-muted-foreground">
            Gửi lại mã sau {resendCountdown}s
          </p>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={isResending}
            className="text-primary"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi lại...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Gửi lại mã OTP
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
