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
  sortOrder: number;
  isActive: boolean;
  viewPermission: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  postPermission: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  commentPermission: 'MEMBER' | 'MODERATOR' | 'ADMIN';
}

const defaultFormData: CategoryFormData = {
  name: '',
  description: '',
  color: '#6366f1',
  sortOrder: 0,
  isActive: true,
  viewPermission: 'ALL',
  postPermission: 'MEMBER',
  commentPermission: 'MEMBER',
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
      sortOrder: categories.length,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: AdminCategory) => {
    setDialogMode('edit');
    setEditingCategory(category);
    // Ensure postPermission and commentPermission have valid values (not 'ALL' for these fields)
    const validPostPerm = (category.postPermission === 'ALL') ? 'MEMBER' : category.postPermission;
    const validCommentPerm = (category.commentPermission === 'ALL') ? 'MEMBER' : category.commentPermission;
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#6366f1',
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      viewPermission: category.viewPermission || 'ALL',
      postPermission: validPostPerm || 'MEMBER',
      commentPermission: validCommentPerm || 'MEMBER',
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
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
          viewPermission: formData.viewPermission,
          postPermission: formData.postPermission,
          commentPermission: formData.commentPermission,
        });
        toast.success('Đã tạo danh mục mới');
      } else if (editingCategory) {
        await adminService.updateCategory(editingCategory.id.toString(), {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
          viewPermission: formData.viewPermission,
          postPermission: formData.postPermission,
          commentPermission: formData.commentPermission,
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
        isActive: !category.isActive,
      });
      toast.success(category.isActive ? 'Đã ẩn danh mục' : 'Đã hiện danh mục');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thực hiện thao tác');
    }
  };

  const handleDelete = async (category: AdminCategory) => {
    if (category.postCount > 0 || (category.actualPostCount && category.actualPostCount > 0)) {
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
                  <TableRow key={category.id} className={!category.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        {category.sortOrder}
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
                        {category.actualPostCount ?? category.postCount} bài
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1">
                        <div>
                          {category.isActive ? (
                            <Badge variant="success">Hiện</Badge>
                          ) : (
                            <Badge variant="secondary">Ẩn</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Xem: {category.viewPermission === 'ALL' ? 'Tất cả' : 
                                category.viewPermission === 'MEMBER' ? 'Thành viên' :
                                category.viewPermission === 'MODERATOR' ? 'Điều hành' : 
                                category.viewPermission === 'ADMIN' ? 'Admin' : 'Tất cả'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Đăng: {category.postPermission === 'MEMBER' ? 'Thành viên' :
                                 category.postPermission === 'MODERATOR' ? 'Điều hành' : 'Admin'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          BL: {category.commentPermission === 'MEMBER' ? 'Thành viên' :
                               category.commentPermission === 'MODERATOR' ? 'Điều hành' : 'Admin'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(category.createdAt)}
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
                            {category.isActive ? (
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
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
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
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
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
                    value={formData.viewPermission}
                    onValueChange={(value: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN') => 
                      setFormData({ ...formData, viewPermission: value })
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
                      value={formData.postPermission}
                      onValueChange={(value: 'MEMBER' | 'MODERATOR' | 'ADMIN') => 
                        setFormData({ ...formData, postPermission: value })
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
                      value={formData.commentPermission}
                      onValueChange={(value: 'MEMBER' | 'MODERATOR' | 'ADMIN') => 
                        setFormData({ ...formData, commentPermission: value })
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
