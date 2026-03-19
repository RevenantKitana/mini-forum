import { useFontSize, SCALE_LABELS, FontSizeScale } from '@/contexts/FontSizeContext';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/app/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Type } from 'lucide-react';

export function FontSizeSelector() {
  const { scale, setScale } = useFontSize();
  const scaleOptions: FontSizeScale[] = ['xs', 'sm', 'md', 'lg', 'xl'];

  return (
    <DropdownMenu>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 btn-press"
              title="Tùy chỉnh cỡ chữ"
            >
              <Type className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Cỡ chữ
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-semibold">Cỡ chữ</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-1">
          {scaleOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={scale === option}
              onCheckedChange={() => setScale(option)}
              className="cursor-pointer"
            >
              <span className="text-sm">{SCALE_LABELS[option]}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
