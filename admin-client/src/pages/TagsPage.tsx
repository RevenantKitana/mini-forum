import { useEffect, useState } from 'react';
import { adminService, AdminTag } from '@/api/services/adminService';
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
  MoreHorizontal, Plus, Pencil, Trash2, Tag, Hash, Search, Shield
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface TagFormData {
  name: string;
  description: string;
  usePermission: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
}

const defaultFormData: TagFormData = {
  name: '',
  description: '',
  usePermission: 'MEMBER',
  isActive: true,
};

export function TagsPage() {
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [filteredTags, setFilteredTags] = useState<AdminTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingTag, setEditingTag] = useState<AdminTag | null>(null);
  const [formData, setFormData] = useState<TagFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await adminService.getTags();
      const tagsData = response.data.map((tag: AdminTag) => ({
        ...tag,
        postCount: tag._count?.posts ?? tag.usageCount ?? 0,
      }));
      setTags(tagsData);
      setFilteredTags(tagsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách thẻ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTags(tags);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTags(
        tags.filter(
          (tag) =>
            tag.name.toLowerCase().includes(query) ||
            tag.description?.toLowerCase().includes(query) ||
            tag.slug.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, tags]);

  const handleOpenCreate = () => {
    setDialogMode('create');
    setEditingTag(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tag: AdminTag) => {
    setDialogMode('edit');
    setEditingTag(tag);
    // Ensure usePermission has valid value (not 'ALL' for this field)
    const validUsePerm = (tag.usePermission === 'ALL') ? 'MEMBER' : tag.usePermission;
    setFormData({
      name: tag.name,
      description: tag.description || '',
      usePermission: validUsePerm || 'MEMBER',
      isActive: tag.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Tên thẻ là bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      if (dialogMode === 'create') {
        await adminService.createTag({
          name: formData.name,
          description: formData.description || undefined,
          usePermission: formData.usePermission,
          isActive: formData.isActive,
        });
        toast.success('Đã tạo thẻ mới');
      } else if (editingTag) {
        await adminService.updateTag(editingTag.id.toString(), {
          name: formData.name,
          description: formData.description,
          usePermission: formData.usePermission,
          isActive: formData.isActive,
        });
        toast.success('Đã cập nhật thẻ');
      }
      setDialogOpen(false);
      fetchTags();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể lưu thẻ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tag: AdminTag) => {
    if (tag.postCount > 0) {
      const confirm1 = confirm(
        `Thẻ "${tag.name}" đang được sử dụng trong ${tag.postCount} bài viết. ` +
        `Xóa thẻ sẽ gỡ bỏ thẻ khỏi tất cả bài viết. Bạn có chắc chắn?`
      );
      if (!confirm1) return;
    } else {
      if (!confirm(`Bạn có chắc chắn muốn xóa thẻ "${tag.name}"?`)) return;
    }

    try {
      await adminService.deleteTag(tag.id.toString());
      toast.success('Đã xóa thẻ');
      fetchTags();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa thẻ');
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
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Tags</h1>
          <p className="text-muted-foreground">
            Quản lý các thẻ gắn cho bài viết ({tags.length} thẻ)
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm thẻ
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm thẻ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Danh sách thẻ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thẻ</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-center">Số bài viết</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Không tìm thấy thẻ phù hợp' : 'Chưa có thẻ nào'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{tag.name}</div>
                          <div className="text-xs text-muted-foreground">/{tag.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] text-sm text-muted-foreground truncate">
                        {tag.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={tag.postCount > 0 ? 'default' : 'outline'}>
                        {tag.postCount} bài
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(tag.createdAt)}
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
                          <DropdownMenuItem onClick={() => handleOpenEdit(tag)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(tag)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa thẻ
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

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số thẻ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Thẻ đang được dùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter(t => t.postCount > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Thẻ chưa được dùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter(t => t.postCount === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'create' ? 'Tạo thẻ mới' : 'Chỉnh sửa thẻ'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'create' 
                  ? 'Thêm một thẻ mới để phân loại bài viết'
                  : 'Cập nhật thông tin thẻ'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên thẻ *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên thẻ"
                />
                <p className="text-xs text-muted-foreground">
                  Slug sẽ được tự động tạo từ tên thẻ
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn về thẻ (tùy chọn)"
                  rows={3}
                />
              </div>

              {/* Permissions Section */}
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  <Label className="font-medium">Phân quyền</Label>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="usePermission">Ai được sử dụng thẻ này?</Label>
                  <Select
                    value={formData.usePermission}
                    onValueChange={(value: 'MEMBER' | 'MODERATOR' | 'ADMIN') => 
                      setFormData({ ...formData, usePermission: value })
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kích hoạt thẻ</Label>
                    <p className="text-xs text-muted-foreground">
                      Thẻ có thể được sử dụng trong bài viết mới
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Đang lưu...' : dialogMode === 'create' ? 'Tạo thẻ' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
