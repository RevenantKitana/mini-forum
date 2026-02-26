import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý cài đặt tài khoản và hệ thống
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
          <CardDescription>
            Thông tin cơ bản của tài khoản quản trị
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tên người dùng</Label>
              <Input value={user?.username || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Tên hiển thị</Label>
              <Input value={user?.displayName || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Input value={user?.role || ''} disabled />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Để thay đổi thông tin tài khoản, vui lòng truy cập trang chính của diễn đàn.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt hệ thống</CardTitle>
          <CardDescription>
            Các cài đặt chung của hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Thời gian chỉnh sửa bình luận</div>
                <div className="text-sm text-muted-foreground">
                  Người dùng có thể chỉnh sửa bình luận trong vòng 30 phút sau khi đăng
                </div>
              </div>
              <Badge variant="secondary">30 phút</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Phiên bản API</div>
                <div className="text-sm text-muted-foreground">
                  Phiên bản hiện tại của backend API
                </div>
              </div>
              <Badge variant="outline">v1</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">URL Frontend</div>
                <div className="text-sm text-muted-foreground">
                  Đường dẫn đến trang chủ diễn đàn
                </div>
              </div>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                localhost:5173
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Vùng nguy hiểm</CardTitle>
          <CardDescription>
            Các hành động không thể hoàn tác
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Đăng xuất khỏi tất cả thiết bị</div>
              <div className="text-sm text-muted-foreground">
                Hủy tất cả phiên đăng nhập của tài khoản này
              </div>
            </div>
            <Button variant="destructive" disabled>
              Đăng xuất tất cả
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
