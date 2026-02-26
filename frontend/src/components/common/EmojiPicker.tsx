import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Input } from '@/app/components/ui/input';
import { Smile, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Emoji categories with common emojis
const emojiCategories = {
  smileys: {
    label: '😀',
    title: 'Biểu cảm',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐']
  },
  gestures: {
    label: '👍',
    title: 'Cử chỉ',
    emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄']
  },
  hearts: {
    label: '❤️',
    title: 'Trái tim',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💋', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤']
  },
  animals: {
    label: '🐶',
    title: 'Động vật',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑']
  },
  food: {
    label: '🍔',
    title: 'Đồ ăn',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🍝']
  },
  activities: {
    label: '⚽',
    title: 'Hoạt động',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪']
  },
  objects: {
    label: '💡',
    title: 'Đồ vật',
    emojis: ['💡', '🔦', '🏮', '🪔', '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱']
  },
  symbols: {
    label: '✅',
    title: 'Biểu tượng',
    emojis: ['✅', '❌', '❓', '❔', '❗', '❕', '⭕', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '💠', '🔘', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝']
  }
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  triggerClassName?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export function EmojiPicker({ 
  onEmojiSelect, 
  className,
  triggerClassName,
  side = 'top',
  align = 'start'
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent emojis from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentEmojis');
    if (saved) {
      try {
        setRecentEmojis(JSON.parse(saved).slice(0, 20));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save recent emojis to localStorage
  const saveRecentEmoji = (emoji: string) => {
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(updated);
    localStorage.setItem('recentEmojis', JSON.stringify(updated));
  };

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    saveRecentEmoji(emoji);
    setOpen(false);
  };

  // Filter emojis based on search (simple matching)
  const getFilteredEmojis = () => {
    if (!searchQuery.trim()) return null;
    
    const query = searchQuery.toLowerCase();
    const results: string[] = [];
    
    Object.values(emojiCategories).forEach(category => {
      category.emojis.forEach(emoji => {
        if (emoji.includes(query) || results.length < 50) {
          results.push(emoji);
        }
      });
    });
    
    return results.slice(0, 50);
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-8 w-8 p-0', triggerClassName)}
          title="Chèn emoji"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        align={align}
        className={cn('w-80 p-0', className)}
      >
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Tìm emoji..."
              className="pl-8 h-8"
            />
          </div>
        </div>

        {filteredEmojis ? (
          <ScrollArea className="h-[200px] p-2">
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {filteredEmojis.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Không tìm thấy emoji
              </div>
            )}
          </ScrollArea>
        ) : (
          <Tabs defaultValue={recentEmojis.length > 0 ? 'recent' : 'smileys'} className="w-full">
            <TabsList className="w-full h-9 p-1 grid grid-cols-9 gap-0">
              {recentEmojis.length > 0 && (
                <TabsTrigger value="recent" className="text-sm px-1">🕐</TabsTrigger>
              )}
              {Object.entries(emojiCategories).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="text-sm px-1" title={category.title}>
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {recentEmojis.length > 0 && (
              <TabsContent value="recent" className="mt-0">
                <ScrollArea className="h-[200px] p-2">
                  <div className="grid grid-cols-8 gap-1">
                    {recentEmojis.map((emoji, index) => (
                      <button
                        key={`recent-${emoji}-${index}`}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        className="h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {Object.entries(emojiCategories).map(([key, category]) => (
              <TabsContent key={key} value={key} className="mt-0">
                <ScrollArea className="h-[200px] p-2">
                  <div className="grid grid-cols-8 gap-1">
                    {category.emojis.map((emoji, index) => (
                      <button
                        key={`${key}-${emoji}-${index}`}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        className="h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default EmojiPicker;
