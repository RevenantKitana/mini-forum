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
    <div
      className="flex md:hidden gap-1 md:gap-2 overflow-x-auto pb-2 -mx-3 md:-mx-4 px-3 md:px-4 scrollbar-hide"
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
          "flex-shrink-0 min-w-fit px-4 py-2 rounded-full text-xs font-medium border transition-colors min-h-[44px] flex items-center justify-center",
          !activeCategory
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background border-border text-foreground hover:bg-muted"
        )}
      >
        Tất cả
      </button>

      {categories.map(cat => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={activeCategory === cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={cn(
            "flex-shrink-0 min-w-fit px-4 py-2 rounded-full text-xs font-medium border transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center gap-1",
            activeCategory === cat.slug
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-foreground hover:bg-muted"
          )}
        >
          <span>{cat.name}</span>
          {cat.post_count > 0 && (
            <span className="text-[10px] opacity-60">({cat.post_count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
