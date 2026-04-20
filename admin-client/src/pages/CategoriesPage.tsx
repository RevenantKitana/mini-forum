import { useEffect, useState } from 'react';
import { adminService, AdminCategory } from '@/api/services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, Plus, Pencil, Trash2, Eye, EyeOff, 
  FolderOpen, GripVertical, Shield
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  view_permission: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  post_permission: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  comment_permission: 'MEMBER' | 'MODERATOR' | 'ADMIN';
}

const defaultFormData: CategoryFormData = {
  name: '',
  description: '',
  color: '#6366f1',
  sort_order: 0,
  is_active: true,
  view_permission: 'ALL',
  post_permission: 'MEMBER',
  comment_permission: 'MEMBER',
};

const colorPresets = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCategories(true);
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setDialogMode('create');
    setEditingCategory(null);
    setFormData({
      ...defaultFormData,
      sort_order: categories.length,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: AdminCategory) => {
    setDialogMode('edit');
    setEditingCategory(category);
    // Ensure postPermission and commentPermission have valid values (not 'ALL' for these fields)
    const validPostPerm = (category.post_permission === 'ALL') ? 'MEMBER' : category.post_permission;
    const validCommentPerm = (category.comment_permission === 'ALL') ? 'MEMBER' : category.comment_permission;
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#6366f1',
      sort_order: category.sort_order,
      is_active: category.is_active,
      view_permission: category.view_permission || 'ALL',
      post_permission: validPostPerm || 'MEMBER',
      comment_permission: validCommentPerm || 'MEMBER',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Tên danh mục là bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      if (dialogMode === 'create') {
        await adminService.createCategory({
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color || undefined,
          sortOrder: formData.sort_order,
          isActive: formData.is_active,
          viewPermission: formData.view_permission,
          postPermission: formData.post_permission,
          commentPermission: formData.comment_permission,
        });
        toast.success('Đã tạo danh mục mới');
      } else if (editingCategory) {
        await adminService.updateCategory(editingCategory.id.toString(), {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          sortOrder: formData.sort_order,
          isActive: formData.is_active,
          viewPermission: formData.view_permission,
          postPermission: formData.post_permission,
          commentPermission: formData.comment_permission,
        });
        toast.success('Đã cập nhật danh mục');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể lưu danh mục');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (category: AdminCategory) => {
    try {
      await adminService.updateCategory(category.id.toString(), {
        isActive: !category.is_active,
      });
      toast.success(category.is_active ? 'Đã ẩn danh mục' : 'Đã hiện danh mục');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thực hiện thao tác');
    }
  };

  const handleDelete = async (category: AdminCategory) => {
    if (category.post_count > 0 || (category.actual_post_count && category.actual_post_count > 0)) {
      toast.error('Không thể xóa danh mục có bài viết. Vui lòng di chuyển hoặc xóa bài viết trước.');
      return;
    }
    
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) return;

    try {
      await adminService.deleteCategory(category.id.toString());
      toast.success('Đã xóa danh mục');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa danh mục');
    }
  };

  if (loading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Categories</h1>
          <p className="text-muted-foreground">
            Quản lý các danh mục của diễn đàn ({categories.length} danh mục)
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Danh sách danh mục
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">STT</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-center">Bài viết</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chưa có danh mục nào
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} className={!category.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        {category.sort_order}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color || '#6366f1' }}
                        />
                        <div>
                          <div className="font-medium">
                            {category.name}
                          </div>
                          <div className="text-xs text-muted-foreground">/{category.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] text-sm text-muted-foreground truncate">
                        {category.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {category.actual_post_count ?? category.post_count} bài
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div>
                          {category.is_active ? (
                            <Badge variant="success">Hiện</Badge>
                          ) : (
                            <Badge variant="secondary">Ẩn</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Xem: {category.view_permission === 'ALL' ? 'Tất cả' : 
                                category.view_permission === 'MEMBER' ? 'Thành viên' :
                                category.view_permission === 'MODERATOR' ? 'Điều hành' : 
                                category.view_permission === 'ADMIN' ? 'Admin' : 'Tất cả'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Đăng: {category.post_permission === 'MEMBER' ? 'Thành viên' :
                                 category.post_permission === 'MODERATOR' ? 'Điều hành' : 'Admin'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          BL: {category.comment_permission === 'MEMBER' ? 'Thành viên' :
                               category.comment_permission === 'MODERATOR' ? 'Điều hành' : 'Admin'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(category.created_at)}
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
                          <DropdownMenuItem onClick={() => handleOpenEdit(category)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(category)}>
                            {category.is_active ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Ẩn danh mục
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Hiện danh mục
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(category)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa danh mục
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'create' ? 'Tạo danh mục mới' : 'Chỉnh sửa danh mục'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'create' 
                  ? 'Thêm một danh mục mới cho diễn đàn'
                  : 'Cập nhật thông tin danh mục'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên danh mục *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên danh mục"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn về danh mục"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Thứ tự sắp xếp</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              <div className="grid gap-2">
                <Label>Màu sắc</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Hiển thị trên Frontend</Label>
                  <div className="text-sm text-muted-foreground">
                    Danh mục sẽ được hiển thị cho người dùng
                  </div>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              {/* Permissions Section */}
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  <Label className="font-medium">Phân quyền</Label>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="viewPermission">Ai được xem bài viết?</Label>
                  <Select
                    value={formData.view_permission}
                    onValueChange={(value: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN') => 
                      setFormData({ ...formData, view_permission: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quyền" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả (bao gồm khách)</SelectItem>
                      <SelectItem value="MEMBER">Thành viên trở lên</SelectItem>
                      <SelectItem value="MODERATOR">Điều hành viên trở lên</SelectItem>
                      <SelectItem value="ADMIN">Chỉ Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="postPermission">Ai được đăng bài?</Label>
                    <Select
                      value={formData.post_permission}
                      onValueChange={(value: 'MEMBER' | 'MODERATOR' | 'ADMIN') => 
                        setFormData({ ...formData, post_permission: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quyền" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Thành viên trở lên</SelectItem>
                        <SelectItem value="MODERATOR">Điều hành viên trở lên</SelectItem>
                        <SelectItem value="ADMIN">Chỉ Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="commentPermission">Ai được bình luận?</Label>
                    <Select
                      value={formData.comment_permission}
                      onValueChange={(value: 'MEMBER' | 'MODERATOR' | 'ADMIN') => 
                        setFormData({ ...formData, comment_permission: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quyền" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Thành viên trở lên</SelectItem>
                        <SelectItem value="MODERATOR">Điều hành viên trở lên</SelectItem>
                        <SelectItem value="ADMIN">Chỉ Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {dialogMode === 'edit' && editingCategory && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => {
                    setDialogOpen(false);
                    handleDelete(editingCategory);
                  }}
                  className="sm:mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa danh mục
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Đang lưu...' : dialogMode === 'create' ? 'Tạo danh mục' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
