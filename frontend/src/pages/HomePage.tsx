import { useSearchParams, Link } from 'react-router-dom';
import { usePosts } from '@/hooks/usePosts';
import { useCategoryBySlug, useCategories } from '@/hooks/useCategories';
import { PostCard } from '@/components/PostCard';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { Folder, CalendarDays, X, ArrowUpDown, Flame, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useMemo } from 'react';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PostListSkeleton } from '@/components/common/LoadingStates';
import { RestrictedContent } from '@/components/common/RestrictedContent';
import { PostFormDialog } from '@/components/common/PostFormDialog';
import { cn } from '@/lib/utils';
import { MobileCategoryBar } from '@/components/layout/MobileCategoryBar';
import { TagFilterBar } from '@/components/TagFilterBar';

// Sort options with reverse capability
type SortOption = 'latest' | 'popular' | 'trending' | 'oldest_first' | 'unpopular' | 'least_trending';

const SORT_CONFIG: Record<string, { label: string; reverse: SortOption; isReverse: boolean; icon: React.ReactNode }> = {
  latest: { label: 'Mới nhất', reverse: 'oldest_first', isReverse: false, icon: <Clock className="h-3.5 w-3.5" /> },
  oldest_first: { label: 'Cũ nhất', reverse: 'latest', isReverse: true, icon: <Clock className="h-3.5 w-3.5" /> },
  popular: { label: 'Phổ biến', reverse: 'unpopular', isReverse: false, icon: <Flame className="h-3.5 w-3.5" /> },
  unpopular: { label: 'Ít phổ biến', reverse: 'popular', isReverse: true, icon: <Flame className="h-3.5 w-3.5" /> },
  trending: { label: 'Xu hướng', reverse: 'least_trending', isReverse: false, icon: <TrendingUp className="h-3.5 w-3.5" /> },
  least_trending: { label: 'Ít xu hướng', reverse: 'trending', isReverse: true, icon: <TrendingUp className="h-3.5 w-3.5" /> },
};

// Fixed width for tab buttons to prevent layout shift
const TAB_MIN_WIDTH = '100px';

// Quick date range presets
const DATE_PRESETS = [
  { label: 'Hôm nay', getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: '7 ngày qua', getValue: () => ({ from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) }) },
  { label: '30 ngày qua', getValue: () => ({ from: startOfDay(subMonths(new Date(), 1)), to: endOfDay(new Date()) }) },
  { label: '3 tháng qua', getValue: () => ({ from: startOfDay(subMonths(new Date(), 3)), to: endOfDay(new Date()) }) },
];

