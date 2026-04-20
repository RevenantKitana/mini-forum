import { Link, useLocation, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useCategories, useCategoryBySlug } from '@/hooks/useCategories';
import { usePopularTags } from '@/hooks/useTags';
import { useRelatedPosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Tag, Folder, X, FileText, TrendingUp, Lock, Globe, Search, Sparkles, Eye, MessageSquare } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { LoginRequiredDialog } from '@/components/common/LoginRequiredDialog';
import type { Post } from '@/api/services/postService';

// Pages where sidebar filter sections should be hidden
const HIDE_FILTERS_PATHS: string[] = ['/posts/', '/categories', '/tags'];

// Permission labels
const permissionLabels: Record<string, string> = {
  MEMBER: 'thành viên',
  MODERATOR: 'điều hành viên',
  ADMIN: 'quản trị viên',
  BOT: 'bot',
};

// Helper function to check permission level
function checkPermissionLevel(
  userRole: string | undefined,
  requiredLevel: string | undefined
): boolean {
  if (!requiredLevel || requiredLevel === 'ALL') return true;
  if (!userRole) return false;

  const roleHierarchy = ['MEMBER', 'MODERATOR', 'ADMIN'];
  const effectiveRole = userRole.toUpperCase() === 'BOT' ? 'MEMBER' : userRole.toUpperCase();
  const userLevel = roleHierarchy.indexOf(effectiveRole);
  const requiredLevelIndex = roleHierarchy.indexOf(requiredLevel);

  return userLevel >= requiredLevelIndex;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { id: postId } = useParams<{ id?: string }>();

  const isDetailPage = location.pathname.startsWith('/posts/') && !!postId;

  // Related posts - only fetch on detail pages
  const { data: relatedPosts, isLoading: relatedLoading } = useRelatedPosts(
    postId ?? '',
    8
  );

  // Login required dialog state
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginDialogPermission, setLoginDialogPermission] = useState<'MEMBER' | 'MODERATOR' | 'ADMIN'>('MEMBER');
  const [loginDialogDescription, setLoginDialogDescription] = useState('');
  
  const currentCategory = searchParams.get('category');
  const currentTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  // Support legacy single tag param
  const legacyTag = searchParams.get('tag');
  const activeTags = legacyTag ? [legacyTag] : currentTags;

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: popularTags, isLoading: tagsLoading } = usePopularTags(12);
  
  // Tag filter state
  const [tagFilter, setTagFilter] = useState('');
  const filteredPopularTags = useMemo(
    () => popularTags?.filter((t) => t.name.toLowerCase().includes(tagFilter.toLowerCase())) ?? [],
    [popularTags, tagFilter]
  );
  
  // Get selected category details
  const { data: selectedCategory } = useCategoryBySlug(currentCategory || '');

  // Handle category click - maintains current tags, checks permission
  const handleCategoryClick = (categorySlug: string | null, category?: any) => {
    // Check if category requires permission
    if (category && category.view_permission && category.view_permission !== 'ALL') {
      // Not logged in - prompt login dialog
      if (!isAuthenticated) {
        setLoginDialogPermission(category.view_permission as 'MEMBER' | 'MODERATOR' | 'ADMIN');
        setLoginDialogDescription(
          `Để xem danh mục "${category.name}", bạn cần đăng nhập với quyền ${permissionLabels[category.view_permission] || category.view_permission} trở lên.`
        );
        setLoginDialogOpen(true);
        return;
      }
      
      // Logged in but no permission
      if (!checkPermissionLevel(user?.role, category.view_permission)) {
        toast.error(
          `Bạn cần quyền ${permissionLabels[category.view_permission] || category.view_permission} trở lên để xem danh mục này.`
        );
        return;
      }
    }

    const newParams = new URLSearchParams();
    if (categorySlug) {
      newParams.set('category', categorySlug);
    }
    // Preserve tags when switching category
    if (activeTags.length > 0) {
      newParams.set('tags', activeTags.join(','));
    }
    navigate(`/?${newParams.toString()}`);
  };

  // Handle tag click - toggles tag selection (multi-select)
  const handleTagClick = (tagSlug: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    // Remove legacy single tag param
    newParams.delete('tag');
    
    let newTags: string[];
    if (activeTags.includes(tagSlug)) {
      // Remove tag if already selected
      newTags = activeTags.filter(t => t !== tagSlug);
    } else {
      // Add tag to selection
      newTags = [...activeTags, tagSlug];
    }
    
    if (newTags.length > 0) {
      newParams.set('tags', newTags.join(','));
    } else {
      newParams.delete('tags');
    }
    
    setSearchParams(newParams);
  };

  // Clear all filters
  const clearAllFilters = () => {
    navigate('/');
  };

  // Check if we should hide filter sections
  const shouldHideFilters = HIDE_FILTERS_PATHS.some(path => location.pathname.startsWith(path));

  // Calculate total posts across all categories
  const totalPosts = categories?.reduce((sum, cat) => sum + cat.post_count, 0) || 0;

  return (
    <aside className="h-full overflow-hidden scrollbar-gutter-stable animate-enter-left transition-transform duration-300">
      {/* p-3 md:p-4 - Mobile-optimized sidebar padding */}
      <div className="flex flex-col h-full p-3 md:p-1 gap-3 md:gap-4">

        {/* ── RELATED POSTS ── show only on post detail page */}
        {isDetailPage && (
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="font-semibold mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Bài viết liên quan</span>
            </h3>
            <div className="border-t pt-3 flex-1 min-h-0">
              {relatedLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : relatedPosts && relatedPosts.length > 0 ? (
                <ScrollArea className="h-full">
                  <div className="space-y-2 pr-3">
                    {relatedPosts.map((post: Post) => (
                      <Link
                        key={post.id}
                        to={`/posts/${post.id}`}
                        className="block p-2.5 rounded-md border hover:bg-muted transition-colors group animate-fade-in-up"
                      >
                        {/* Category color dot */}
                        {post.category?.color && (
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5 align-middle flex-shrink-0"
                            style={{ backgroundColor: post.category.color }}
                          />
                        )}
                        <span className="text-xs font-medium line-clamp-2 group-hover:text-primary leading-snug">
                          {post.title}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Eye className="h-3 w-3" />
                            {post.view_count}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="h-3 w-3" />
                            {post.comment_count}
                          </span>
                          {post.tags && post.tags.length > 0 && (
                            <span className="flex items-center gap-0.5 truncate">
                              <Tag className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{post.tags[0].name}</span>
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Không tìm thấy bài viết liên quan.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── CATEGORIES / TAGS / STATS ── hide entirely on detail page */}
        {!isDetailPage && (<>
        <div style={{ flex: '0 0 37%' }} className="flex flex-col min-h-0">
          {!shouldHideFilters && (
            <div className="flex flex-col h-full">
              <h3 className="font-semibold mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Folder className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Categories</span>
              </h3>
              <div className="border-t pt-3 flex-1 min-h-0">
                {categoriesLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <nav className="space-y-1 pr-1">
                      <button
                        onClick={() => handleCategoryClick(null)}
                        className={`w-full text-left block px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                          !currentCategory && location.pathname === '/'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-muted hover:translate-x-0.5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>Tất cả bài viết</span>
                          <Badge variant="secondary" size="sm" className="flex-shrink-0">
                            {totalPosts}
                          </Badge>
                        </div>
                      </button>
                      {categories?.map((category) => {
                        const isRestricted = category.view_permission && category.view_permission !== 'ALL';
                        
                        return (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category.slug, category)}
                          className={`w-full text-left block px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                            currentCategory === category.slug
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'hover:bg-muted hover:translate-x-0.5'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 flex-1 min-w-0">
                              {/* Category color indicator */}
                              {category.color && (
                                <span
                                  className="w-4 h-3 rounded-sm border flex-shrink-0"
                                  style={{
                                    backgroundColor: category.color,
                                    borderColor: category.color,
                                  }}
                                />
                              )}
                              <span className="truncate text-left">{category.name}</span>
                              {/* PUBLIC label for categories visible to ALL */}
                              {!isRestricted && (
                                <Badge variant="outline" size="xs" className="flex-shrink-0 text-green-600 border-green-300 dark:text-green-400 dark:border-green-600">
                                  <Globe className="h-2.5 w-2.5 mr-0.5" /></Badge>
                              )}
                            </span>
                            <Badge
                              variant="secondary"
                              size="sm"
                              className="flex-shrink-0 border-1"
                              style={{
                                backgroundColor: undefined,
                                borderColor: category.color || undefined,
                              }}
                            >
                              {category.post_count}
                            </Badge>
                          </div>
                        </button>
                        );
                      })}
                    </nav>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: '0 0 35%' }} className="flex flex-col min-h-0 mt-3">
          {!shouldHideFilters && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Popular Tags
                </h3>
              </div>
              <div className="border-t pt-3 flex-1 min-h-0">
                {tagsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-16" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Inline tag filter */}
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Lọc tag..."
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="h-7 text-xs pl-7"
                      />
                    </div>
                    {/* Active tags indicator */}
                    {activeTags.length > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Đang lọc: <strong>{activeTags.length}</strong> tag</span>
                        <button
                          className="text-primary hover:underline text-xs"
                          onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.delete('tags');
                            newParams.delete('tag');
                            setSearchParams(newParams);
                          }}
                        >
                          Xóa hết
                        </button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 overflow-y-auto">
                    {filteredPopularTags.map((tag) => {
                      const isActive = activeTags.includes(tag.slug);
                      const isRestricted = tag.use_permission && tag.use_permission !== 'ALL';
                      const isInactive = tag.is_active === false;
                      
                      const tagBadge = (
                        <Badge
                          key={tag.id}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={`hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer btn-press ${
                            isInactive ? 'opacity-60' : ''
                          } ${isActive ? 'animate-pop-in' : ''}`}
                          onClick={() => handleTagClick(tag.slug)}
                        >
                          {isRestricted && (
                            <Lock className="h-2.5 w-2.5 mr-1 text-amber-600 dark:text-amber-400" />
                          )}
                          {tag.name}
                          {isActive && <X className="ml-1 h-3 w-3" />}
                        </Badge>
                      );

                      if (isRestricted || isInactive) {
                        return (
                          <Tooltip key={tag.id}>
                            <TooltipTrigger asChild>
                              <div>{tagBadge}</div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {isInactive 
                                ? 'Tag này đã bị vô hiệu hóa'
                                : `Yêu cầu quyền ${permissionLabels[tag.use_permission!] || tag.use_permission} để sử dụng`}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return tagBadge;
                    })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Community Stats - 20% height (remaining) */}
        <div style={{ flex: '0 0 20%' }} className="flex flex-col min-h-0 mt-3">
          <div className="flex flex-col h-full rounded-lg border p-3 bg-muted/50 animate-fade-in-up">
            <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 animate-float" />
              Stats
            </h3>
            <div className="space-y-1.5 text-xs text-muted-foreground flex-1 overflow-y-auto">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  <span className="truncate">Categories</span>
                </span>
                <span className="font-medium">{categories?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span className="truncate">Posts</span>
                </span>
                <span className="font-medium">{totalPosts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span className="truncate">Tags</span>
                </span>
                <span className="font-medium">{popularTags?.length || 0}+</span>
              </div>
            </div>
          </div>
        </div>
        </>)}
      </div>
      
      {/* Login Required Dialog */}
      <LoginRequiredDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        title="Yêu cầu đăng nhập"
        description={loginDialogDescription}
        requiredPermission={loginDialogPermission}
      />
    </aside>
  );
}
