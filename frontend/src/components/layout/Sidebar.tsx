import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useCategories, useCategoryBySlug } from '@/hooks/useCategories';
import { usePopularTags } from '@/hooks/useTags';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Tag, Folder, X, FileText, TrendingUp, Lock, Globe } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { LoginRequiredDialog } from '@/components/common/LoginRequiredDialog';

// Pages where sidebar filter sections should be hidden
const HIDE_FILTERS_PATHS: string[] = ['/posts/', '/categories', '/tags'];

// Permission labels
const permissionLabels: Record<string, string> = {
  MEMBER: 'thành viên',
  MODERATOR: 'điều hành viên',
  ADMIN: 'quản trị viên',
};

// Helper function to check permission level
function checkPermissionLevel(
  userRole: string | undefined,
  requiredLevel: string | undefined
): boolean {
  if (!requiredLevel || requiredLevel === 'ALL') return true;
  if (!userRole) return false;

  const roleHierarchy = ['MEMBER', 'MODERATOR', 'ADMIN'];
  const userLevel = roleHierarchy.indexOf(userRole.toUpperCase());
  const requiredLevelIndex = roleHierarchy.indexOf(requiredLevel);

  return userLevel >= requiredLevelIndex;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  
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
  const { data: popularTags, isLoading: tagsLoading } = usePopularTags(15);
  
  // Get selected category details
  const { data: selectedCategory } = useCategoryBySlug(currentCategory || '');

  // Handle category click - maintains current tags, checks permission
  const handleCategoryClick = (categorySlug: string | null, category?: any) => {
    // Check if category requires permission
    if (category && category.viewPermission && category.viewPermission !== 'ALL') {
      // Not logged in - prompt login dialog
      if (!isAuthenticated) {
        setLoginDialogPermission(category.viewPermission as 'MEMBER' | 'MODERATOR' | 'ADMIN');
        setLoginDialogDescription(
          `Để xem danh mục "${category.name}", bạn cần đăng nhập với quyền ${permissionLabels[category.viewPermission] || category.viewPermission} trở lên.`
        );
        setLoginDialogOpen(true);
        return;
      }
      
      // Logged in but no permission
      if (!checkPermissionLevel(user?.role, category.viewPermission)) {
        toast.error(
          `Bạn cần quyền ${permissionLabels[category.viewPermission] || category.viewPermission} trở lên để xem danh mục này.`
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
  const totalPosts = categories?.reduce((sum, cat) => sum + cat.postCount, 0) || 0;

  return (
    <aside className="h-full overflow-hidden scrollbar-gutter-stable animate-enter-left">
      {/* p-3 md:p-4 - Mobile-optimized sidebar padding */}
      <div className="flex flex-col h-full p-3 md:p-4">
        {/* Categories - 45% height */}
        <div style={{ flex: '0 0 45%' }} className="flex flex-col min-h-0">
          {!shouldHideFilters && (
            <div className="flex flex-col h-full">
              <h3 className="font-semibold mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
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
                    <nav className="space-y-1 pr-3">
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
                          <Badge variant="secondary" className="flex-shrink-0">
                            {totalPosts}
                          </Badge>
                        </div>
                      </button>
                      {categories?.map((category) => {
                        const isRestricted = category.viewPermission && category.viewPermission !== 'ALL';
                        
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
                                  className="w-2.5 h-2.5 rounded-full border flex-shrink-0"
                                  style={{
                                    backgroundColor: category.color,
                                    borderColor: category.color,
                                  }}
                                />
                              )}
                              <span className="truncate text-left">{category.name}</span>
                              {/* PUBLIC label for categories visible to ALL */}
                              {!isRestricted && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 flex-shrink-0 text-green-600 border-green-300 dark:text-green-400 dark:border-green-600">
                                  <Globe className="h-2.5 w-2.5 mr-0.5" />
                                  PUBLIC
                                </Badge>
                              )}
                            </span>
                            <Badge variant="secondary" className="flex-shrink-0">
                              {category.postCount}
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

        {/* Tags - 35% height */}
        <div style={{ flex: '0 0 35%' }} className="flex flex-col min-h-0 mt-3">
          {!shouldHideFilters && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Popular Tags
                </h3>
                {activeTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete('tags');
                      newParams.delete('tag');
                      setSearchParams(newParams);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="border-t pt-3 flex-1 min-h-0">
                {tagsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-16" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 overflow-y-auto">
                    {popularTags?.map((tag) => {
                      const isActive = activeTags.includes(tag.slug);
                      const isRestricted = tag.usePermission && tag.usePermission !== 'ALL';
                      const isInactive = tag.isActive === false;
                      
                      const tagBadge = (
                        <Badge
                          key={tag.id}
                          variant={isActive ? 'default' : 'outline'}
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
                                : `Yêu cầu quyền ${permissionLabels[tag.usePermission!] || tag.usePermission} để sử dụng`}
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
