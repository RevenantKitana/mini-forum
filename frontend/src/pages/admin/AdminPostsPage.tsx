import { useState } from 'react';
import { useAdminPosts, useUpdatePostStatus } from '@/hooks/useAdmin';
import { useCategories } from '@/hooks/useCategories';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Search,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Pin,
  Lock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function AdminPostsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { data, isLoading, refetch } = useAdminPosts({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    categoryId: categoryFilter ? parseInt(categoryFilter) : undefined,
  });

  const { data: categoriesData } = useCategories();
  const updateStatusMutation = useUpdatePostStatus();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success('Đã cập nhật trạng thái bài viết');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="default" className="bg-green-500">Công khai</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Nháp</Badge>;
      case 'HIDDEN':
        return <Badge variant="secondary">Đã ẩn</Badge>;
      case 'DELETED':
        return <Badge variant="destructive">Đã xóa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="PUBLISHED">Công khai</SelectItem>
            <SelectItem value="DRAFT">Nháp</SelectItem>
            <SelectItem value="HIDDEN">Đã ẩn</SelectItem>
            <SelectItem value="DELETED">Đã xóa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            {categoriesData?.map((cat: any) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead className="min-w-[250px]">Tiêu đề</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-center">Thống kê</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy bài viết nào
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">#{post.id}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        {post.title}
                        {post.isPinned && <Pin className="h-3 w-3 text-yellow-500" />}
                        {post.isLocked && <Lock className="h-3 w-3 text-gray-500" />}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link 
                      to={`/users/${post.author.username}`}
                      className="text-sm hover:underline"
                    >
                      {post.author.displayName || post.author.username}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.category.name}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-green-500" />
                        {post.upvoteCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowDown className="h-3 w-3 text-red-500" />
                        {post.downvoteCount}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
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
                          <Link to={`/posts/${post.id}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Xem bài viết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {post.status !== 'PUBLISHED' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'PUBLISHED')}>
                            <Eye className="mr-2 h-4 w-4 text-green-500" />
                            Công khai
                          </DropdownMenuItem>
                        )}
                        {post.status !== 'HIDDEN' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(post.id, 'HIDDEN')}>
                            <EyeOff className="mr-2 h-4 w-4 text-yellow-500" />
                            Ẩn bài viết
                          </DropdownMenuItem>
                        )}
                        {post.status !== 'DELETED' && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(post.id, 'DELETED')}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa bài viết
                          </DropdownMenuItem>
                        )}
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
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị {(page - 1) * 20 + 1} - {Math.min(page * 20, data.pagination.total)} / {data.pagination.total} bài viết
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Trang {page} / {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