export function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const page = parseInt(searchParams.get('page') || '1');
  const categorySlug = searchParams.get('category') || undefined;
  const tagSlug = searchParams.get('tag') || undefined;
  const tagsParam = searchParams.get('tags') || undefined;
  const sortParam = (searchParams.get('sort') || 'latest') as SortOption;
  const dateFromParam = searchParams.get('dateFrom') || undefined;
  const dateToParam = searchParams.get('dateTo') || undefined;

  // Get category details if a category is selected
  const { data: selectedCategory } = useCategoryBySlug(categorySlug || '');

  // Check if user has permission to view the category
  const canViewCategory = useMemo(() => {
    if (!selectedCategory) return true; // No category selected, can view all
    
    const viewPermission = selectedCategory.view_permission || 'ALL';
    
    if (viewPermission === 'ALL') return true;
    if (!isAuthenticated) return false;
    if (!user) return false;
    
    const userRole = user.role;
    if (viewPermission === 'MEMBER') return true; // All logged-in users are at least MEMBER
    if (viewPermission === 'MODERATOR') return userRole === 'MODERATOR' || userRole === 'ADMIN';
    if (viewPermission === 'ADMIN') return userRole === 'ADMIN';
    
    return true;
  }, [selectedCategory, isAuthenticated, user]);

  // Categories for mobile category bar (cached, no extra request)
  const { data: allCategories } = useCategories();
  const visibleCategories = useMemo(() =>
    allCategories?.filter(cat => {
      const perm = cat.view_permission || 'ALL';
      if (perm === 'ALL') return true;
      if (!isAuthenticated || !user) return false;
      const role = user.role;
      if (perm === 'MEMBER') return true;
      if (perm === 'MODERATOR') return role === 'MODERATOR' || role === 'ADMIN';
      if (perm === 'ADMIN') return role === 'ADMIN';
      return true;
    }) ?? [],
    [allCategories, isAuthenticated, user]
  );

  const handleMobileCategorySelect = (slug: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (slug) newParams.set('category', slug);
    else newParams.delete('category');
    newParams.delete('page');
    setSearchParams(newParams);
  };

  // Parse applied tags from URL
  const appliedTags = useMemo(() => {
    const tagsSlugs: string[] = [];
    if (tagSlug) tagsSlugs.push(tagSlug);
    if (tagsParam) tagsSlugs.push(...tagsParam.split(',').filter(Boolean));
    return [...new Set(tagsSlugs)];
  }, [tagSlug, tagsParam]);

  const handleTagsApply = (tags: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    if (tags.length > 0) {
      newParams.set('tags', tags.join(','));
    } else {
      newParams.delete('tags');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleTagsClear = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    newParams.delete('tags');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Only fetch posts if user can view the category
  const { data, isLoading } = usePosts(canViewCategory ? {
    page,
    limit: 10,
    category: categorySlug,
    tag: tagSlug,
    tags: tagsParam,
    sort: sortParam,
    dateFrom: dateFromParam,
    dateTo: dateToParam,
  } : { page: 1, limit: 0 }); // Empty query when user cannot view

  // Get header content based on selected category
  const getHeaderContent = () => {
    if (categorySlug && selectedCategory) {
      return {
        title: selectedCategory.name,
        description: selectedCategory.description || `Bảo Admin thêm mô tả cho danh mục này đi nào!`,
        icon: selectedCategory.icon,
        color: selectedCategory.color,
      };
    }
    return {
      title: "Sảnh chính",
      description: 'Tất cả bài viết',
      icon: null,
      color: null,
    };
  };

  // Toggle sort between normal and reverse
  const handleSortClick = (baseSort: 'latest' | 'popular' | 'trending') => {
    const currentConfig = SORT_CONFIG[sortParam];
    const newParams = new URLSearchParams(searchParams);
    
    // If clicking on the same base sort, toggle between normal and reverse
    if (sortParam === baseSort || SORT_CONFIG[sortParam]?.reverse === baseSort) {
      newParams.set('sort', currentConfig.reverse);
    } else {
      // Clicking on different sort, use normal version
      newParams.set('sort', baseSort);
    }
    
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Apply date range filter
  const applyDateFilter = (from?: Date, to?: Date) => {
    const newParams = new URLSearchParams(searchParams);
    if (from) {
      newParams.set('dateFrom', from.toISOString());
    } else {
      newParams.delete('dateFrom');
    }
    if (to) {
      newParams.set('dateTo', to.toISOString());
    } else {
      newParams.delete('dateTo');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
    setIsCalendarOpen(false);
  };

  const clearDateFilter = () => {
    setDateRange({});
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('dateFrom');
    newParams.delete('dateTo');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if a base sort is currently active (either normal or reversed)
  const isSortActive = (baseSort: 'latest' | 'popular' | 'trending') => {
    return sortParam === baseSort || SORT_CONFIG[sortParam]?.reverse === baseSort;
  };

  const headerContent = getHeaderContent();
  const hasDateFilter = dateFromParam || dateToParam;

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      {/* Sticky Header Section - full width */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md py-3.5 px-4 sm:px-8 border-b border-border/30">
        {/* Header - Dynamic based on selected category */}
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              {headerContent.icon ? (
                <span className="text-3xl">{headerContent.icon}</span>
              ) : categorySlug ? (
                <Folder className="h-7 w-7 text-primary flex-shrink-0" />
              ) : (
                <MessageSquare className="h-7 w-7 text-primary animate-float flex-shrink-0" />
              )}
              <h1 className="font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
                {headerContent.title}
                {categorySlug && selectedCategory && (<span className="ml-2 text-base font-normal text-muted-foreground">({selectedCategory.post_count})</span>)}
              </h1>
              {headerContent.description && (
                <p className="hidden md:block flex-1 min-w-0 line-clamp-1 text-muted-foreground text-sm sm:text-base border-l border-border/40 pl-3.5">
                  {headerContent.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sort Tabs with Toggle + Date Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sort buttons with toggle functionality - Borderless */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl">
            {(['popular', 'latest', 'trending'] as const).map((baseSort) => {
              const isActive = isSortActive(baseSort);
              const isReversed = SORT_CONFIG[sortParam]?.isReverse && isSortActive(baseSort);
              const config = SORT_CONFIG[isReversed ? SORT_CONFIG[baseSort].reverse : baseSort];
              
              return (
                <Button
                  key={baseSort}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleSortClick(baseSort)}
                  className={cn(
                    "gap-1.5 btn-press transition-all duration-200 px-4 h-10 text-sm sm:text-base font-semibold rounded-xl",
                    isActive && "animate-tab-slide shadow-xs"
                  )}
                >
                  {SORT_CONFIG[baseSort].icon}
                  <span>{config?.label || SORT_CONFIG[baseSort].label}</span>
                  {isActive && (
                    <ArrowUpDown className="h-4 w-4 ml-0.5 opacity-70 flex-shrink-0" />
                  )}
                </Button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2">
          {/* Date Range Filter */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-10 px-4 text-sm sm:text-base font-semibold rounded-xl bg-muted/60 hover:bg-muted text-foreground">
                <CalendarDays className="h-4.5 w-4.5" />
                {hasDateFilter ? (
                  <span className="text-sm">
                    {dateFromParam && format(new Date(dateFromParam), 'dd/MM/yy', { locale: vi })}
                    {' - '}
                    {dateToParam && format(new Date(dateToParam), 'dd/MM/yy', { locale: vi })}
                  </span>
                ) : (
                  <span className="hidden sm:inline">Khoảng thời gian</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                {/* Quick presets */}
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((preset) => (
                    <Badge
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 btn-press text-xs sm:text-sm font-medium rounded-lg px-2.5 py-1"
                      onClick={() => {
                        const range = preset.getValue();
                        setDateRange(range);
                        applyDateFilter(range.from, range.to);
                      }}
                    >
                      {preset.label}
                    </Badge>
                  ))}
                </div>
                
                {/* Calendar picker */}
                <Calendar
                  mode="range"
                  selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                  onSelect={(range) => {
                    if (range) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  locale={vi}
                  numberOfMonths={1}
                />
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="btn-interactive h-10 text-sm sm:text-base font-semibold rounded-xl"
                    onClick={() => applyDateFilter(dateRange.from, dateRange.to)}
                    disabled={!dateRange.from}
                  >
                    Áp dụng
                  </Button>
                  <Button size="sm" variant="ghost" className="btn-press h-10 text-sm sm:text-base font-semibold rounded-xl" onClick={clearDateFilter}>
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          </div>

          {/* Active date filter badge */}
          {hasDateFilter && (
            <Badge variant="secondary" size="sm" className="gap-1.5 animate-pop-in py-2 px-3.5 text-xs sm:text-sm font-medium rounded-xl">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Đang lọc theo thời gian</span>
              <span className="sm:hidden">Thời gian</span>
              <X 
                className="h-4 w-4 cursor-pointer hover:text-destructive transition-colors duration-200" 
                onClick={clearDateFilter}
              />
            </Badge>
          )}

          {/* Tag Filter */}
          <TagFilterBar
            appliedTags={appliedTags}
            onApply={handleTagsApply}
            onClear={handleTagsClear}
          />
        </div>
      </div>

      {/* Scrollable Posts List - Center Aligned for optimal whitespace reading */}
      <div className="flex-1 overflow-y-auto pt-4 px-4 sm:px-6 md:px-8 pb-10">
        <div className="max-w-5xl xl:max-w-6xl mx-auto w-full">
          {/* Mobile Category Bar */}
          <MobileCategoryBar
            categories={visibleCategories}
            activeCategory={categorySlug ?? null}
            onSelect={handleMobileCategorySelect}
          />
          {/* Show restricted content message if user cannot view category */}
          {!canViewCategory && selectedCategory ? (
            <RestrictedContent
              title={`Nội dung "${selectedCategory.name}" bị giới hạn`}
              requiredPermission={selectedCategory.view_permission as 'MEMBER' | 'MODERATOR' | 'ADMIN'}
              type="category"
            />
          ) : isLoading ? (
            <div className="w-full">
              <PostListSkeleton count={5} />
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="w-full">
              <div className="space-y-4">
                {data.data.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="animate-stagger"
                    style={{ '--stagger-index': index } as React.CSSProperties}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
              </div>

            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 pb-6 flex-wrap items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-press h-9 px-3 text-sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  ← <span className="hidden sm:inline ml-1">Trước</span>
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(data.pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === data.pagination.totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="btn-press h-9 w-9 p-0 text-sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return <span key={pageNum} className="text-muted-foreground text-sm px-1">...</span>;
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-press h-9 px-3 text-sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data.pagination.totalPages}
                >
                  <span className="hidden sm:inline mr-1">Tiếp</span> →
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in-up">
            <p className="text-muted-foreground">Không có bài viết nào</p>
            {isAuthenticated && (
              <PostFormDialog
                mode="create"
                trigger={<Button className="mt-4 btn-interactive">Tạo bài viết đầu tiên</Button>}
              />
            )}
          </div>
        )}
        </div>
      </div>

      {/* Mobile FAB - create post, only for authenticated users */}
      {isAuthenticated && (
        <div className="sm:hidden fixed bottom-5 right-4 z-40">
          <PostFormDialog
            mode="create"
            trigger={
              <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg btn-press"
                aria-label="Tạo bài viết mới"
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
