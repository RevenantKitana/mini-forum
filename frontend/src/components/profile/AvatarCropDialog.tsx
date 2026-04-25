import { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateAvatar } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarUrl } from '@/utils/imageHelpers';

// ── Helpers ────────────────────────────────────────────────────────────────────

function centerSquareCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
    width,
    height,
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AvatarCropDialog() {
  const { user, refreshUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatarMutation = useUpdateAvatar();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ JPG, PNG, WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file tối đa 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setCrop(centerSquareCrop(naturalWidth, naturalHeight));
  }, []);

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          toast.error('Không thể xử lý ảnh. Vui lòng thử lại.');
          return;
        }

        const formData = new FormData();
        formData.append('file', blob, 'avatar.webp');

        try {
          await uploadAvatarMutation.mutateAsync(formData);
          await refreshUser();
          setDialogOpen(false);
          setImgSrc('');
          toast.success('Cập nhật ảnh đại diện thành công!');
        } catch (error: any) {
          toast.error(
            error.response?.data?.message || 'Không thể cập nhật ảnh đại diện.',
          );
        }
      },
      'image/webp',
      0.85,
    );
  };

  const handleDialogClose = (open: boolean) => {
    if (!uploadAvatarMutation.isPending) {
      setDialogOpen(open);
      if (!open) setImgSrc('');
    }
  };

  const avatarSrc = getAvatarUrl(user, 'standard') || undefined;
  const fallback = (user?.display_name?.[0] || user?.username?.[0] || '?').toUpperCase();

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Avatar preview + trigger button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Avatar className="h-20 w-20 flex-shrink-0">
          <AvatarImage src={avatarSrc} alt={user?.display_name || user?.username} />
          <AvatarFallback className="text-xl">{fallback}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Chọn ảnh từ máy tính
          </Button>
          <p className="text-xs text-muted-foreground">
            Hỗ trợ JPG, PNG, WebP. Tối đa 5 MB.
          </p>
        </div>
      </div>

      {/* Crop dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cắt ảnh đại diện</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {imgSrc && (
              <div className="max-h-[420px] overflow-auto w-full flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={false}
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Ảnh cần cắt"
                    onLoad={onImageLoad}
                    style={{ maxHeight: '400px', maxWidth: '100%' }}
                  />
                </ReactCrop>
              </div>
            )}
            <p className="text-xs text-muted-foreground self-start">
              Kéo để điều chỉnh vùng cắt. Ảnh sẽ được lưu dạng hình vuông.
            </p>
            <div className="flex gap-3 w-full justify-end">
              <Button
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={uploadAvatarMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!completedCrop || uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tải lên...
                  </>
                ) : (
                  'Xác nhận'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
