import { useState, useCallback } from 'react';
import { Plus, Trash2, Type, Image, GripVertical, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/lib/utils';
import { MediaUploadZone, MediaZoneItem } from '@/components/post/MediaUploadZone';

// ── Types ──────────────────────────────────────────────────────────────────────

export type EditorTextBlock = {
  key: string;
  type: 'TEXT';
  content: string;
};

export type EditorImageBlock = {
  key: string;
  type: 'IMAGE';
  // Files to upload (tracked by MediaZoneItem)
  mediaItems: MediaZoneItem[];
  // After the post is created, blockId is populated
  blockId?: number;
};

export type EditorBlock = EditorTextBlock | EditorImageBlock;

export interface BlockEditorValue {
  blocks: EditorBlock[];
}

/**
 * Props for the BlockEditor component.
 *
 * @property value - Array of editor blocks (TEXT or IMAGE) to render.
 * @property onChange - Callback fired whenever the blocks array changes.
 * @property disabled - When true, all inputs and buttons are disabled (e.g. during submission).
 */
interface BlockEditorProps {
  value: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  disabled?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_TOTAL_CHARS = 10000;
const MAX_TOTAL_IMAGES = 10;

let keyCounter = 0;
function nextKey() {
  return `blk-${++keyCounter}-${Date.now()}`;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function totalChars(blocks: EditorBlock[]): number {
  return blocks
    .filter((b): b is EditorTextBlock => b.type === 'TEXT')
    .reduce((s, b) => s + b.content.length, 0);
}

function totalImages(blocks: EditorBlock[]): number {
  return blocks
    .filter((b): b is EditorImageBlock => b.type === 'IMAGE')
    .reduce((s, b) => s + b.mediaItems.length, 0);
}

// ── BlockEditor ────────────────────────────────────────────────────────────────

/**
 * Phase 3: Main block-based post editor.
 *
 * Manages an ordered list of TEXT and IMAGE blocks with real-time validation:
 * - No two consecutive TEXT blocks
 * - Total text ≤ 10,000 characters across all blocks
 * - Total images ≤ 10 across all IMAGE blocks
 *
 * Phase 6: Per-block char counter shows remaining budget relative to global limit.
 *
 * @example
 * ```tsx
 * <BlockEditor value={blocks} onChange={setBlocks} />
 * ```
 */
export function BlockEditor({ value: blocks, onChange, disabled }: BlockEditorProps) {
  const usedChars = totalChars(blocks);
  const usedImages = totalImages(blocks);
  const charLimitExceeded = usedChars > MAX_TOTAL_CHARS;
  const imageLimitExceeded = usedImages >= MAX_TOTAL_IMAGES;

  const lastBlock = blocks[blocks.length - 1];
  const canAddText = !lastBlock || lastBlock.type !== 'TEXT';
  const canAddImage = !imageLimitExceeded;

  const addBlock = useCallback(
    (type: 'TEXT' | 'IMAGE') => {
      const newBlock: EditorBlock =
        type === 'TEXT'
          ? { key: nextKey(), type: 'TEXT', content: '' }
          : { key: nextKey(), type: 'IMAGE', mediaItems: [] };
      onChange([...blocks, newBlock]);
    },
    [blocks, onChange],
  );

  const removeBlock = useCallback(
    (key: string) => {
      onChange(blocks.filter((b) => b.key !== key));
    },
    [blocks, onChange],
  );

  const updateTextBlock = useCallback(
    (key: string, content: string) => {
      onChange(blocks.map((b) => (b.key === key && b.type === 'TEXT' ? { ...b, content } : b)));
    },
    [blocks, onChange],
  );

  const updateImageBlock = useCallback(
    (key: string, mediaItems: MediaZoneItem[]) => {
      onChange(
        blocks.map((b) =>
          b.key === key && b.type === 'IMAGE' ? { ...b, mediaItems } : b,
        ),
      );
    },
    [blocks, onChange],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Blocks list */}
      {blocks.map((block, index) => (
        <BlockItem
          key={block.key}
          block={block}
          index={index}
          disabled={disabled}
          usedChars={usedChars}
          usedImages={usedImages}
          onRemove={removeBlock}
          onTextChange={updateTextBlock}
          onImageChange={updateImageBlock}
        />
      ))}

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 text-center text-muted-foreground text-sm">
          Thêm block đầu tiên để bắt đầu soạn thảo
        </div>
      )}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canAddText || disabled}
          onClick={() => addBlock('TEXT')}
          className="gap-1.5"
          title={!canAddText ? 'Không thể thêm 2 block văn bản liên tiếp' : undefined}
        >
          <Type className="h-4 w-4" />
          Thêm block văn bản
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canAddImage || disabled}
          onClick={() => addBlock('IMAGE')}
          className="gap-1.5"
          title={imageLimitExceeded ? `Đã đạt giới hạn ${MAX_TOTAL_IMAGES} ảnh` : undefined}
        >
          <Image className="h-4 w-4" />
          Thêm block hình ảnh
        </Button>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className={cn(charLimitExceeded && 'text-destructive font-medium')}>
          Văn bản: {usedChars.toLocaleString()} / {MAX_TOTAL_CHARS.toLocaleString()} ký tự
        </span>
        <span className={cn(imageLimitExceeded && 'text-destructive font-medium')}>
          Ảnh: {usedImages} / {MAX_TOTAL_IMAGES}
        </span>
      </div>

      {charLimitExceeded && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          Đã vượt quá giới hạn ký tự văn bản
        </p>
      )}
    </div>
  );
}

