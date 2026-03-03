import { useEffect, useState } from 'react';
import { adminService, AdminComment } from '@/api/services/adminService';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MoreHorizontal, Search, ChevronLeft, ChevronRight, 
  ExternalLink, Eye, EyeOff, Trash2, MessageSquare, ShieldAlert, ShieldOff
} from 'lucide-react';
import { formatDate, truncateText, decodeHtmlEntities } from '@/lib/utils';
import { toast } from 'sonner';

export function CommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modal state for viewing masked content
  const [viewContentOpen, setViewContentOpen] = useState(false);
  const [viewingContent, setViewingContent] = useState<string | null>(null);
  const [viewingComment, setViewingComment] = useState<AdminComment | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await adminService.getComments(params);
      setComments(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách bình luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [page, statusFilter]);

  const handleToggleVisibility = async (comment: AdminComment) => {
    try {
      if (comment.status === 'HIDDEN') {
        await adminService.showComment(comment.id.toString());
        toast.success('Đã hiện bình luận');
      } else {
        await adminService.hideComment(comment.id.toString());
        toast.success('Đã ẩn bình luận');
      }
      fetchComments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thực hiện thao tác');
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

    try {
      await adminService.deleteComment(commentId.toString());
      toast.success('Đã xóa bình luận');
      fetchComments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa bình luận');
    }
  };

  const handleToggleMask = async (comment: AdminComment) => {
    try {
      await adminService.toggleCommentMask(comment.id.toString());
      toast.success(comment.isContentMasked ? 'Đã bỏ che nội dung' : 'Đã che nội dung bình luận');
      fetchComments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thực hiện thao tác');
    }
  };

  const handleViewMaskedContent = async (comment: AdminComment) => {
    setViewingComment(comment);
    setViewContentOpen(true);
    setLoadingContent(true);
    setViewingContent(null);
    
    try {
      const response = await adminService.viewMaskedCommentContent(comment.id.toString());
      setViewingContent(response.content);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải nội dung');
      setViewContentOpen(false);
    } finally {
      setLoadingContent(false);
    }
  };

  const filteredComments = comments.filter(
    (comment) =>
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.author.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VISIBLE':
        return <Badge variant="success">Hiển thị</Badge>;
      case 'HIDDEN':
        return <Badge variant="secondary">Ẩn</Badge>;
      case 'DELETED':
        return <Badge variant="destructive">Đã xóa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && comments.length === 0) {
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
        <h1 className="text-3xl font-bold tracking-tight">Quản lý bình luận</h1>
        <p className="text-muted-foreground">
          Xem và quản lý tất cả bình luận trong diễn đàn ({total} bình luận)
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bình luận..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="VISIBLE">Hiển thị</SelectItem>
            <SelectItem value="HIDDEN">Ẩn</SelectItem>
            <SelectItem value="DELETED">Đã xóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[350px]">Nội dung</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead className="hidden sm:table-cell">Bài viết</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right hidden md:table-cell">Votes</TableHead>
              <TableHead className="hidden lg:table-cell">Ngày tạo</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredComments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy bình luận nào
                </TableCell>
              </TableRow>
            ) : (
              filteredComments.map((comment) => (
                <TableRow key={comment.id} className={comment.status === 'DELETED' ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="max-w-[330px]">
                      {/* All comments are masked by default for privacy/security */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground line-clamp-1 blur-sm select-none">
                            {truncateText(comment.content, 50)}
                          </div>
                        </div>
                        {comment.isContentMasked && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 flex-shrink-0">
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            Đã che
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMaskedContent(comment)}
                          className="h-6 text-xs flex-shrink-0"
                          title="Xem nội dung (ghi audit log)"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Xem
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {comment.author.displayName || comment.author.username}
                    </div>
                    <div className="text-xs text-muted-foreground">@{comment.author.username}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <a
                      href={`http://localhost:5173/posts/${comment.post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline max-w-[200px]"
                    >
                      <MessageSquare className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{truncateText(comment.post.title, 30)}</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(comment.status)}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    <span className="text-green-600">+{comment.upvoteCount}</span>
                    {' / '}
                    <span className="text-red-600">-{comment.downvoteCount}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                    {formatDate(comment.createdAt)}
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
                            href={`http://localhost:5173/posts/${comment.post.id}#comment-${comment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Xem bình luận
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleVisibility(comment)}>
                          {comment.status === 'HIDDEN' ? (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Hiện bình luận
                            </>
                          ) : (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Ẩn bình luận
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleMask(comment)}>
                          {comment.isContentMasked ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Bỏ che nội dung
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Che nội dung
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(comment.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa bình luận
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
          Trang {page} / {totalPages} ({total} bình luận)
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

      {/* View Masked Content Dialog */}
      <Dialog open={viewContentOpen} onOpenChange={setViewContentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Xem nội dung bình luận
              {viewingComment?.isContentMasked && (
                <Badge variant="outline" className="text-orange-600 border-orange-300 ml-2">
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  Đã che
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              <span className="text-amber-600 dark:text-amber-400">⚠ Hành động này đã được ghi vào audit log.</span>
              {viewingComment && (
                <span className="block mt-1">
                  Bình luận của <strong>{viewingComment.author.displayName || viewingComment.author.username}</strong> trong bài viết "{decodeHtmlEntities(viewingComment.post.title)}"
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {loadingContent ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : viewingContent ? (
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto">
                {viewingContent}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Không thể tải nội dung
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
