import { useEffect, useState } from 'react';
import { adminService, AdminPost } from '@/api/services/adminService';
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
  MoreHorizontal, Search, ChevronLeft, ChevronRight, 
  ExternalLink, Eye, EyeOff, Trash2, Pin, PinOff, Lock, Unlock 
} from 'lucide-react';
import { formatDate, truncateText, decodeHtmlEntities } from '@/lib/utils';
import { toast } from 'sonner';

export function PostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await adminService.getPosts(params);
      setPosts(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, statusFilter]);

  const handleToggleVisibility = async (post: AdminPost) => {
    try {
      if (post.status === 'HIDDEN') {
        await adminService.showPost(post.id.toString());
        toast.success('Đã hiện bài viết');
      } else {
        await adminService.hidePost(post.id.toString());
        toast.success('Đã ẩn bài viết');
      }
      fetchPosts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thực hiện thao tác');
    }
  };

  const handleTogglePin = async (post: AdminPost) => {
    try {
      await adminService.togglePostPin(post.id.toString());
      toast.success(post.isPinned ? 'Đã bỏ ghim bài viết' : 'Đã ghim bài viết');
      fetchPosts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thực hiện thao tác');
    }
  };

  const handlePin = async (post: AdminPost, pinType: 'GLOBAL' | 'CATEGORY') => {
    try {
      await adminService.pinPost(post.id.toString(), pinType);
      toast.success(pinType === 'GLOBAL' ? 'Đã ghim toàn cục' : 'Đã ghim trong category');
      fetchPosts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể ghim bài viết');
    }
  };

  const handleToggleLock = async (post: AdminPost) => {
    try {
      await adminService.togglePostLock(post.id.toString());
      toast.success(post.isLocked ? 'Đã mở khóa bài viết' : 'Đã khóa bài viết');
      fetchPosts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thực hiện thao tác');
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.')) return;

    try {
      await adminService.deletePost(postId.toString());
      toast.success('Đã xóa bài viết');
      fetchPosts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa bài viết');
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string, isPinned: boolean, isLocked: boolean, pinType?: 'GLOBAL' | 'CATEGORY' | null) => {
    const badges = [];
    
    if (isPinned) {
      const isGlobal = pinType === 'GLOBAL';
      badges.push(
        <Badge 
          key="pinned" 
          variant="default" 
          className={isGlobal ? "bg-yellow-500 hover:bg-yellow-600" : "bg-orange-500 hover:bg-orange-600"}
          title={isGlobal ? "Ghim toàn cục (hiển thị sidebar)" : "Ghim trong category"}
        >
          <Pin className="h-3 w-3 mr-1" />
          {isGlobal ? 'Ghim toàn cục' : 'Ghim category'}
        </Badge>
      );
    }
    
    if (isLocked) {
      badges.push(
        <Badge key="locked" variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">
          <Lock className="h-3 w-3 mr-1" />
          Khóa
        </Badge>
      );
    }

    switch (status) {
      case 'PUBLISHED':
        badges.push(<Badge key="status" variant="success">Công khai</Badge>);
        break;
      case 'HIDDEN':
        badges.push(<Badge key="status" variant="secondary">Ẩn</Badge>);
        break;
      case 'DRAFT':
        badges.push(<Badge key="status" variant="outline">Nháp</Badge>);
        break;
      case 'DELETED':
        badges.push(<Badge key="status" variant="destructive">Đã xóa</Badge>);
        break;
      default:
        badges.push(<Badge key="status" variant="outline">{status}</Badge>);
    }

    return <div className="flex gap-1 flex-wrap">{badges}</div>;
  };

  if (loading && posts.length === 0) {
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
        <h1 className="text-3xl font-bold tracking-tight">Quản lý bài viết</h1>
        <p className="text-muted-foreground">
          Xem và quản lý tất cả bài viết trong diễn đàn ({total} bài viết)
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài viết..."
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
            <SelectItem value="PUBLISHED">Công khai</SelectItem>
            <SelectItem value="HIDDEN">Ẩn</SelectItem>
            <SelectItem value="DRAFT">Nháp</SelectItem>
            <SelectItem value="DELETED">Đã xóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Tiêu đề</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead className="hidden sm:table-cell">Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right hidden md:table-cell">Lượt xem</TableHead>
              <TableHead className="text-right hidden md:table-cell">Bình luận</TableHead>
              <TableHead className="hidden lg:table-cell">Ngày tạo</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy bài viết nào
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id} className={post.status === 'DELETED' ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="max-w-[280px]">
                      <div className="font-medium truncate" title={decodeHtmlEntities(post.title)}>
                        {truncateText(post.title, 50)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">@{post.author.username}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="hidden sm:inline-flex">{post.category?.name || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(post.status, post.isPinned, post.isLocked, post.pinType)}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">{post.viewCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{post.commentCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                    {formatDate(post.createdAt)}
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
                            href={`http://localhost:5173/posts/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Xem bài viết
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {post.isPinned ? (
                          <>
                            <DropdownMenuItem onClick={() => handleTogglePin(post)}>
                              <PinOff className="mr-2 h-4 w-4" />
                              Bỏ ghim
                              {post.pinType && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                  ({post.pinType === 'GLOBAL' ? 'Toàn cục' : 'Category'})
                                </span>
                              )}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handlePin(post, 'GLOBAL')}>
                              <Pin className="mr-2 h-4 w-4 text-primary" />
                              Ghim toàn cục (Sidebar)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePin(post, 'CATEGORY')}>
                              <Pin className="mr-2 h-4 w-4 text-orange-500" />
                              Ghim trong Category
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleToggleLock(post)}>
                          {post.isLocked ? (
                            <>
                              <Unlock className="mr-2 h-4 w-4" />
                              Mở khóa
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              Khóa bình luận
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleVisibility(post)}>
                          {post.status === 'HIDDEN' ? (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Hiện bài viết
                            </>
                          ) : (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Ẩn bài viết
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(post.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa bài viết
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
          Trang {page} / {totalPages} ({total} bài viết)
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
