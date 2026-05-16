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
      className="md:hidden overflow-x-auto whitespace-nowrap pb-2 -mx-3 px-3 scrollbar-hide"
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
          "inline-flex items-center justify-center h-9 px-4 rounded-lg text-xs font-medium border transition-colors mr-1",
          !activeCategory
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background border-border text-foreground hover:bg-muted"
        )}
      >
        Tất cả
      </button>

      {categories.map((cat, i) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={activeCategory === cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={cn(
            "inline-flex items-center justify-center gap-1 h-9 px-4 rounded-lg text-xs font-medium border transition-colors",
            i < categories.length - 1 ? "mr-1" : "",
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
