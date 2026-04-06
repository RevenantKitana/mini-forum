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
    
    const viewPermission = selectedCategory.viewPermission || 'ALL';
    
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
      const perm = cat.viewPermission || 'ALL';
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
        description: selectedCategory.description || `Khám phá các bài viết trong danh mục ${selectedCategory.name}`,
        icon: selectedCategory.icon,
        color: selectedCategory.color,
      };
    }
    return {
      title: 'Thảo luận',
      description: 'Tham gia cuộc trò chuyện và chia sẻ suy nghĩ của bạn',
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
      {/* Sticky Header Section - full width, positioned at container top */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pb-2 sm:pb-3 -mx-4 sm:-mx-5 px-4 sm:px-5 pt-2 sm:pt-3 border-b border-border/50">
        {/* Header - Dynamic based on selected category */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-responsive-sm">
              {headerContent.icon ? (
                <span className="text-responsive-2xl">{headerContent.icon}</span>
              ) : categorySlug ? (
                <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
              ) : (
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-float flex-shrink-0" />
              )}
              <h1 className="text-responsive-2xl font-bold truncate">{headerContent.title}</h1>
            </div>
            <p className="text-muted-foreground mt-1 text-responsive-sm line-clamp-2">
              {headerContent.description}
            </p>
            {categorySlug && selectedCategory && (
              <div className="mt-2 text-responsive-sm text-muted-foreground">
                {selectedCategory.postCount} bài viết trong danh mục này
              </div>
            )}
          </div>
        </div>

        {/* Sort Tabs with Toggle + Date Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort buttons with toggle functionality - fixed width */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
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
                    "gap-1 sm:gap-1.5 btn-press transition-all duration-200 px-2 sm:px-3 sm:min-w-[100px]",
                    isActive && "animate-tab-slide"
                  )}
                >
                  {SORT_CONFIG[baseSort].icon}
                  <span className="text-xs">{config?.label || SORT_CONFIG[baseSort].label}</span>
                  {isActive && (
                    <ArrowUpDown className="h-3 w-3 ml-0.5 opacity-70 flex-shrink-0" />
                  )}
                </Button>
              );
            })}
          </div>

          {/* Date Range Filter */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2">
                <CalendarDays className="h-4 w-4" />
                {hasDateFilter ? (
                  <span className="text-xs">
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
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 btn-press"
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
                    className="btn-interactive"
                    onClick={() => applyDateFilter(dateRange.from, dateRange.to)}
                    disabled={!dateRange.from}
                  >
                    Áp dụng
                  </Button>
                  <Button size="sm" variant="outline" className="btn-press" onClick={clearDateFilter}>
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active date filter badge */}
          {hasDateFilter && (
            <Badge variant="secondary" className="gap-1 animate-pop-in">
              <CalendarDays className="h-3 w-3" />
              <span className="hidden sm:inline">Đang lọc theo thời gian</span>
              <span className="sm:hidden">Thời gian</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors duration-200" 
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

      {/* Scrollable Posts List */}
      <div className="flex-1 overflow-y-auto pt-3">
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
            requiredPermission={selectedCategory.viewPermission as 'MEMBER' | 'MODERATOR' | 'ADMIN'}
            type="category"
          />
        ) : isLoading ? (
          <PostListSkeleton count={5} />
        ) : data?.data && data.data.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div className="flex justify-center gap-1 sm:gap-1.5 mt-4 sm:mt-6 pb-4 flex-wrap items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-press"
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
                          className="btn-press h-8 w-8 p-0"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return <span key={pageNum} className="text-muted-foreground text-sm">...</span>;
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-press"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data.pagination.totalPages}
                >
                  <span className="hidden sm:inline mr-1">Tiếp</span> →
                </Button>
              </div>
            )}
          </>
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
