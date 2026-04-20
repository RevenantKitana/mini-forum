import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { usePost, useUpdatePost } from '@/hooks/usePosts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Skeleton } from '@/app/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Save, Edit2 } from 'lucide-react';
import { MarkdownGuide } from '@/components/common/MarkdownGuide';

const postSchema = z.object({
  title: z.string().min(10, 'Tiêu đề tối thiểu 10 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự'),
  content: z.string().min(50, 'Nội dung tối thiểu 50 ký tự').max(10000, 'Nội dung tối đa 10000 ký tự'),
});

type PostFormData = z.infer<typeof postSchema>;

interface EditPostDialogProps {
  postId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditPostDialog({ postId, open, onOpenChange, onSuccess }: EditPostDialogProps) {
  const { user } = useAuth();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categoryName, setCategoryName] = useState('');

  const { data: post, isLoading: postLoading } = usePost(postId);
  const { data: categories = [] } = useCategories();
  const updatePostMutation = useUpdatePost();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  });

  // Load post data when dialog opens
  useEffect(() => {
    if (open && post) {
      reset({
        title: post.title,
        content: post.content,
      });
      // Set tags
      if (post.tags) {
        const tagNames = post.tags.map((t: any) => t.name || t.tag?.name || t).filter(Boolean);
        setSelectedTags(tagNames);
      }
      // Set category name
      const category = categories.find((c: any) => c.id === post.category_id);
      setCategoryName(category?.name || 'Không xác định');
    }
  }, [open, post, reset, categories]);

  // Check authorization
  useEffect(() => {
    if (open && post && user) {
      const isOwner = post.author_id === user.id || post.author?.id === user.id;
      const isAdmin = user.role === 'ADMIN';
      const isModerator = user.role === 'MODERATOR';

      if (!isOwner && !isAdmin && !isModerator) {
        toast.error('Bạn không có quyền chỉnh sửa bài viết này');
        onOpenChange(false);
      }
    }
  }, [open, post, user, onOpenChange]);

  const onSubmit = (data: PostFormData) => {
    updatePostMutation.mutate(
      {
        id: postId,
        data: {
          title: data.title,
          content: data.content,
        },
      },
      {
        onSuccess: () => {

          onOpenChange(false);
          onSuccess?.();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[50vw] max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            <DialogTitle className="text-xl">Chỉnh sửa bài viết</DialogTitle>
          </div>
          <DialogDescription>
            Cập nhật nội dung bài viết của bạn
          </DialogDescription>
        </DialogHeader>
        
        {postLoading ? (
          <div className="px-6 pb-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : !post ? (
          <div className="px-6 pb-6 text-center text-muted-foreground">
            Không tìm thấy bài viết
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(80vh-140px)]">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 pb-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Tiêu đề</Label>
                <Input
                  id="edit-title"
                  placeholder="Tiêu đề bài viết của bạn..."
                  {...register('title')}
                  className="text-base"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Category - Read Only */}
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-muted-foreground">
                  {categoryName}
                  <span className="ml-auto text-xs">(Không thể thay đổi)</span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-content">Nội dung</Label>
                  <MarkdownGuide variant="inline" />
                </div>
                <Textarea
                  id="edit-content"
                  placeholder="Viết nội dung bài viết của bạn... (Hỗ trợ Markdown)"
                  rows={10}
                  {...register('content')}
                  className="resize-none"
                />
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content.message}</p>
                )}
              </div>

              {/* Tags - Read Only */}
              <div className="space-y-2">
                <Label>Tags</Label>
                {selectedTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có tags</p>
                )}
                <p className="text-xs text-muted-foreground">Tags không thể thay đổi sau khi đăng bài</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="gap-1.5"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={updatePostMutation.isPending}
                  className="flex-1 gap-1.5"
                >
                  {updatePostMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </form>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EditPostDialog;
