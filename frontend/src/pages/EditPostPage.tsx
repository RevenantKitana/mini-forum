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
        categoryId: String(post.categoryId),
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
      const isOwner = post.authorId === user.id || post.author?.id === user.id;
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
      <div className="w-full max-w-4xl mx-auto py-4 sm:py-6 px-0 sm:px-0">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="w-full max-w-4xl mx-auto py-4 sm:py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Không tìm thấy bài viết</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-6 animate-fade-in-up">
      <div className="mb-4 sm:mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-3 sm:mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chỉnh sửa bài viết</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiêu đề</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tiêu đề bài viết..." {...field} />
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
                      <FormLabel>Danh mục</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-muted-foreground">
                          {currentCategory?.color && (
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: currentCategory.color }}
                            />
                          )}
                          {currentCategory?.name || 'Không xác định'}
                          <span className="ml-auto text-xs text-muted-foreground">(Không thể thay đổi)</span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Danh mục không thể thay đổi sau khi đăng bài
                      </FormDescription>
                    </FormItem>
                  );
                }}
              />

              {/* Tags - Read Only */}
              <div className="space-y-2">
                <FormLabel>Tags</FormLabel>
                {selectedTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
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
                    <FormLabel>Nội dung</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nội dung bài viết... (hỗ trợ Markdown)"
                        className="min-h-[200px] sm:min-h-[300px] font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Hỗ trợ Markdown: **đậm**, *nghiêng*, `code`, ## heading
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button type="submit" disabled={updatePost.isPending} className="w-full sm:w-auto">
                  {updatePost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto">
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
