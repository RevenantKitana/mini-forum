import { useRef, useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { X, GripVertical, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PostMedia } from '@/api/services/postService';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MediaZoneItem =
  | { kind: 'existing'; id: number; previewUrl: string }
  | { kind: 'new'; key: string; file: File; previewUrl: string };

const DRAG_TYPE = 'MEDIA_ZONE_ITEM';

// ── Draggable item ─────────────────────────────────────────────────────────────

interface DraggableItemProps {
  item: MediaZoneItem;
  index: number;
  onMove: (from: number, to: number) => void;
  onDelete: () => void;
  disabled?: boolean;
}

function DraggableItem({ item, index, onMove, onDelete, disabled }: DraggableItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    canDrag: !disabled,
  });

  const [, drop] = useDrop<{ index: number }>({
    accept: DRAG_TYPE,
    hover: (dragged) => {
      if (dragged.index !== index) {
        onMove(dragged.index, index);
        dragged.index = index;
      }
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={cn(
        'relative group rounded-md overflow-hidden border bg-muted',
        isDragging && 'opacity-40 ring-2 ring-primary',
        !disabled && 'cursor-grab active:cursor-grabbing',
      )}
      style={{ aspectRatio: '1 / 1' }}
    >
      <img
        src={item.previewUrl}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Drag handle overlay */}
      {!disabled && (
        <div className="absolute top-1 left-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Delete button */}
      {!disabled && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
          title="Xoá ảnh"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* New badge */}
      {item.kind === 'new' && (
        <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1 rounded">
          Mới
        </span>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export interface MediaUploadZoneProps {
  /** Controlled list of media items */
  items: MediaZoneItem[];
  onItemsChange: (items: MediaZoneItem[]) => void;
  /** Called when user deletes an existing (server-side) item */
  onDeleteExisting?: (id: number) => void;
  /** Max total items (existing + new) */
  maxTotal?: number;
  disabled?: boolean;
}

export function MediaUploadZone({
  items,
  onItemsChange,
  onDeleteExisting,
  maxTotal = 10,
  disabled = false,
}: MediaUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const remaining = maxTotal - items.length;

      if (remaining <= 0) {
        toast.error(`Tối đa ${maxTotal} ảnh cho mỗi bài viết`);
        return;
      }

      const validFiles = fileArray
        .filter((file) => {
          if (!allowedTypes.includes(file.type)) {
            toast.error(`"${file.name}": chỉ hỗ trợ JPG, PNG, WebP, GIF`);
            return false;
          }
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`"${file.name}": kích thước tối đa 10 MB`);
            return false;
          }
          return true;
        })
        .slice(0, remaining);

      if (validFiles.length === 0) return;

      const newItems: MediaZoneItem[] = validFiles.map((file) => ({
        kind: 'new',
        key: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      onItemsChange([...items, ...newItems]);
    },
    [items, maxTotal, onItemsChange],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteItem = (index: number) => {
    const item = items[index];
    if (item.kind === 'new') {
      URL.revokeObjectURL(item.previewUrl);
    } else {
      onDeleteExisting?.(item.id);
    }
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleMove = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onItemsChange(next);
  };

  const isFull = items.length >= maxTotal;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-3">
        {/* Drop zone / add button */}
        {!disabled && !isFull && (
          <div
            className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
            <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Kéo thả ảnh vào đây hoặc{' '}
              <span className="text-primary underline">chọn từ máy tính</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP, GIF — tối đa 10 MB/ảnh, còn {maxTotal - items.length} slot
            </p>
          </div>
        )}

        {/* Preview grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {items.map((item, index) => (
              <DraggableItem
                key={item.kind === 'existing' ? `ex-${item.id}` : item.key}
                item={item}
                index={index}
                onMove={handleMove}
                onDelete={() => handleDeleteItem(index)}
                disabled={disabled}
              />
            ))}
          </div>
        )}

        {items.length > 0 && !disabled && (
          <p className="text-xs text-muted-foreground">
            Kéo để sắp xếp lại thứ tự. Ảnh đầu tiên sẽ là ảnh đại diện bài viết.
          </p>
        )}
      </div>
    </DndProvider>
  );
}
