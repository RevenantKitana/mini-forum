import { useTheme, THEME_LABELS, type ThemeName } from '@/contexts/ThemeContext';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/app/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { Palette, Moon, Sun } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme, isDark } = useTheme();

  // Group themes by category
  const themes: { group: string; items: ThemeName[] }[] = [
    {
      group: 'Mặc định',
      items: ['light', 'dark'],
    },
    {
      group: 'Accessibility',
      items: ['high-contrast', 'high-contrast-dark'],
    },
    {
      group: 'Ấm Áp',
      items: ['warm', 'warm-dark'],
    },
    {
      group: 'Tự Nhiên',
      items: ['forest', 'forest-dark'],
    },
    {
      group: 'Biển',
      items: ['ocean', 'ocean-dark'],
    },
    {
      group: 'Sáng Tạo',
      items: ['purple', 'purple-dark'],
    },
  ];

  const currentThemeLabel = THEME_LABELS[theme];

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative w-10 h-10"
              aria-label="Chọn chủ đề"
            >
              {isDark ? (
                <Moon className="h-5 w-5 transition-all" />
              ) : (
                <Sun className="h-5 w-5 transition-all" />
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          Chủ đề: {currentThemeLabel}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Chọn Chủ Đề
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {themes.map(({ group, items }) => (
          <div key={group}>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group}
            </div>
            {items.map((themeName) => (
              <DropdownMenuItem
                key={themeName}
                onClick={() => setTheme(themeName)}
                className={`flex items-center gap-2 cursor-pointer ${
                  theme === themeName
                    ? 'bg-secondary text-secondary-foreground'
                    : ''
                }`}
              >
                <div className="flex-1">
                  <span className="text-sm">{THEME_LABELS[themeName]}</span>
                </div>
                {theme === themeName && (
                  <div className="h-2 w-2 rounded-full bg-current" />
                )}
              </DropdownMenuItem>
            ))}
            {group !== 'Sáng Tạo' && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
