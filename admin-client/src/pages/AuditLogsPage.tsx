import { useEffect, useState, useCallback } from 'react';
import { adminService, AuditLog } from '@/api/services/adminService';
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
  History, Search, Filter, RefreshCw, Eye, Calendar,
  UserCircle, FileText, MessageSquare, FolderOpen, Tag, Flag
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const actionLabels: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  PIN: 'Ghim',
  UNPIN: 'Bỏ ghim',
  LOCK: 'Khóa',
  UNLOCK: 'Mở khóa',
  HIDE: 'Ẩn',
  SHOW: 'Hiện',
  BAN: 'Cấm',
  UNBAN: 'Bỏ cấm',
  ROLE_CHANGE: 'Đổi vai trò',
};

const actionVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
  LOGIN: 'outline',
  LOGOUT: 'outline',
  PIN: 'default',
  UNPIN: 'secondary',
  LOCK: 'destructive',
  UNLOCK: 'default',
  HIDE: 'destructive',
  SHOW: 'default',
  BAN: 'destructive',
  UNBAN: 'default',
  ROLE_CHANGE: 'secondary',
};

const targetLabels: Record<string, string> = {
  USER: 'Người dùng',
  POST: 'Bài viết',
  COMMENT: 'Bình luận',
  CATEGORY: 'Danh mục',
  TAG: 'Thẻ',
  REPORT: 'Báo cáo',
  SETTINGS: 'Cài đặt',
};

const targetIcons: Record<string, React.ElementType> = {
  USER: UserCircle,
  POST: FileText,
  COMMENT: MessageSquare,
  CATEGORY: FolderOpen,
  TAG: Tag,
  REPORT: Flag,
};

// Sensitive field names to mask
const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'hashedPassword', 'secret', 'apiKey'];

// Fields to exclude from display (internal/system fields)
const excludedFields = ['id', 'createdAt', 'updatedAt', 'slug', '_count', 'passwordHash'];

// Field labels for human-readable display
const fieldLabels: Record<string, string> = {
  name: 'Tên',
  title: 'Tiêu đề',
  content: 'Nội dung',
  description: 'Mô tả',
  email: 'Email',
  username: 'Tên người dùng',
  displayName: 'Tên hiển thị',
  avatarUrl: 'Ảnh đại diện',
  bio: 'Giới thiệu',
  role: 'Vai trò',
  isActive: 'Trạng thái hoạt động',
  isVerified: 'Đã xác minh',
  isPinned: 'Ghim',
  pinType: 'Loại ghim',
  isLocked: 'Khóa bình luận',
  status: 'Trạng thái',
  color: 'Màu sắc',
  sortOrder: 'Thứ tự',
  viewPermission: 'Quyền xem',
  postPermission: 'Quyền đăng bài',
  commentPermission: 'Quyền bình luận',
  usePermission: 'Quyền sử dụng',
  reputation: 'Điểm uy tín',
  reason: 'Lý do',
  reviewNote: 'Ghi chú',
  categoryId: 'Danh mục',
  authorId: 'Tác giả',
  postCount: 'Số bài viết',
  usageCount: 'Số lần sử dụng',
  viewCount: 'Lượt xem',
  upvoteCount: 'Lượt thích',
  downvoteCount: 'Lượt không thích',
  commentCount: 'Số bình luận',
};

// Value mappings for human-readable display
const valueLabels: Record<string, Record<string, string>> = {
  role: {
    MEMBER: 'Thành viên',
    MODERATOR: 'Điều hành viên',
    ADMIN: 'Quản trị viên',
  },
  status: {
    DRAFT: 'Nháp',
    PUBLISHED: 'Đã đăng',
    HIDDEN: 'Ẩn',
    DELETED: 'Đã xóa',
    VISIBLE: 'Hiển thị',
    PENDING: 'Chờ xử lý',
    REVIEWING: 'Đang xem xét',
    RESOLVED: 'Đã giải quyết',
    DISMISSED: 'Đã bác bỏ',
  },
  pinType: {
    GLOBAL: 'Toàn cục',
    CATEGORY: 'Trong danh mục',
  },
  viewPermission: {
    ALL: 'Tất cả',
    MEMBER: 'Thành viên trở lên',
    MODERATOR: 'Điều hành viên trở lên',
    ADMIN: 'Chỉ Admin',
  },
  postPermission: {
    ALL: 'Tất cả',
    MEMBER: 'Thành viên trở lên',
    MODERATOR: 'Điều hành viên trở lên',
    ADMIN: 'Chỉ Admin',
  },
  commentPermission: {
    ALL: 'Tất cả',
    MEMBER: 'Thành viên trở lên',
    MODERATOR: 'Điều hành viên trở lên',
    ADMIN: 'Chỉ Admin',
  },
  usePermission: {
    ALL: 'Tất cả',
    MEMBER: 'Thành viên trở lên',
    MODERATOR: 'Điều hành viên trở lên',
    ADMIN: 'Chỉ Admin',
  },
};

