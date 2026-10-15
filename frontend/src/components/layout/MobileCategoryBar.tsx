import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

interface MobileCategoryBarProps {
  categories: Category[];
  activeCategory: string | null;
  onSelect: (slug: string | null) => void;
}

export function MobileCategoryBar({ categories, activeCategory, onSelect }: MobileCategoryBarProps) {
  return (
    <div className="md:hidden w-full relative mb-3">
      <div
        className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 pt-0.5 -mx-3 px-3 sm:-mx-4 sm:px-4 scrollbar-hide scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
        role="tablist"
        aria-label="Danh mục"
      >
        {/* "Tất cả" pill */}
        <button
          role="tab"
          aria-selected={!activeCategory}
          onClick={() => onSelect(null)}
          className={cn(
            "inline-flex items-center justify-center shrink-0 h-8 px-3.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-2xs",
            !activeCategory
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          Tất cả
        </button>

        {categories.map((cat) => {
          const isSelected = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelect(cat.slug)}
              className={cn(
                "inline-flex items-center justify-center shrink-0 gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-2xs",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span>{cat.name}</span>
              {cat.post_count > 0 && (
                <span className={cn(
                  "text-[10px] tabular-nums font-normal px-1 rounded-full",
                  isSelected
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-muted-foreground/80 bg-background/60"
                )}>
                  {cat.post_count}
                </span>
              )}
            </button>
          );
        })}
        {/* Trailing spacer for smooth scrolling padding */}
        <div className="w-3 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}
