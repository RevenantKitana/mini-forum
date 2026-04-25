/**
 * Tests for AvatarCropDialog (Phase 5 — UC-01)
 *
 * We test the component in isolation using mocked dependencies.
 * Canvas API operations and FileReader are mocked for jsdom compatibility.
 * Radix UI Dialog portals are mocked to avoid jsdom appendChild errors.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ── Mock Radix UI Dialog (uses portals unsupported in jsdom) ───────────────────
// Render null when closed so queryByText / queryByTestId works correctly.

vi.mock('@/app/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog-portal">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/app/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarImage: ({ src, alt }: any) => src ? <img src={src} alt={alt} /> : null,
  AvatarFallback: ({ children }: any) => (
    <span data-testid="avatar-fallback">{children}</span>
  ),
}));

vi.mock('@/app/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type ?? 'button'}>
      {children}
    </button>
  ),
}));

// ── Mock react-image-crop ──────────────────────────────────────────────────────

vi.mock('react-image-crop', () => ({
  default: ({ children }: any) => <div data-testid="react-crop">{children}</div>,
  centerCrop: (crop: any) => crop,
  makeAspectCrop: (crop: any) => crop,
}));

vi.mock('react-image-crop/dist/ReactCrop.css', () => ({}));

// ── Mock hooks ─────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useUsers', () => ({
  useUpdateAvatar: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'testuser',
      display_name: 'Test User',
      avatar_preview_url: null,
      avatar_standard_url: null,
    },
    refreshUser: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// ── Import component after mocks ───────────────────────────────────────────────

import { AvatarCropDialog } from '@/components/profile/AvatarCropDialog';

// ── Canvas mock ────────────────────────────────────────────────────────────────

const origCreateElement = document.createElement.bind(document);
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(document, 'createElement').mockImplementation(function (tag: string, ...rest: any[]) {
    if (tag === 'canvas') {
      const canvas = origCreateElement('canvas');
      Object.assign(canvas, {
        getContext: vi.fn(() => ({ drawImage: vi.fn() })),
        toBlob: vi.fn(function (cb: BlobCallback) {
          cb(new Blob(['fake'], { type: 'image/webp' }));
        }),
      });
      return canvas;
    }
    return origCreateElement(tag, ...rest);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── FileReader class mock helper ───────────────────────────────────────────────

class FakeFileReader {
  result: string | null = null;
  onload: ((e: any) => void) | null = null;

  readAsDataURL(_file: Blob) {
    const self = this;
    Promise.resolve().then(() => {
      self.result = 'data:image/jpeg;base64,fakecontent';
      self.onload?.({ target: self });
    });
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('AvatarCropDialog', () => {
  it('renders the upload trigger button', () => {
    render(<AvatarCropDialog />);
    expect(screen.getByText('Chọn ảnh từ máy tính')).toBeInTheDocument();
  });

  it('renders avatar fallback "T" for display name "Test User"', () => {
    render(<AvatarCropDialog />);
    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('T');
  });

  it('renders a hidden file input that accepts jpeg/png/webp', () => {
    render(<AvatarCropDialog />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.accept).toBe('image/jpeg,image/png,image/webp');
    expect(input.className).toContain('hidden');
  });

  it('crop dialog is initially closed', () => {
    render(<AvatarCropDialog />);
    expect(screen.queryByTestId('dialog-portal')).not.toBeInTheDocument();
  });

  it('opens the crop dialog when a valid image file is selected', async () => {
    const originalFileReader = global.FileReader;
    global.FileReader = FakeFileReader as any;

    render(<AvatarCropDialog />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(input, 'files', { value: [file], writable: false });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByTestId('dialog-portal')).toBeInTheDocument();
      expect(screen.getByText('Cắt ảnh đại diện')).toBeInTheDocument();
    });

    global.FileReader = originalFileReader;
  });

  it('rejects files larger than 5 MB and does not open dialog', async () => {
    const { toast } = await import('sonner');
    render(<AvatarCropDialog />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const buf = new Uint8Array(6 * 1024 * 1024);
    const largeFile = new File([buf], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(input, 'files', { value: [largeFile], writable: false });
    fireEvent.change(input);

    expect(toast.error).toHaveBeenCalledWith('Kích thước file tối đa 5 MB');
    expect(screen.queryByTestId('dialog-portal')).not.toBeInTheDocument();
  });

  it('rejects unsupported file types (e.g. GIF) and does not open dialog', async () => {
    const { toast } = await import('sonner');
    render(<AvatarCropDialog />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const gifFile = new File(['gif'], 'anim.gif', { type: 'image/gif' });
    Object.defineProperty(input, 'files', { value: [gifFile], writable: false });
    fireEvent.change(input);

    expect(toast.error).toHaveBeenCalledWith('Chỉ hỗ trợ JPG, PNG, WebP');
    expect(screen.queryByTestId('dialog-portal')).not.toBeInTheDocument();
  });
});