// Format value for display
const formatValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return '(trống)';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (typeof value === 'object') return JSON.stringify(value);
  
  // Check for value mapping
  const valueMapping = valueLabels[key];
  if (valueMapping && valueMapping[String(value)]) {
    return valueMapping[String(value)];
  }
  
  return String(value);
};

// Get changed fields between old and new values
const getChangedFields = (oldValue: any, newValue: any): Array<{ field: string; label: string; oldVal: string; newVal: string }> => {
  const changes: Array<{ field: string; label: string; oldVal: string; newVal: string }> = [];
  
  if (!oldValue && !newValue) return changes;
  
  // For CREATE actions, show only new values
  if (!oldValue && newValue) {
    const obj = typeof newValue === 'object' ? newValue : {};
    for (const [key, value] of Object.entries(obj)) {
      if (excludedFields.includes(key)) continue;
      if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) continue;
      if (value === null || value === undefined) continue;
      
      const label = fieldLabels[key] || key;
      changes.push({
        field: key,
        label,
        oldVal: '',
        newVal: formatValue(key, value),
      });
    }
    return changes;
  }
  
  // For UPDATE actions, show changed values
  if (oldValue && newValue) {
    const oldObj = typeof oldValue === 'object' ? oldValue : {};
    const newObj = typeof newValue === 'object' ? newValue : {};
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    
    for (const key of allKeys) {
      if (excludedFields.includes(key)) continue;
      if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) continue;
      
      const oldVal = oldObj[key];
      const newVal = newObj[key];
      
      // Check if value actually changed
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        const label = fieldLabels[key] || key;
        changes.push({
          field: key,
          label,
          oldVal: formatValue(key, oldVal),
          newVal: formatValue(key, newVal),
        });
      }
    }
  }
  
  // For DELETE actions, show old values
  if (oldValue && !newValue) {
    const obj = typeof oldValue === 'object' ? oldValue : {};
    for (const [key, value] of Object.entries(obj)) {
      if (excludedFields.includes(key)) continue;
      if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) continue;
      if (value === null || value === undefined) continue;
      
      const label = fieldLabels[key] || key;
      changes.push({
        field: key,
        label,
        oldVal: formatValue(key, value),
        newVal: '(đã xóa)',
      });
    }
  }
  
  return changes;
};

// Get a brief summary of changes for table display
const getChangeSummary = (action: string, oldValue: any, newValue: any, maxItems = 2): string => {
  // Don't show details for CREATE action
  if (action === 'CREATE') {
    return '';
  }
  
  const changes = getChangedFields(oldValue, newValue);
  if (changes.length === 0) return '';
  
  const summaryParts: string[] = [];
  const displayChanges = changes.slice(0, maxItems);
  
  for (const change of displayChanges) {
    if (action === 'DELETE') {
      summaryParts.push(`${change.label}: ${change.oldVal}`);
    } else {
      // UPDATE - show A → B format
      summaryParts.push(`${change.label}: ${change.oldVal} → ${change.newVal}`);
    }
  }
  
  const remaining = changes.length - maxItems;
  if (remaining > 0) {
    summaryParts.push(`+${remaining} thay đổi khác`);
  }
  
  return summaryParts.join(' | ');
};

// Mask sensitive values in audit log data (keep for backward compatibility)
const maskSensitiveData = (data: any): any => {
  if (!data) return data;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }
  
  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      masked[key] = '********';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
};

