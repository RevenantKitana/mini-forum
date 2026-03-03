import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService, AdminReport } from '@/api/services/adminService';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ChevronLeft, ChevronRight, Check, X, ExternalLink, Search } from 'lucide-react';
import { formatDate, truncateText } from '@/lib/utils';

export function ReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await adminService.getReports({ page, limit: 10 });
      setReports(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page]);

  const handleResolve = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    try {
      await adminService.reviewReport(reportId, { status: action });
      fetchReports();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xử lý báo cáo');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Chờ xử lý</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Đã xử lý</Badge>;
      case 'DISMISSED':
        return <Badge variant="secondary">Đã bỏ qua</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'POST':
        return <Badge variant="default">Bài viết</Badge>;
      case 'COMMENT':
        return <Badge variant="secondary">Bình luận</Badge>;
      case 'USER':
        return <Badge variant="outline">Người dùng</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get the management page URL with search parameter based on report type
  const getManagementPageLink = (report: AdminReport): string => {
    switch (report.targetType) {
      case 'POST':
        return `/posts?search=${report.targetId}`;
      case 'COMMENT':
        return `/comments?search=${report.targetId}`;
      case 'USER':
        return `/users?search=${report.targetId}`;
      default:
        return '/';
    }
  };

  // Get external link to view the content on the forum
  const getExternalLink = (report: AdminReport): string => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    switch (report.targetType) {
      case 'POST':
        return `${frontendUrl}/posts/${report.target?.id || report.targetId}`;
      case 'COMMENT':
        // Comments are viewed within their parent post
        return `${frontendUrl}/posts/${report.target?.postId || ''}#comment-${report.targetId}`;
      case 'USER':
        return `${frontendUrl}/users/${report.target?.username || report.targetId}`;
      default:
        return frontendUrl;
    }
  };

  if (loading && reports.length === 0) {
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
        <h1 className="text-3xl font-bold tracking-tight">Báo cáo vi phạm</h1>
        <p className="text-muted-foreground">
          Xem và xử lý các báo cáo vi phạm từ người dùng
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loại</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead className="hidden sm:table-cell">Mô tả</TableHead>
              <TableHead className="hidden md:table-cell">Người báo cáo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="hidden lg:table-cell">Ngày tạo</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Không có báo cáo nào
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{getTypeBadge(report.targetType)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm font-medium">{report.reason}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="max-w-xs">
                      <div className="text-sm text-muted-foreground">
                        {truncateText(report.description || 'Không có mô tả', 50)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">@{report.reporter.username}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(report.createdAt)}</TableCell>
                  <TableCell>
                    {report.status === 'PENDING' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {/* Navigate to management page with search */}
                          <DropdownMenuItem asChild>
                            <Link
                              to={getManagementPageLink(report)}
                            >
                              <Search className="mr-2 h-4 w-4" />
                              Xem trong quản lý
                            </Link>
                          </DropdownMenuItem>
                          {/* View on frontend */}
                          {report.target && report.targetType !== 'USER' && (
                            <DropdownMenuItem asChild>
                              <a
                                href={getExternalLink(report)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Xem trên diễn đàn
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleResolve(report.id.toString(), 'RESOLVED')}
                            className="text-green-600"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Đánh dấu đã xử lý
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResolve(report.id.toString(), 'DISMISSED')}
                            className="text-muted-foreground"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Bỏ qua
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {reports.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </p>
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
      )}
    </div>
  );
}
