import { useState } from 'react';
import { useAdminComments, useUpdateCommentStatus } from '@/hooks/useAdmin';
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
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function AdminCommentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, refetch } = useAdminComments({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  const updateStatusMutation = useUpdateCommentStatus();

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success('Đã cập nhật trạng thái bình luận');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VISIBLE':
        return <Badge variant="default" className="bg-green-500">Hiển thị</Badge>;
      case 'HIDDEN':
        return <Badge variant="secondary">Đã ẩn</Badge>;
      case 'DELETED':
        return <Badge variant="destructive">Đã xóa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="VISIBLE">Hiển thị</SelectItem>
            <SelectItem value="HIDDEN">Đã ẩn</SelectItem>
            <SelectItem value="DELETED">Đã xóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead className="min-w-[300px]">Nội dung</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Bài viết</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-center">Vote</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy bình luận nào
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="font-medium">#{comment.id}</TableCell>
                  <TableCell>
                    <p className="text-sm">{truncateContent(comment.content)}</p>
                  </TableCell>
                  <TableCell>
                    <Link 
                      to={`/users/${comment.author.username}`}
                      className="text-sm hover:underline"
                    >
                      {comment.author.displayName || comment.author.username}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link 
                      to={`/posts/${comment.post.id}`}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {truncateContent(comment.post.title, 40)}
                    </Link>
                  </TableCell>
                  <TableCell>{getStatusBadge(comment.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-green-500" />
                        {comment.upvoteCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowDown className="h-3 w-3 text-red-500" />
                        {comment.downvoteCount}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
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
                          <Link to={`/posts/${comment.post.id}#comment-${comment.id}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Xem bình luận
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {comment.status !== 'VISIBLE' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(comment.id, 'VISIBLE')}>
                            <Eye className="mr-2 h-4 w-4 text-green-500" />
                            Hiển thị
                          </DropdownMenuItem>
                        )}
                        {comment.status !== 'HIDDEN' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(comment.id, 'HIDDEN')}>
                            <EyeOff className="mr-2 h-4 w-4 text-yellow-500" />
                            Ẩn bình luận
                          </DropdownMenuItem>
                        )}
                        {comment.status !== 'DELETED' && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(comment.id, 'DELETED')}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa bình luận
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
            Hiển thị {(page - 1) * 20 + 1} - {Math.min(page * 20, data.pagination.total)} / {data.pagination.total} bình luận
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
