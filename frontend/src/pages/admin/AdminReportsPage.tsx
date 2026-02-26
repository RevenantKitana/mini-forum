import { useState } from 'react';
import { useAdminReports, useUpdateReportStatus } from '@/hooks/useAdmin';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { AdminReport } from '@/api/services/adminService';

export function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'resolve' | 'reject' | 'review' | null>(null);
  const [action, setAction] = useState<string>('');

  const { data, isLoading, refetch } = useAdminReports({
    page,
    limit: 20,
    status: statusFilter || undefined,
    targetType: targetTypeFilter || undefined,
  });

  const updateStatusMutation = useUpdateReportStatus();

  const handleStatusUpdate = async (status: string, reportAction?: string) => {
    if (!selectedReport) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedReport.id,
        status,
        action: reportAction,
      });
      toast.success('Đã cập nhật trạng thái báo cáo');
      setDialogOpen(false);
      setSelectedReport(null);
      setActionType(null);
      setAction('');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Chờ xử lý</Badge>;
      case 'REVIEWED':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Đang xem xét</Badge>;
      case 'RESOLVED':
        return <Badge variant="outline" className="text-green-600 border-green-600">Đã giải quyết</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'POST':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'COMMENT':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'USER':
        return <User className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTargetLink = (report: AdminReport) => {
    switch (report.targetType) {
      case 'POST':
        return `/posts/${report.target?.id}`;
      case 'COMMENT':
        return `/posts/${report.target?.postId}#comment-${report.target?.id}`;
      case 'USER':
        return `/users/${report.target?.username}`;
      default:
        return '#';
    }
  };

  const getTargetDisplay = (report: AdminReport) => {
    if (!report.target) return 'Đã xóa';
    
    switch (report.targetType) {
      case 'POST':
        return report.target.title || 'Bài viết';
      case 'COMMENT':
        return report.target.content?.substring(0, 50) + '...' || 'Bình luận';
      case 'USER':
        return report.target.displayName || report.target.username;
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="PENDING">Chờ xử lý</SelectItem>
            <SelectItem value="REVIEWED">Đang xem xét</SelectItem>
            <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
            <SelectItem value="REJECTED">Từ chối</SelectItem>
          </SelectContent>
        </Select>

        <Select value={targetTypeFilter} onValueChange={(v) => { setTargetTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Loại đối tượng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="POST">Bài viết</SelectItem>
            <SelectItem value="COMMENT">Bình luận</SelectItem>
            <SelectItem value="USER">Người dùng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Đối tượng</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Người báo cáo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Không có báo cáo nào
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">#{report.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTargetIcon(report.targetType)}
                      <div>
                        <div className="font-medium text-sm">
                          {getTargetDisplay(report)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {report.targetType === 'POST' && 'Bài viết'}
                          {report.targetType === 'COMMENT' && 'Bình luận'}
                          {report.targetType === 'USER' && 'Người dùng'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{report.reason}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={report.reporter.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {(report.reporter.displayName || report.reporter.username)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{report.reporter.displayName || report.reporter.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: vi })}
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
                          <Link to={getTargetLink(report)} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Xem đối tượng
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedReport(report);
                            setDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Chi tiết & Xử lý
                        </DropdownMenuItem>
                        {report.status === 'PENDING' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedReport(report);
                                setActionType('resolve');
                                setDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              Giải quyết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedReport(report);
                                setActionType('reject');
                                setDialogOpen(true);
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              Từ chối
                            </DropdownMenuItem>
                          </>
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
            Hiển thị {(page - 1) * 20 + 1} - {Math.min(page * 20, data.pagination.total)} / {data.pagination.total} báo cáo
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

      {/* Report Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo #{selectedReport?.id}</DialogTitle>
            <DialogDescription>
              Xem và xử lý báo cáo
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              {/* Report Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Thông tin báo cáo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loại:</span>
                    <div className="flex items-center gap-1">
                      {getTargetIcon(selectedReport.targetType)}
                      <span>
                        {selectedReport.targetType === 'POST' && 'Bài viết'}
                        {selectedReport.targetType === 'COMMENT' && 'Bình luận'}
                        {selectedReport.targetType === 'USER' && 'Người dùng'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lý do:</span>
                    <span className="font-medium">{selectedReport.reason}</span>
                  </div>
                  {selectedReport.description && (
                    <div>
                      <span className="text-muted-foreground">Mô tả:</span>
                      <p className="mt-1">{selectedReport.description}</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                </CardContent>
              </Card>

              {/* Reporter Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Người báo cáo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedReport.reporter.avatarUrl || undefined} />
                      <AvatarFallback>
                        {(selectedReport.reporter.displayName || selectedReport.reporter.username)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedReport.reporter.displayName}</div>
                      <div className="text-sm text-muted-foreground">@{selectedReport.reporter.username}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Selection */}
              {selectedReport.status === 'PENDING' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hành động khi giải quyết:</label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn hành động" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không làm gì</SelectItem>
                      <SelectItem value="hide_content">Ẩn nội dung</SelectItem>
                      <SelectItem value="delete_content">Xóa nội dung</SelectItem>
                      {selectedReport.targetType === 'USER' && (
                        <SelectItem value="ban_user">Khóa người dùng</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" asChild>
              <Link to={selectedReport ? getTargetLink(selectedReport) : '#'} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Xem đối tượng
              </Link>
            </Button>
            {selectedReport?.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('REJECTED')}
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Từ chối
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('RESOLVED', action || undefined)}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Giải quyết
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
