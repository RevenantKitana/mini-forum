import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { toast } from 'sonner';
import { Flag, AlertTriangle, Loader2 } from 'lucide-react';

type ReportTarget = 'post' | 'comment' | 'user';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTarget;
  targetId: number;
  targetName?: string;
}

const REPORT_REASONS = {
  post: [
    { value: 'spam', label: 'Spam hoặc quảng cáo' },
    { value: 'harassment', label: 'Quấy rối hoặc bắt nạt' },
    { value: 'hate_speech', label: 'Ngôn từ thù ghét' },
    { value: 'misinformation', label: 'Thông tin sai lệch' },
    { value: 'inappropriate', label: 'Nội dung không phù hợp' },
    { value: 'copyright', label: 'Vi phạm bản quyền' },
    { value: 'other', label: 'Lý do khác' },
  ],
  comment: [
    { value: 'spam', label: 'Spam hoặc quảng cáo' },
    { value: 'harassment', label: 'Quấy rối hoặc bắt nạt' },
    { value: 'hate_speech', label: 'Ngôn từ thù ghét' },
    { value: 'inappropriate', label: 'Nội dung không phù hợp' },
    { value: 'other', label: 'Lý do khác' },
  ],
  user: [
    { value: 'spam', label: 'Tài khoản spam' },
    { value: 'harassment', label: 'Quấy rối người dùng khác' },
    { value: 'impersonation', label: 'Giả mạo danh tính' },
    { value: 'inappropriate', label: 'Hành vi không phù hợp' },
    { value: 'other', label: 'Lý do khác' },
  ],
};

const TARGET_LABELS = {
  post: 'bài viết',
  comment: 'bình luận',
  user: 'người dùng',
};

export function ReportModal({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
}: ReportModalProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const reportMutation = useMutation({
    mutationFn: async () => {
      const endpoint =
        targetType === 'post'
          ? `/posts/${targetId}/report`
          : targetType === 'comment'
          ? `/comments/${targetId}/report`
          : `/users/${targetId}/report`;

      return apiClient.post(endpoint, { reason, description });
    },
    onSuccess: () => {
      toast.success('Cảm ơn bạn đã gửi báo cáo. Đội ngũ quản trị sẽ xem xét.');
      onOpenChange(false);
      setReason('');
      setDescription('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể gửi báo cáo.');
    },
  });

  const handleSubmit = () => {
    if (!reason) {
      toast.error('Bạn cần chọn lý do báo cáo.');
      return;
    }
    reportMutation.mutate();
  };

  const reasons = REPORT_REASONS[targetType];
  const targetLabel = TARGET_LABELS[targetType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Báo cáo {targetLabel}
          </DialogTitle>
          <DialogDescription>
            {targetName ? (
              <>Báo cáo {targetLabel}: <strong>{targetName}</strong></>
            ) : (
              <>Cho chúng tôi biết lý do bạn muốn báo cáo {targetLabel} này</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Lý do báo cáo</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả thêm (tùy chọn)</Label>
            <Textarea
              id="description"
              placeholder="Cung cấp thêm chi tiết về vấn đề..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Báo cáo sai sự thật có thể dẫn đến việc hạn chế tài khoản của bạn. 
              Vui lòng chỉ báo cáo khi thực sự cần thiết.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || reportMutation.isPending}
            variant="destructive"
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Flag className="mr-2 h-4 w-4" />
                Gửi báo cáo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
