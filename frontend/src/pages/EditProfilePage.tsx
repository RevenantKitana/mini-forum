import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile, useChangePassword, useMyProfile } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Skeleton } from '@/app/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, Lock, AlertCircle, ImageIcon, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AvatarCropDialog } from '@/components/profile/AvatarCropDialog';

// Helper: password strength row indicator
function StrengthItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
      {ok
        ? <CheckCircle2 className="h-3 w-3 shrink-0" />
        : <XCircle className="h-3 w-3 shrink-0" />
      }
      <span>{label}</span>
    </div>
  );
}

export function EditProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const { data: myProfile, isLoading: isProfileLoading } = useMyProfile(!!user);

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (myProfile && !isFormInitialized) {
      setDisplayName(myProfile.display_name || '');
      setBio(myProfile.bio || '');
      setDateOfBirth(
        myProfile.date_of_birth ? new Date(myProfile.date_of_birth).toISOString().split('T')[0] : ''
      );
      setGender((myProfile.gender as 'male' | 'female' | 'other') || '');
      setIsFormInitialized(true);
    }
  }, [myProfile, isFormInitialized]);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  // Password 2-stage state
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    matches: false,
  });

  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfileMutation.mutateAsync({
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        gender: gender || null,
      });

      // Refresh user from server to update auth context
      await refreshUser();
      toast.success('Cập nhật thông tin thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Không thể cập nhật thông tin cá nhân.');
    }
  };

  const validatePasswordStrength = (password: string, confirmPwd = confirmPassword) => {
    setPasswordStrength({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      matches: confirmPwd === password && password.length > 0,
    });
  };

  const handleVerifyCurrentPassword = () => {
    if (!currentPassword.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    setPasswordError('');
    setCurrentPasswordVerified(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const allValid =
      passwordStrength.minLength &&
      passwordStrength.hasUppercase &&
      passwordStrength.hasLowercase &&
      passwordStrength.hasNumber &&
      passwordStrength.matches;

    if (!allValid) {
      setPasswordError('Mật khẩu chưa đáp ứng tất cả yêu cầu');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      // Clear form and reset to stage 1
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPasswordVerified(false);
      setPasswordStrength({ minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, matches: false });

    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setCurrentPasswordVerified(false);
        setCurrentPassword('');
        setPasswordError('Mật khẩu hiện tại không đúng. Vui lòng thử lại.');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Không thể đổi mật khẩu.');
      }
    }
  };

  if (!user) {
    navigate('/login', { state: { from: location } });
    return null;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl xl:max-w-5xl mx-auto w-full space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl hover:bg-muted btn-press"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Cài đặt tài khoản</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>
      </div>

      {/* Avatar Settings */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
        <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
            <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Ảnh đại diện
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground mt-1">
            Tải lên ảnh đại diện từ máy tính của bạn. Hỗ trợ cắt và điều chỉnh ảnh trước khi lưu.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-2 sm:pt-2">
          <AvatarCropDialog />
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
        <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground mt-1">
            Cập nhật thông tin hiển thị công khai trên hồ sơ của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-2 sm:pt-2">
          {isProfileLoading && !isFormInitialized ? (
            <div className="space-y-4 py-2">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm sm:text-base font-semibold">Tên người dùng</Label>
                <Input
                  id="username"
                  value={user.username}
                  disabled
                  className="h-11 text-sm sm:text-base rounded-xl bg-muted/50 border-0"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Tên người dùng là định danh cố định không thể thay đổi
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm sm:text-base font-semibold">Tên hiển thị</Label>
                <Input
                  id="displayName"
                  placeholder="Nhập tên hiển thị của bạn"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="h-11 text-sm sm:text-base rounded-xl bg-muted/30 border-0 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm sm:text-base font-semibold">Giới thiệu bản thân</Label>
                <Textarea
                  id="bio"
                  placeholder="Viết vài dòng giới thiệu về bản thân..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="text-sm sm:text-base rounded-xl bg-muted/30 border-0 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20 leading-relaxed"
                />
                <p className="text-xs sm:text-sm text-muted-foreground text-right">
                  {bio.length}/500
                </p>
              </div>

              <Separator className="my-2 bg-border/40" />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Ngày sinh
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="h-11 text-sm sm:text-base rounded-xl bg-muted/30 border-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm sm:text-base font-semibold">Giới tính</Label>
                  <Select value={gender} onValueChange={(value) => setGender(value as 'male' | 'female' | 'other' | '')}>
                    <SelectTrigger className="h-11 text-sm sm:text-base rounded-xl bg-muted/30 border-0">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg">
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="h-11 px-6 text-sm sm:text-base font-semibold rounded-xl w-full sm:w-auto btn-press"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
        <CardHeader className="p-6 sm:p-8 pb-4 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
            <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground mt-1">
            Cập nhật mật khẩu bảo mật tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-2 sm:pt-2">
          {passwordError && (
            <Alert variant="destructive" className="mb-5 rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{passwordError}</AlertDescription>
            </Alert>
          )}

          {/* Stage 1 — Xác nhận mật khẩu hiện tại */}
          {!currentPasswordVerified ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm sm:text-base font-semibold">Mật khẩu hiện tại</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại của bạn"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleVerifyCurrentPassword())}
                  className="h-11 text-sm sm:text-base rounded-xl bg-muted/30 border-0"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleVerifyCurrentPassword}
                disabled={!currentPassword.trim()}
                className="h-11 px-6 text-sm sm:text-base font-semibold rounded-xl border-0 bg-muted/40 hover:bg-muted/70 btn-press"
              >
                Tiếp theo →
              </Button>
            </div>
          ) : (
            /* Stage 2 — Mật khẩu mới + strength indicator */
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="flex items-center gap-2 text-sm sm:text-base bg-green-500/10 text-green-700 dark:text-green-300 p-3 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="font-medium">Mật khẩu hiện tại đã xác nhận chính xác</span>
                <button
                  type="button"
                  className="ml-auto text-xs sm:text-sm font-semibold text-primary hover:underline"
                  onClick={() => {
                    setCurrentPasswordVerified(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                    setPasswordStrength({ minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, matches: false });
                  }}
                >
                  Đổi lại
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm sm:text-base font-semibold">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    validatePasswordStrength(e.target.value);
                  }}
                  placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số"
                  className="h-11 text-sm sm:text-base rounded-xl bg-muted/30 border-0"
                />
                {newPassword && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 bg-muted/20 p-3 rounded-xl">
                    <StrengthItem ok={passwordStrength.minLength} label="≥ 8 ký tự" />
                    <StrengthItem ok={passwordStrength.hasUppercase} label="Chữ hoa (A-Z)" />
                    <StrengthItem ok={passwordStrength.hasLowercase} label="Chữ thường (a-z)" />
                    <StrengthItem ok={passwordStrength.hasNumber} label="Số (0-9)" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm sm:text-base font-semibold">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordStrength(prev => ({
                      ...prev,
                      matches: e.target.value === newPassword && e.target.value.length > 0,
                    }));
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                  className="h-11 text-sm sm:text-base rounded-xl bg-muted/30 border-0"
                />
                {confirmPassword && (
                  <div className="pt-1">
                    <StrengthItem ok={passwordStrength.matches} label="Hai mật khẩu hoàn toàn khớp nhau" />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="h-11 px-6 text-sm sm:text-base font-semibold rounded-xl btn-press"
                disabled={
                  changePasswordMutation.isPending ||
                  !passwordStrength.minLength ||
                  !passwordStrength.hasUppercase ||
                  !passwordStrength.hasLowercase ||
                  !passwordStrength.hasNumber ||
                  !passwordStrength.matches
                }
              >
                <Lock className="h-4 w-4 mr-2" />
                {changePasswordMutation.isPending ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