interface Filters {
  action: string;
  targetType: string;
  search: string;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    action: '',
    targetType: '',
    search: '',
  });
  
  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Helper to parse JSON values from audit log
  const parseAuditLogValues = (log: AuditLog): AuditLog => {
    return {
      ...log,
      oldValue: log.oldValue ? (typeof log.oldValue === 'string' ? tryParseJSON(log.oldValue) : log.oldValue) : null,
      newValue: log.newValue ? (typeof log.newValue === 'string' ? tryParseJSON(log.newValue) : log.newValue) : null,
    };
  };

  const tryParseJSON = (str: string): any => {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 20,
      };
      if (filters.action) params.action = filters.action;
      if (filters.targetType) params.targetType = filters.targetType;
      
      const response = await adminService.getAuditLogs(params);
      
      // Parse JSON values in oldValue and newValue
      let parsedData = response.data.map(parseAuditLogValues);
      
      // Filter by search term if present
      if (filters.search) {
        const query = filters.search.toLowerCase();
        parsedData = parsedData.filter(
          (log: AuditLog) =>
            log.user?.username?.toLowerCase().includes(query) ||
            log.targetName?.toLowerCase().includes(query) ||
            log.action.toLowerCase().includes(query)
        );
      }
      
      setLogs(parsedData);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải lịch sử hoạt động');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const handleResetFilters = () => {
    setFilters({ action: '', targetType: '', search: '' });
    setPage(1);
  };

  const getTargetIcon = (targetType: string) => {
    const Icon = targetIcons[targetType] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  if (loading && logs.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Lịch sử các hoạt động quản trị trên hệ thống
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm theo người dùng, mục tiêu..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Hành động</Label>
              <Select
                value={filters.action || '_all'}
                onValueChange={(value: string) => {
                  setFilters({ ...filters, action: value === '_all' ? '' : value });
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả hành động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Tất cả</SelectItem>
                  {Object.entries(actionLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Đối tượng</Label>
              <Select
                value={filters.targetType || '_all'}
                onValueChange={(value: string) => {
                  setFilters({ ...filters, targetType: value === '_all' ? '' : value });
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả đối tượng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Tất cả</SelectItem>
                  {Object.entries(targetLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="outline" onClick={handleResetFilters} className="w-full">
                Đặt lại bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Lịch sử hoạt động
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Người thực hiện</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Tên mục tiêu</TableHead>
                <TableHead className="min-w-[200px]">Mô tả thay đổi</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu lịch sử
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(log.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {log.user?.username || 'Hệ thống'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionVariants[log.action] || 'secondary'}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTargetIcon(log.targetType)}
                        <span>{targetLabels[log.targetType] || log.targetType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {log.targetName || `#${log.targetId}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const summary = getChangeSummary(log.action, log.oldValue, log.newValue, 2);
                        if (!summary) {
                          return <span className="text-xs text-muted-foreground italic">-</span>;
                        }
                        return (
                          <span 
                            className="text-xs text-muted-foreground line-clamp-2 max-w-[300px]"
                            title={summary}
                          >
                            {summary}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetail(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Chi tiết hoạt động</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về hành động đã thực hiện
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Thời gian</Label>
                  <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Người thực hiện</Label>
                  <p className="font-medium">{selectedLog.user?.username || 'Hệ thống'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hành động</Label>
                  <div>
                    <Badge variant={actionVariants[selectedLog.action] || 'secondary'}>
                      {actionLabels[selectedLog.action] || selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Đối tượng</Label>
                  <div className="font-medium flex items-center gap-2">
                    {getTargetIcon(selectedLog.targetType)}
                    {targetLabels[selectedLog.targetType] || selectedLog.targetType}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Mục tiêu</Label>
                <p className="font-medium">
                  {selectedLog.targetName || `ID: ${selectedLog.targetId}`}
                </p>
              </div>

              {/* Display changed fields - Only for UPDATE and DELETE actions */}
              {selectedLog.action !== 'CREATE' && (selectedLog.oldValue || selectedLog.newValue) && (
                <div>
                  <Label className="text-muted-foreground">
                    {selectedLog.action === 'DELETE' ? 'Thông tin đã xóa' : 'Chi tiết thay đổi'}
                  </Label>
                  <div className="mt-2 space-y-2 max-h-64 overflow-auto">
                    {(() => {
                      const changes = getChangedFields(selectedLog.oldValue, selectedLog.newValue);
                      if (changes.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground italic">
                            Không có thay đổi chi tiết
                          </p>
                        );
                      }
                      return changes.map((change, idx) => (
                        <div key={idx} className="p-2 bg-muted rounded-md text-sm">
                          <span className="font-medium text-foreground">{change.label}</span>
                          {selectedLog.action === 'DELETE' ? (
                            <span className="text-red-600 dark:text-red-400 ml-2 line-through">
                              {change.oldVal}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-red-600 dark:text-red-400 line-through">
                                {change.oldVal || '(trống)'}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-green-600 dark:text-green-400">
                                {change.newVal || '(trống)'}
                              </span>
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">IP Address</Label>
                  <p className="font-mono">{selectedLog.ipAddress || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Target ID</Label>
                  <p className="font-mono">{selectedLog.targetId}</p>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
