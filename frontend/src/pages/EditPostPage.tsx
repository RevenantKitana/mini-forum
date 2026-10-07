import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePost, useUpdatePost } from '@/hooks/usePosts';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

const postFormSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự'),
  content: z.string().min(20, 'Nội dung phải có ít nhất 20 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
});

type PostFormData = z.infer<typeof postFormSchema>;

export function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const postId = id ? parseInt(id) : 0;
  const { data: post, isLoading: postLoading, error: postError } = usePost(postId);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const updatePost = useUpdatePost();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      content: '',
      categoryId: '',
    },
  });

  // Populate form when post data loads
  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        content: post.content,
        categoryId: String(post.category_id),
      });
      // Set tags
      if (post.tags) {
        setSelectedTags(post.tags.map((t: any) => t.name || t.tag?.name || t));
      }
    }
  }, [post, form]);

  // Check authorization
  useEffect(() => {
    if (post && user) {
      const isOwner = post.author_id === user.id || post.author?.id === user.id;
      const isAdmin = user.role === 'ADMIN';
      const isModerator = user.role === 'MODERATOR';

      if (!isOwner && !isAdmin && !isModerator) {
        toast.error('Bạn không có quyền chỉnh sửa bài viết này');
        navigate(-1);
      }
    }
  }, [post, user, navigate]);

  const onSubmit = async (data: PostFormData) => {
    try {
      await updatePost.mutateAsync({
        id: postId,
        data: {
          title: data.title,
          content: data.content,
        },
      });
      navigate(`/posts/${postId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (postLoading || categoriesLoading) {
    return (
      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
        <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
          <CardHeader className="p-6 sm:p-8">
            <Skeleton className="h-8 w-48 rounded-xl" />
          </CardHeader>
          <CardContent className="p-6 sm:p-8 pt-0 space-y-6">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-1/2 rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-11 w-36 rounded-xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
        <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base sm:text-lg text-muted-foreground mb-4">Không tìm thấy bài viết hoặc bài viết đã bị xóa</p>
            <Button
              className="h-10 px-5 text-sm font-semibold rounded-xl btn-press"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl hover:bg-muted btn-press"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Chỉnh sửa bài viết</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5">Cập nhật nội dung tiêu đề và văn bản bài viết</p>
        </div>
      </div>

      <Card className="rounded-2xl border-0 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
        <CardContent className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base font-semibold">Tiêu đề</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nhập tiêu đề bài viết..."
                        className="h-11 text-sm sm:text-base rounded-xl bg-muted/30 border-0 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category - Read Only */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => {
                  const currentCategory = categories?.find((c: any) => String(c.id) === field.value);
                  return (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">Danh mục</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2.5 h-11 px-4 rounded-xl bg-muted/40 text-foreground font-medium text-sm sm:text-base">
                          {currentCategory?.color && (
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: currentCategory.color }}
                            />
                          )}
                          {currentCategory?.name || 'Không xác định'}
                          <span className="ml-auto text-xs text-muted-foreground font-normal">(Cố định)</span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm text-muted-foreground">
                        Danh mục không thể thay đổi sau khi đăng bài
                      </FormDescription>
                    </FormItem>
                  );
                }}
              />

              {/* Tags - Read Only */}
              <div className="space-y-2">
                <FormLabel className="text-sm sm:text-base font-semibold">Tags</FormLabel>
                {selectedTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs sm:text-sm px-3 py-1 rounded-xl">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có tags</p>
                )}
                <p className="text-xs text-muted-foreground">Tags không thể thay đổi sau khi đăng bài</p>
              </div>

              {/* Content */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base font-semibold">Nội dung</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nội dung bài viết... (hỗ trợ định dạng Markdown)"
                        className="min-h-[240px] sm:min-h-[320px] text-sm sm:text-base rounded-xl bg-muted/30 border-0 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20 leading-relaxed font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm text-muted-foreground">
                      Hỗ trợ định dạng Markdown: **đậm**, *nghiêng*, `code`, ## tiêu đề
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={updatePost.isPending}
                  className="h-11 px-6 text-sm sm:text-base font-semibold rounded-xl w-full sm:w-auto btn-press"
                >
                  {updatePost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="h-11 px-6 text-sm sm:text-base font-semibold rounded-xl w-full sm:w-auto border-0 bg-muted/40 hover:bg-muted/70 btn-press"
                >
                  Hủy
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
