/**
 * Tests for MediaUploadZone (Phase 6 — UC-02, UC-03)
 *
 * We test the component logic without testing actual DnD interactions
 * (react-dnd drag events are complex to simulate in jsdom).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MediaUploadZone, MediaZoneItem } from '@/components/post/MediaUploadZone';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('react-dnd', () => ({
  DndProvider: ({ children }: any) => <>{children}</>,
  useDrag: () => [{ isDragging: false }, vi.fn(), vi.fn()],
  useDrop: () => [{ isOver: false }, vi.fn()],
}));

vi.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Mock URL.createObjectURL / URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:fake-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeExistingItem(id: number): MediaZoneItem {
  return { kind: 'existing', id, previewUrl: `https://ik.imagekit.io/test/img${id}.jpg` };
}

function makeNewItem(name: string): MediaZoneItem {
  return {
    kind: 'new',
    key: name,
    file: new File(['data'], name, { type: 'image/jpeg' }),
    previewUrl: `blob:fake-url-${name}`,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('MediaUploadZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders drop zone when items list is empty', () => {
    render(
      <MediaUploadZone
        items={[]}
        onItemsChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Kéo thả ảnh vào đây/)).toBeInTheDocument();
  });

  it('hides drop zone when maxTotal is reached', () => {
    const items: MediaZoneItem[] = Array.from({ length: 10 }, (_, i) => makeExistingItem(i + 1));
    render(
      <MediaUploadZone
        items={items}
        onItemsChange={vi.fn()}
        maxTotal={10}
      />,
    );
    expect(screen.queryByText(/Kéo thả ảnh vào đây/)).not.toBeInTheDocument();
  });

  it('renders preview images for each item', () => {
    const items = [makeExistingItem(1), makeExistingItem(2), makeNewItem('photo.jpg')];
    render(
      <MediaUploadZone
        items={items}
        onItemsChange={vi.fn()}
      />,
    );
    const images = document.querySelectorAll('img');
    expect(images.length).toBe(3);
  });

  it('shows "Mới" badge on new items', () => {
    const items = [makeNewItem('new.jpg')];
    render(
      <MediaUploadZone
        items={items}
        onItemsChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Mới')).toBeInTheDocument();
  });

  it('does not show "Mới" badge on existing items', () => {
    const items = [makeExistingItem(1)];
    render(
      <MediaUploadZone
        items={items}
        onItemsChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('Mới')).not.toBeInTheDocument();
  });

  it('calls onDeleteExisting when deleting an existing item', async () => {
    const onDeleteExisting = vi.fn();
    const onItemsChange = vi.fn();
    const items = [makeExistingItem(42)];
    render(
      <MediaUploadZone
        items={items}
        onItemsChange={onItemsChange}
        onDeleteExisting={onDeleteExisting}
      />,
    );
    const deleteBtn = document.querySelector('button[title="Xoá ảnh"]') as HTMLButtonElement;
    fireEvent.click(deleteBtn);
    expect(onDeleteExisting).toHaveBeenCalledWith(42);
    expect(onItemsChange).toHaveBeenCalledWith([]);
  });

  it('revokes object URL when deleting a new item', async () => {
    const onItemsChange = vi.fn();
    const newItem = makeNewItem('test.jpg');
    const items = [newItem];
    render(
      <MediaUploadZone
        items={items}
        onItemsChange={onItemsChange}
      />,
    );
    const deleteBtn = document.querySelector('button[title="Xoá ảnh"]') as HTMLButtonElement;
    fireEvent.click(deleteBtn);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith(newItem.previewUrl);
    expect(onItemsChange).toHaveBeenCalledWith([]);
  });

  it('rejects files larger than 10 MB', async () => {
    const { toast } = await import('sonner');
    render(<MediaUploadZone items={[]} onItemsChange={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(input, 'files', { value: [bigFile], writable: false });
    fireEvent.change(input);

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('tối đa 10 MB'));
  });

  it('rejects unsupported MIME types', async () => {
    const { toast } = await import('sonner');
    render(<MediaUploadZone items={[]} onItemsChange={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const txtFile = new File(['text'], 'notes.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [txtFile], writable: false });
    fireEvent.change(input);

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('JPG, PNG, WebP, GIF'));
  });

  it('caps added files at maxTotal', async () => {
    const onItemsChange = vi.fn();
    const existingItems = [makeExistingItem(1), makeExistingItem(2)]; // 2 existing
    render(
      <MediaUploadZone
        items={existingItems}
        onItemsChange={onItemsChange}
        maxTotal={3} // 1 slot remaining
      />,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const files = [
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
    ];
    Object.defineProperty(input, 'files', { value: files, writable: false });
    fireEvent.change(input);

    // Only 1 of the 2 files should be added (remaining = 1)
    await waitFor(() => {
      const called = onItemsChange.mock.calls[0]?.[0] as MediaZoneItem[];
      expect(called.length).toBe(3); // 2 existing + 1 new
    });
  });

  it('does not render interactive elements when disabled', () => {
    render(
      <MediaUploadZone
        items={[makeExistingItem(1)]}
        onItemsChange={vi.fn()}
        disabled
      />,
    );
    expect(screen.queryByText(/Kéo thả ảnh/)).not.toBeInTheDocument();
    expect(document.querySelector('button[title="Xoá ảnh"]')).not.toBeInTheDocument();
  });

  it('shows remaining slot count in drop zone hint', () => {
    const items = [makeExistingItem(1), makeExistingItem(2)];
    render(
      <MediaUploadZone
        items={items}
        onItemsChange={vi.fn()}
        maxTotal={10}
      />,
    );
    expect(screen.getByText(/còn 8 slot/)).toBeInTheDocument();
  });

  it('accepts valid image files and calls onItemsChange', async () => {
    const onItemsChange = vi.fn();
    render(<MediaUploadZone items={[]} onItemsChange={onItemsChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file], writable: false });
    fireEvent.change(input);

    await waitFor(() => {
      expect(onItemsChange).toHaveBeenCalled();
      const result = onItemsChange.mock.calls[0][0] as MediaZoneItem[];
      expect(result.length).toBe(1);
      expect(result[0].kind).toBe('new');
    });
  });
});
