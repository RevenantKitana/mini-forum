import { useState, useEffect, useCallback, KeyboardEvent, ChangeEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useTags, usePopularTagsForCategory } from '@/hooks/useTags';
import { useCreatePost } from '@/hooks/usePosts';
import { Category } from '@/api/services/categoryService';
import { Tag } from '@/api/services/tagService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { toast } from 'sonner';
import { X, Plus, Loader2, Save, Send, TrendingUp, Trash2, PenSquare, AlertTriangle } from 'lucide-react';
import { MarkdownGuide } from '@/components/common/MarkdownGuide';
import { EmojiPicker } from '@/components/common/EmojiPicker';
import { cn } from '@/lib/utils';

// Draft storage key
const DRAFT_STORAGE_KEY = 'post_draft';

interface DraftData {
  title: string;
  content: string;
  categoryId: string;
  selectedTags: number[];
  customTags: string[];
  savedAt: string;
}

const postSchema = z.object({
  title: z.string().min(10, 'Tiêu đề tối thiểu 10 ký tự').max(200, 'Tiêu đề tối đa 200 ký tự'),
  content: z.string().min(50, 'Nội dung tối thiểu 50 ký tự').max(10000, 'Nội dung tối đa 10000 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function CreatePostDialog({ trigger, className }: CreatePostDialogProps) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showNoTagsDialog, setShowNoTagsDialog] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<PostFormData | null>(null);
  // Track restricted tags that user tried to add
  const [restrictedTagWarnings, setRestrictedTagWarnings] = useState<string[]>([]);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: categories = [] } = useCategories();
  const { data: availableTags = [] } = useTags();
  const createPostMutation = useCreatePost();

  // Helper function to check if user has required permission level
  const hasPermission = (requiredLevel: string | undefined): boolean => {
    if (!requiredLevel || requiredLevel === 'ALL') return true;
    if (!user) return false;
    
    const userRole = user.role?.toUpperCase() || 'MEMBER';
    const roleHierarchy = ['MEMBER', 'MODERATOR', 'ADMIN'];
    const effectiveRole = userRole === 'BOT' ? 'MEMBER' : userRole;
    const userLevel = roleHierarchy.indexOf(effectiveRole);
    const requiredLevelIndex = roleHierarchy.indexOf(requiredLevel);
    
    return userLevel >= requiredLevelIndex;
  };

  // Permission labels for display
  const permissionLabels: Record<string, string> = {
    MEMBER: 'thành viên',
    MODERATOR: 'điều hành viên',
    ADMIN: 'quản trị viên',
    BOT: 'bot',
  };

  // Filter tags that user has permission to use
  const userAccessibleTags = availableTags.filter((tag: Tag) => hasPermission(tag.usePermission));

  // Filter categories that user has permission to post
  const userAccessibleCategories = categories.filter((category: Category) => 
    hasPermission(category.postPermission)
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    reset,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  });

  const categoryId = watch('categoryId');
  const title = watch('title');
  const content = watch('content');

  // Insert emoji at cursor position in content textarea
  const handleInsertContentEmoji = (emoji: string) => {
    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = content || '';
      const newValue = currentContent.slice(0, start) + emoji + currentContent.slice(end);
      setValue('content', newValue);
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setValue('content', (content || '') + emoji);
    }
  };

  // Load popular tags for selected category
  const { data: recommendedTags = [] } = usePopularTagsForCategory(
    categoryId ? parseInt(categoryId) : undefined,
    5
  );

  // Filter recommended tags that user has permission to use
  const accessibleRecommendedTags = recommendedTags.filter((tag: Tag) => hasPermission(tag.usePermission));

  // Save draft function
  const saveDraft = useCallback((showToast = true) => {
    const values = getValues();
    if (!values.title && !values.content && selectedTags.length === 0 && customTags.length === 0) {
      return;
    }
    const draft: DraftData = {
      title: values.title || '',
      content: values.content || '',
      categoryId: values.categoryId || '',
      selectedTags,
      customTags,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    if (showToast) {
      // Silent save
    }
    setHasDraft(true);
  }, [getValues, selectedTags, customTags]);

  // Load draft when dialog opens
  useEffect(() => {
    if (open) {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const draft: DraftData = JSON.parse(savedDraft);
          setHasDraft(true);
          // Auto restore draft
          setValue('title', draft.title);
          setValue('content', draft.content);
          setValue('categoryId', draft.categoryId);
          setSelectedTags(draft.selectedTags);
          setCustomTags(draft.customTags);
          if (draft.title || draft.content) {
            toast.info('Đã khôi phục bản nháp');
          }
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    }
  }, [open, setValue]);

  // Auto-save draft every 30 seconds when dialog is open
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      const values = getValues();
      if (values.title || values.content) {
        saveDraft(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [open, saveDraft, getValues]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
  };

  const resetForm = () => {
    reset();
    setSelectedTags([]);
    setCustomTags([]);
    setTagInput('');
  };

  // Handle dialog close attempt
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      const values = getValues();
      const hasContent = values.title || values.content || selectedTags.length > 0 || customTags.length > 0;
      
      if (hasContent) {
        setShowCancelDialog(true);
      } else {
        setOpen(false);
      }
    } else {
      setOpen(true);
    }
  };

  // Handle cancel with save draft
  const handleCancelWithSave = () => {
    saveDraft(true);
    setShowCancelDialog(false);
    setOpen(false);
  };

  // Handle cancel with discard
  const handleCancelWithDiscard = () => {
    clearDraft();
    resetForm();
    setShowCancelDialog(false);
    setOpen(false);
  };

  // Get tag names from selected tag IDs
  const getSelectedTagNames = (): string[] => {
    return selectedTags
      .map(id => availableTags.find((t: Tag) => t.id === id)?.name)
      .filter((name): name is string => !!name);
  };

  const onSubmit = (data: PostFormData) => {
    const allTagNames = [...getSelectedTagNames(), ...customTags];

    // Show reminder if no tags selected
    if (allTagNames.length === 0) {
      setPendingSubmitData(data);
      setShowNoTagsDialog(true);
      return;
    }

    submitPost(data, allTagNames);
  };

  const submitPost = (data: PostFormData, allTagNames: string[]) => {
    createPostMutation.mutate(
      {
        title: data.title,
        content: data.content,
        categoryId: parseInt(data.categoryId),
        tags: allTagNames,
        status: 'PUBLISHED',
      },
      {
        onSuccess: () => {
          clearDraft();
          resetForm();
          setOpen(false);
          navigate('/');
        },
        onError: () => {
          toast.error('Đăng bài thất bại. Vui lòng thử lại.');
        },
      }
    );
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCustomTag();
    }
  };

  const addCustomTag = () => {
    const tagName = tagInput.trim().toLowerCase();
    if (!tagName) return;
    
    // Don't add duplicate custom tags
    if (customTags.includes(tagName)) {
      setTagInput('');
      return;
    }

    // Check if tag exists in available tags (regardless of permission)
    const existingTag = availableTags.find((t: Tag) => t.name.toLowerCase() === tagName);
    
    if (existingTag) {
      // Tag exists - check permissions
      if (!existingTag.isActive) {
        // Tag is inactive
        const warning = `Tag "${existingTag.name}" đã bị vô hiệu hóa và không thể sử dụng.`;
        if (!restrictedTagWarnings.includes(warning)) {
          setRestrictedTagWarnings(prev => [...prev, warning]);
        }
        setTagInput('');
        return;
      }
      
      if (!hasPermission(existingTag.usePermission)) {
        // User doesn't have permission to use this tag
        const requiredRole = permissionLabels[existingTag.usePermission] || existingTag.usePermission;
        const warning = `Tag "${existingTag.name}" yêu cầu quyền ${requiredRole} trở lên để sử dụng.`;
        if (!restrictedTagWarnings.includes(warning)) {
          setRestrictedTagWarnings(prev => [...prev, warning]);
        }
        setTagInput('');
        return;
      }
      
      // User has permission - add to selected tags
      if (!selectedTags.includes(existingTag.id)) {
        setSelectedTags(prev => [...prev, existingTag.id]);
      }
    } else {
      // New tag - allow creation
      setCustomTags(prev => [...prev, tagName]);
    }
    setTagInput('');
  };

  const removeCustomTag = (tagName: string) => {
    setCustomTags(prev => prev.filter(t => t !== tagName));
  };

  const clearTagWarning = (warning: string) => {
    setRestrictedTagWarnings(prev => prev.filter(w => w !== warning));
  };

  const addRecommendedTag = (tagId: number) => {
    if (!selectedTags.includes(tagId)) {
      setSelectedTags(prev => [...prev, tagId]);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm" className={cn("gap-1.5 btn-press", className)}>
              <PenSquare className="h-4 w-4" />
              <span className="hidden lg:inline">Viết bài</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-none w-[50vw] max-h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">Tạo bài viết mới</DialogTitle>
              {hasDraft && (
                <span className="text-xs text-muted-foreground">
                  Bản nháp được lưu
                </span>
              )}
            </div>
            <DialogDescription>
              Chia sẻ suy nghĩ, ý tưởng của bạn với cộng đồng
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(80vh-140px)]">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 pb-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  placeholder="Tiêu đề bài viết của bạn..."
                  {...register('title')}
                  className="text-base"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Danh mục</Label>
                <Select
                  value={categoryId}
                  onValueChange={(value: string) => setValue('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userAccessibleCategories.map((category: Category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        <div className="flex items-center gap-2">
                          {category.color && (
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Nội dung</Label>
                  <div className="flex items-center gap-1">
                    <EmojiPicker 
                      onEmojiSelect={handleInsertContentEmoji}
                      side="bottom"
                      align="end"
                    />
                    <MarkdownGuide variant="inline" />
                  </div>
                </div>
                <Textarea
                  id="content"
                  placeholder="Viết nội dung bài viết của bạn... (Hỗ trợ Markdown)"
                  rows={10}
                  {...register('content')}
                  ref={(e: HTMLTextAreaElement | null) => {
                    register('content').ref(e);
                    (contentTextareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                  }}
                  className="resize-none"
                />
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content.message}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label>Tags (Tùy chọn)</Label>
                
                {/* Custom Tag Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập tag và nhấn Enter..."
                    value={tagInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCustomTag}
                    disabled={!tagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Custom Tags (newly created) */}
                {customTags.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tags mới sẽ được tạo:</p>
                    <div className="flex flex-wrap gap-2">
                      {customTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="default"
                          size="sm"
                          className="cursor-pointer bg-green-600 hover:bg-green-700"
                          onClick={() => removeCustomTag(tag)}
                        >
                          {tag}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tag Permission Warnings */}
                {restrictedTagWarnings.length > 0 && (
                  <div className="space-y-2">
                    {restrictedTagWarnings.map((warning, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm"
                      >
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">{warning}</span>
                        <button
                          type="button"
                          className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
                          onClick={() => clearTagWarning(warning)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommended Tags */}
                {categoryId && accessibleRecommendedTags.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Tags gợi ý cho danh mục:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {accessibleRecommendedTags.map((tag: Tag) => {
                        const isAlreadySelected = selectedTags.includes(tag.id);
                        return (
                          <Badge
                            key={tag.id}
                            variant={isAlreadySelected ? 'default' : 'outline'}
                            size="sm"
                            className={`cursor-pointer ${isAlreadySelected ? '' : 'border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground'}`}
                            onClick={() => !isAlreadySelected && addRecommendedTag(tag.id)}
                          >
                            {tag.name}
                            {isAlreadySelected && <X className="ml-1 h-3 w-3" onClick={(e) => { e.stopPropagation(); toggleTag(tag.id); }} />}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Existing Tags */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Hoặc chọn từ tags có sẵn:</p>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {userAccessibleTags.slice(0, 20).map((tag: Tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                        {selectedTags.includes(tag.id) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => saveDraft(true)}
                  disabled={createPostMutation.isPending || (!title && !content)}
                  className="gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  Lưu nháp
                </Button>
                <Button
                  type="submit"
                  disabled={createPostMutation.isPending}
                  className="flex-1 gap-1.5"
                >
                  {createPostMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang đăng...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Đăng bài
                    </>
                  )}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có muốn lưu bản nháp?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có nội dung chưa lưu. Bạn muốn lưu lại để tiếp tục chỉnh sửa sau, hay hủy bỏ hoàn toàn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
              Tiếp tục viết
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleCancelWithSave}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Lưu nháp & Đóng
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelWithDiscard}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Hủy nháp
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Tags Reminder Dialog */}
      <AlertDialog open={showNoTagsDialog} onOpenChange={setShowNoTagsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Bài viết chưa có tag
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chưa thêm tag nào cho bài viết. Thêm tag giúp bài viết dễ tìm kiếm và phân loại hơn. Bạn vẫn muốn đăng bài không có tag?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => { setShowNoTagsDialog(false); setPendingSubmitData(null); }}>
              Quay lại thêm tag
            </AlertDialogCancel>
            <Button
              onClick={() => {
                setShowNoTagsDialog(false);
                if (pendingSubmitData) {
                  submitPost(pendingSubmitData, []);
                  setPendingSubmitData(null);
                }
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Đăng bài không tag
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default CreatePostDialog;
