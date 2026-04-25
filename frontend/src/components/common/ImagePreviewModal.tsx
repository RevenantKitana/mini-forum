import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getPostMediaUrl } from '@/utils/imageHelpers';

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{ id: number; preview_url: string; standard_url: string }>;
  postTitle?: string;
}

/**
 * ImagePreviewModal - Display image previews in a modal/lightbox
 * Phase 1 UC-01: Mobile click handler for newsfeed image display
 * Features:
 * - Show first 3-5 images from post media
 * - Navigate between images (mobile swipe or arrow buttons)
 * - Close on outside click or ESC key
 */
export function ImagePreviewModal({
  isOpen,
  onClose,
  images,
  postTitle = 'Post Images',
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  // Limit to first 3 images for preview (UC-01)
  const previewImages = images.slice(0, 3);
  const currentImage = previewImages[currentIndex];
  const imageUrl = getPostMediaUrl(currentImage, 'standard');

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? previewImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === previewImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-black/90 border-0 rounded-lg overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{postTitle}</DialogTitle>
        </DialogHeader>

        {/* Main Image Container - natural aspect ratio, constrained to viewport */}
        <div className="relative w-full bg-black flex items-center justify-center min-h-[180px] p-2">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${postTitle} - image ${currentIndex + 1}`}
              className="max-h-[70vh] max-w-full w-auto h-auto object-contain rounded"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-400">Loading image...</span>
            </div>
          )}

          {/* Close Button (top-right) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          {/* Navigation Arrows - Only show if more than 1 image */}
          {previewImages.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Image Counter & Thumbnails */}
        {previewImages.length > 1 && (
          <div className="bg-black/50 p-4 space-y-3">
            {/* Counter */}
            <div className="text-center text-white text-sm">
              {currentIndex + 1} / {previewImages.length}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {previewImages.map((img, idx) => {
                const thumbUrl = getPostMediaUrl(img, 'preview');
                return (
                  <button
                    key={img.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                      idx === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {thumbUrl && (
                      <img
                        src={thumbUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="h-12 w-auto max-w-[80px] object-contain"
                        loading="lazy"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
