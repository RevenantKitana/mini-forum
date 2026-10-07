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

  // Total posts across all categories for "Tất cả bài viết" count badge
  const totalPosts = categories?.reduce((sum, cat) => sum + cat.post_count, 0) || 0;

  return (
    <aside className="h-full overflow-y-auto scrollbar-gutter-stable animate-enter-left transition-transform duration-300">
      <div className="flex flex-col h-full p-4 space-y-6">

        {/* ── RELATED POSTS ── show only on post detail page */}
        {isDetailPage && (
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 flex-shrink-0 text-primary/70" />
              <span className="truncate">Bài viết liên quan</span>
            </h3>
            <div className="flex-1 min-h-0">
              {relatedLoading ? (
                <div className="space-y-2.5">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : relatedPosts && relatedPosts.length > 0 ? (
                <ScrollArea className="h-full">
                  <div className="space-y-2.5 pr-3">
                    {relatedPosts.map((post: Post) => (
                      <Link
                        key={post.id}
                        to={`/posts/${post.id}`}
                        className="block p-3.5 rounded-xl bg-muted/30 hover:bg-muted/70 transition-colors group animate-fade-in-up"
                      >
                        {/* Category color dot */}
                        {post.category?.color && (
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2 mb-0.5 align-middle flex-shrink-0"
                            style={{ backgroundColor: post.category.color }}
                          />
                        )}
                        <span className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-primary leading-snug">
                          {post.title}
                        </span>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {post.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {post.comment_count}
                          </span>
                          {post.tags && post.tags.length > 0 && (
                            <span className="flex items-center gap-1 truncate">
                              <Tag className="h-3.5 w-3.5 flex-shrink-0" />
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

        {/* ── CATEGORIES / TAGS ── hide entirely on detail page */}
        {!isDetailPage && (
          <div className="space-y-6">
            {!shouldHideFilters && (
              <>
                {/* Categories section */}
                <div className="space-y-2.5">
                  <h3 className="font-bold flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider text-muted-foreground px-1">
                    <Folder className="h-4.5 w-4.5 flex-shrink-0 text-primary/80" />
                    <span>Chuyên mục</span>
                  </h3>
                  <div>
                    {categoriesLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full rounded-xl" />
                        ))}
                      </div>
                    ) : (
                      <nav className="space-y-1.5">
                        <button
                          onClick={() => handleCategoryClick(null)}
                          className={`w-full text-left block px-3.5 py-2.5 rounded-xl text-sm sm:text-[15px] font-medium transition-all duration-150 ${
                            !currentCategory && location.pathname === '/'
                              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm font-semibold'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">Tất cả bài viết</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${!currentCategory && location.pathname === '/' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900 font-bold' : 'bg-muted text-muted-foreground font-mono font-medium'}`}>
                              {totalPosts}
                            </span>
                          </div>
                        </button>
                        {categories?.map((category) => {
                          const isSelected = currentCategory === category.slug;
                          
                          return (
                            <button
                              key={category.id}
                              onClick={() => handleCategoryClick(category.slug, category)}
                              className={`w-full text-left block px-3.5 py-2.5 rounded-xl text-sm sm:text-[15px] font-medium transition-all duration-150 ${
                                isSelected
                                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm font-semibold'
                                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-3 flex-1 min-w-0">
                                  {/* Category color indicator dot */}
                                  <span
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor: category.color || '#6b7280',
                                    }}
                                  />
                                  <span className="truncate">{category.name}</span>
                                </span>
                                <span className={`text-xs sm:text-sm px-2.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900 font-bold' : 'bg-muted text-muted-foreground font-mono font-medium'}`}>
                                  {category.post_count}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </nav>
                    )}
                  </div>
                </div>

                {/* Popular Tags section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                      <Tag className="h-4.5 w-4.5 text-primary/80" />
                      <span>Thẻ phổ biến</span>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {/* Inline tag search */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm tag..."
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="h-10 sm:h-11 text-sm sm:text-base pl-9 bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-ring/30 rounded-xl"
                      />
                    </div>

                    {/* Active tags indicator */}
                    {activeTags.length > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground px-1">
                        <span>Đang lọc: <strong>{activeTags.length}</strong> tag</span>
                        <button
                          className="text-primary hover:underline text-xs sm:text-sm font-medium"
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

                    {tagsLoading ? (
                      <div className="flex flex-wrap gap-2">
                        {[...Array(6)].map((_, i) => (
                          <Skeleton key={i} className="h-9 w-20 rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {filteredPopularTags.map((tag) => {
                          const isActive = activeTags.includes(tag.slug);
                          const isRestricted = tag.use_permission && tag.use_permission !== 'ALL';
                          const isInactive = tag.is_active === false;
                          
                          const tagBadge = (
                            <span
                              key={tag.id}
                              className={`inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-all duration-150 ${
                                isActive
                                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm font-semibold'
                                  : 'bg-muted/70 text-muted-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-foreground'
                              } ${isInactive ? 'opacity-50' : ''}`}
                              onClick={() => handleTagClick(tag.slug)}
                            >
                              {isRestricted && (
                                <Lock className="h-3.5 w-3.5 mr-1 text-amber-600 dark:text-amber-400" />
                              )}
                              #{tag.name}
                              {isActive && <X className="ml-1.5 h-3.5 w-3.5" />}
                            </span>
                          );

                          if (isRestricted || isInactive) {
                            return (
                              <Tooltip key={tag.id}>
                                <TooltipTrigger asChild>
                                  <div>{tagBadge}</div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs sm:text-sm">
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
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
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
