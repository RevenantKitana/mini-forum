import { useEffect, useState } from 'react';
import { adminService, AdminUser } from '@/api/services/adminService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MoreHorizontal, Search, ChevronLeft, ChevronRight, 
  Shield, UserX, UserCheck, Trash2, ExternalLink
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await adminService.getUsers(params);
      setUsers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      await adminService.changeUserRole(userId.toString(), newRole);
      toast.success(`Đã thay đổi vai trò thành ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật vai trò');
    }
  };

  const handleToggleBan = async (user: AdminUser) => {
    try {
      if (user.isActive) {
        await adminService.banUser(user.id.toString());
        toast.success('Đã cấm người dùng');
      } else {
        await adminService.unbanUser(user.id.toString());
        toast.success('Đã bỏ cấm người dùng');
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thực hiện thao tác');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) return;

    try {
      await adminService.deleteUser(userId.toString());
      toast.success('Đã xóa người dùng');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa người dùng');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return <Badge variant="destructive" className="bg-red-600">Admin</Badge>;
      case 'MODERATOR':
        return <Badge variant="secondary" className="bg-blue-600 text-white">Mod</Badge>;
      case 'BOT':
        return <Badge variant="secondary" className="bg-emerald-600 text-white">Bot</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean, isVerified: boolean) => {
    const badges = [];
    
    if (!isActive) {
      badges.push(<Badge key="banned" variant="destructive">Bị cấm</Badge>);
    } else {
      badges.push(<Badge key="active" variant="success">Hoạt động</Badge>);
    }
    
    if (isVerified) {
      badges.push(
        <Badge key="verified" variant="outline" className="text-green-600 border-green-600">
          ✓ Xác thực
        </Badge>
      );
    }

    return <div className="flex gap-1 flex-wrap">{badges}</div>;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive bg-destructive/10 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
        <p className="text-muted-foreground">
          Xem và quản lý tất cả người dùng trong hệ thống ({total} người dùng)
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MODERATOR">Moderator</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="BOT">Bot</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Bị cấm</SelectItem>
            <SelectItem value="verified">Đã xác thực</SelectItem>
            <SelectItem value="unverified">Chưa xác thực</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right hidden md:table-cell">Bài viết</TableHead>
              <TableHead className="text-right hidden md:table-cell">Bình luận</TableHead>
              <TableHead className="hidden lg:table-cell">Ngày tham gia</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy người dùng nào
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>
                          {user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.displayName || user.username}
                        </div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm hidden sm:table-cell">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.isActive, user.isVerified)}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{user._count?.posts || 0}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{user._count?.comments || 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <a
                            href={`http://localhost:5173/users/${user.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Xem hồ sơ
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Shield className="mr-2 h-4 w-4" />
                            Thay đổi vai trò
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem 
                              onClick={() => handleChangeRole(user.id, 'MEMBER')}
                              disabled={user.role === 'MEMBER'}
                            >
                              Member
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleChangeRole(user.id, 'MODERATOR')}
                              disabled={user.role === 'MODERATOR'}
                            >
                              Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleChangeRole(user.id, 'ADMIN')}
                              disabled={user.role === 'ADMIN'}
                            >
                              Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleChangeRole(user.id, 'BOT')}
                              disabled={user.role === 'BOT'}
                            >
                              Bot
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={() => handleToggleBan(user)}>
                          {user.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Cấm người dùng
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Bỏ cấm
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa người dùng
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Trang {page} / {totalPages} ({total} người dùng)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
