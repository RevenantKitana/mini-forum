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
      className="flex md:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
      role="tablist"
      aria-label="Danh mục"
    >
      {/* "Tất cả" pill */}
      <button
        role="tab"
        aria-selected={!activeCategory}
        onClick={() => onSelect(null)}
        className={cn(
          "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
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
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
            activeCategory === cat.slug
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-foreground hover:bg-muted"
          )}
        >
          {cat.name}
          {cat.post_count > 0 && (
            <span className="ml-1 text-[10px] opacity-60">({cat.post_count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
