import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostMedia } from '@/api/services/postService';
import {
  Dialog,
  DialogContent,
} from '@/app/components/ui/dialog';

interface ImageBlockScrollerProps {
  images: PostMedia[];
  className?: string;
}

/**
 * Phase 4: Horizontal image scroller for image blocks.
 * Images are laid out in a flex row with overflow-x-auto.
 * Click an image to open it in a lightbox.
 */
export function ImageBlockScroller({ images, className }: ImageBlockScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const isSingleImage = images.length === 1;

  const scrollBy = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' });
  };

  const prev = () => setLightboxIndex((i) => (i !== null ? Math.max(0, i - 1) : null));
  const next = () => setLightboxIndex((i) => (i !== null ? Math.min(images.length - 1, i + 1) : null));

  return (
    <div className={cn('relative group/scroller', className)}>
      {/* Scroll buttons */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollBy('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover/scroller:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover/scroller:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={cn(
          'flex gap-2 scroll-smooth pb-1 w-full',
          isSingleImage
            ? 'justify-center'
            : 'overflow-x-auto image-block-scroller',
        )}
        style={isSingleImage ? undefined : { scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground)/0.3) transparent' }}
      >
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setLightboxIndex(idx)}
            className={cn(
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSingleImage
                ? 'rounded-md overflow-hidden border border-border/50 hover:border-primary/50 transition-colors bg-muted'
                : 'flex-shrink-0',
            )}
          >
            <img
              src={img.standard_url}
              alt=""
              loading="lazy"
              className={
                isSingleImage
                  ? 'block max-h-[500px] h-auto w-auto'
                  : 'block h-[250px] sm:h-[300px] lg:h-[400px] w-auto rounded-md border border-border/50 hover:border-primary/50 transition-colors bg-muted'
              }
              draggable={false}
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-5xl w-screen p-2 flex flex-col items-center bg-black/90 border-none gap-2">
          {lightboxIndex !== null && (
            <>
              <img
                src={images[lightboxIndex].standard_url}
                alt=""
                className="max-h-[80vh] max-w-full object-contain rounded-md"
              />
              {images.length > 1 && (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={prev}
                    disabled={lightboxIndex === 0}
                    className="text-white disabled:opacity-30 hover:text-primary transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <span className="text-white/70 text-sm">
                    {lightboxIndex + 1} / {images.length}
                  </span>
                  <button
                    type="button"
                    onClick={next}
                    disabled={lightboxIndex === images.length - 1}
                    className="text-white disabled:opacity-30 hover:text-primary transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