// ── BlockItem ──────────────────────────────────────────────────────────────────

interface BlockItemProps {
  block: EditorBlock;
  index: number;
  disabled?: boolean;
  usedChars: number;
  usedImages: number;
  onRemove: (key: string) => void;
  onTextChange: (key: string, content: string) => void;
  onImageChange: (key: string, items: MediaZoneItem[]) => void;
}

function BlockItem({
  block,
  index,
  disabled,
  usedChars,
  onRemove,
  onTextChange,
  onImageChange,
}: BlockItemProps) {
  return (
    <div className="group relative rounded-lg border bg-card p-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 gap-0.5 shrink-0">
          {block.type === 'TEXT' ? (
            <>
              <Type className="h-2.5 w-2.5" />
              Văn bản
            </>
          ) : (
            <>
              <Image className="h-2.5 w-2.5" />
              Hình ảnh
            </>
          )}
        </Badge>
        <span className="text-xs text-muted-foreground">Block {index + 1}</span>
        <div className="ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(block.key)}
            disabled={disabled}
            title="Xoá block"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Block content */}
      {block.type === 'TEXT' && (
        <TextBlockInput
          content={block.content}
          globalUsedChars={usedChars}
          onChange={(c) => onTextChange(block.key, c)}
          disabled={disabled}
        />
      )}
      {block.type === 'IMAGE' && (
        <ImageBlockInput
          items={block.mediaItems}
          onChange={(items) => onImageChange(block.key, items)}
          disabled={disabled}
        />
      )}
    </div>
  );
}

// ── TextBlockInput ─────────────────────────────────────────────────────────────

interface TextBlockInputProps {
  content: string;
  /** Total chars used across ALL text blocks (for global budget indicator) */
  globalUsedChars: number;
  onChange: (content: string) => void;
  disabled?: boolean;
}

function TextBlockInput({ content, globalUsedChars, onChange, disabled }: TextBlockInputProps) {
  const globalExceeded = globalUsedChars > MAX_TOTAL_CHARS;
  const remaining = MAX_TOTAL_CHARS - (globalUsedChars - content.length);
  const thisBlockExceeded = content.length > remaining;

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập nội dung văn bản (markdown được hỗ trợ)..."
        className={cn(
          'min-h-[120px] resize-y text-sm font-normal',
          (globalExceeded || thisBlockExceeded) && 'border-destructive focus-visible:ring-destructive',
        )}
        disabled={disabled}
      />
      <div className={cn('flex justify-between text-xs', globalExceeded ? 'text-destructive' : 'text-muted-foreground')}>
        <span>
          {thisBlockExceeded && <span className="text-destructive">Vượt giới hạn block này · </span>}
          Còn lại: {Math.max(0, remaining).toLocaleString()} ký tự
        </span>
        <span className={cn(thisBlockExceeded && 'text-destructive font-medium')}>
          {content.length.toLocaleString()} ký tự
        </span>
      </div>
    </div>
  );
}

// ── ImageBlockInput ────────────────────────────────────────────────────────────

interface ImageBlockInputProps {
  items: MediaZoneItem[];
  onChange: (items: MediaZoneItem[]) => void;
  disabled?: boolean;
}

function ImageBlockInput({ items, onChange, disabled }: ImageBlockInputProps) {
  return (
    <div>
      <MediaUploadZone
        items={items}
        onItemsChange={onChange}
        maxTotal={MAX_TOTAL_IMAGES}
        disabled={disabled}
      />
      {items.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {items.length} ảnh — cuộn ngang khi hiển thị
        </p>
      )}
    </div>
  );
}
