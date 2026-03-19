import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile, useChangePassword, useUpdateAvatar } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { ArrowLeft, Save, User, Lock, AlertCircle, ImageIcon, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

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
  const { user, refreshUser } = useAuth();

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || user?.avatar || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
  );
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(user?.gender || '');

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
  const updateAvatarMutation = useUpdateAvatar();
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

  const handleAvatarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!avatarUrl.trim()) {
      toast.error('Vui lòng nhập URL ảnh đại diện');
      return;
    }

    try {
      await updateAvatarMutation.mutateAsync({
        avatar_url: avatarUrl.trim(),
      });

      // Refresh user from server to update auth context
      await refreshUser();
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Không thể cập nhật ảnh đại diện.');
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
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Cài đặt tài khoản</h1>
          <p className="text-muted-foreground">Quản lý thông tin cá nhân và bảo mật</p>
        </div>
      </div>

      {/* Avatar Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Ảnh đại diện
          </CardTitle>
          <CardDescription>
            Cập nhật ảnh đại diện bằng URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAvatarSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="text-xl">
                  {displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label htmlFor="avatarUrl">URL ảnh đại diện</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Nhập URL ảnh từ internet (hỗ trợ JPG, PNG, GIF, WebP)
                </p>
              </div>
            </div>
            <Button type="submit" disabled={updateAvatarMutation.isPending} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              {updateAvatarMutation.isPending ? 'Đang lưu...' : 'Cập nhật ảnh đại diện'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>
            Cập nhật thông tin hiển thị trên hồ sơ của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Tên người dùng</Label>
              <Input
                id="username"
                value={user.username}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Tên người dùng không thể thay đổi
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Tên hiển thị</Label>
              <Input
                id="displayName"
                placeholder="Tên của bạn"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Giới thiệu bản thân</Label>
              <Textarea
                id="bio"
                placeholder="Viết vài dòng giới thiệu về bản thân..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/500
              </p>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày sinh
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Giới tính</Label>
                <Select value={gender} onValueChange={(value) => setGender(value as 'male' | 'female' | 'other' | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={updateProfileMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>
            Cập nhật mật khẩu đăng nhập của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            {/* Stage 1 — Xác nhận mật khẩu hiện tại */}
            {!currentPasswordVerified ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleVerifyCurrentPassword())}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVerifyCurrentPassword}
                  disabled={!currentPassword.trim()}
                >
                  Tiếp theo →
                </Button>
              </div>
            ) : (
              /* Stage 2 — Mật khẩu mới + strength indicator */
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">Mật khẩu hiện tại đã xác nhận</span>
                  <button
                    type="button"
                    className="ml-auto text-xs text-primary hover:underline"
                    onClick={() => {
                      setCurrentPasswordVerified(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError('');
                      setPasswordStrength({ minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, matches: false });
                    }}
                  >
                    Thay đổi
                  </button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      validatePasswordStrength(e.target.value);
                    }}
                    placeholder="Tối thiểu 8 ký tự"
                  />
                  {newPassword && (
                    <div className="space-y-1 pt-1">
                      <StrengthItem ok={passwordStrength.minLength} label="Ít nhất 8 ký tự" />
                      <StrengthItem ok={passwordStrength.hasUppercase} label="Có chữ hoa (A-Z)" />
                      <StrengthItem ok={passwordStrength.hasLowercase} label="Có chữ thường (a-z)" />
                      <StrengthItem ok={passwordStrength.hasNumber} label="Có số (0-9)" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
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
                  />
                  {confirmPassword && (
                    <div className="pt-1">
                      <StrengthItem ok={passwordStrength.matches} label="Hai mật khẩu khớp nhau" />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
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
