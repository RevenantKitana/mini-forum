import { SendHorizontal } from 'lucide-react';

interface CategoryColorIconProps {
  /**
   * Hex color code for the category
   */
  color: string;
  /**
   * Category name for tooltip and aria-label
   */
  name: string;
}

/**
 * Category color indicator icon
 * Display a SendHorizontal icon filled with the category color
 * Used on post cards to visually represent the category
 */
export function CategoryColorIcon({ color, name }: CategoryColorIconProps) {
  return (
    <SendHorizontal
      className="flex-shrink-0 h-6 w-6 transition-transform group-hover:scale-125"
      style={{ color }}
      title={name}
      aria-label={`Category: ${name}`}
      stroke="none"
      fill={color}
    />
  );
}
