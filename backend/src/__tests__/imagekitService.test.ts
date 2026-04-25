import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoist mock factories so they are available inside vi.mock() closures
// ---------------------------------------------------------------------------
const { mockFilesUpload, mockFilesDelete, mockBuildSrc, mockToFile } = vi.hoisted(() => ({
  mockFilesUpload: vi.fn(),
  mockFilesDelete: vi.fn(),
  mockBuildSrc: vi.fn(),
  mockToFile: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock @imagekit/nodejs before the service module loads.
// Use a regular function (NOT an arrow function) as the constructor so that
// `new ImageKit(...)` works correctly in strict ESM mode.
// ---------------------------------------------------------------------------
vi.mock('@imagekit/nodejs', () => {
  // Regular named function — constructible with `new`
  function MockImageKit() {
    return {
      files: {
        upload: mockFilesUpload,
        delete: mockFilesDelete,
      },
      helper: {
        buildSrc: mockBuildSrc,
      },
    };
  }
  return {
    default: MockImageKit,
    toFile: mockToFile,
  };
});

// Mock config so we never hit the missing-env-vars guard
vi.mock('../config/index.js', () => ({
  default: {
    imagekit: {
      privateKey: 'test_private_key',
      urlEndpoint: 'https://ik.imagekit.io/testaccount',
    },
  },
}));

// Import the service *after* mocks are in place
import { uploadImage, deleteImage, getTransformedUrl } from '../services/imagekitService.js';

// ---------------------------------------------------------------------------
describe('imagekitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  describe('uploadImage', () => {
    it('calls toFile then ImageKit upload with correct arguments', async () => {
      const fakeFile = { name: 'avatar.jpg', data: Buffer.from('fake') };
      mockToFile.mockResolvedValue(fakeFile);
      mockFilesUpload.mockResolvedValue({
        fileId: 'file_abc123',
        filePath: '/avatars/avatar.jpg',
        url: 'https://ik.imagekit.io/testaccount/avatars/avatar.jpg',
      });

      const buffer = Buffer.from('fake-image');
      await uploadImage(buffer, 'avatar.jpg', '/avatars');

      expect(mockToFile).toHaveBeenCalledWith(buffer, 'avatar.jpg');
      expect(mockFilesUpload).toHaveBeenCalledWith({
        file: fakeFile,
        fileName: 'avatar.jpg',
        folder: '/avatars',
      });
    });

    it('returns fileId, filePath, and url from the SDK response', async () => {
      mockToFile.mockResolvedValue({});
      mockFilesUpload.mockResolvedValue({
        fileId: 'file_xyz789',
        filePath: '/posts/post_42.jpg',
        url: 'https://ik.imagekit.io/testaccount/posts/post_42.jpg',
        // SDK may return extra fields — should be stripped
        width: 1200,
        height: 800,
      });

      const result = await uploadImage(Buffer.from('data'), 'post_42.jpg', '/posts');

      expect(result).toEqual({
        fileId: 'file_xyz789',
        filePath: '/posts/post_42.jpg',
        url: 'https://ik.imagekit.io/testaccount/posts/post_42.jpg',
      });
    });

    it('propagates errors thrown by the ImageKit SDK', async () => {
      mockToFile.mockResolvedValue({});
      mockFilesUpload.mockRejectedValue(new Error('Upload failed: quota exceeded'));

      await expect(
        uploadImage(Buffer.from('data'), 'img.jpg', '/test'),
      ).rejects.toThrow('Upload failed: quota exceeded');
    });

    it('propagates errors thrown by toFile', async () => {
      mockToFile.mockRejectedValue(new Error('Buffer conversion error'));

      await expect(
        uploadImage(Buffer.from('data'), 'img.jpg', '/test'),
      ).rejects.toThrow('Buffer conversion error');
    });
  });

  // -------------------------------------------------------------------------
  describe('deleteImage', () => {
    it('calls ImageKit files.delete with the given fileId', async () => {
      mockFilesDelete.mockResolvedValue({});

      await deleteImage('file_abc123');

      expect(mockFilesDelete).toHaveBeenCalledOnce();
      expect(mockFilesDelete).toHaveBeenCalledWith('file_abc123');
    });

    it('propagates errors thrown by the SDK', async () => {
      mockFilesDelete.mockRejectedValue(new Error('File not found'));

      await expect(deleteImage('missing_id')).rejects.toThrow('File not found');
    });
  });

  // -------------------------------------------------------------------------
  describe('getTransformedUrl', () => {
    it('calls buildSrc with urlEndpoint, src, and preview transformation', () => {
      const expected = 'https://ik.imagekit.io/testaccount/tr:w-300,h-300/avatar.jpg';
      mockBuildSrc.mockReturnValue(expected);

      const result = getTransformedUrl('/avatars/avatar.jpg', 'preview');

      expect(result).toBe(expected);
      expect(mockBuildSrc).toHaveBeenCalledWith({
        urlEndpoint: 'https://ik.imagekit.io/testaccount',
        src: '/avatars/avatar.jpg',
        transformation: [{ width: 300, height: 300, crop: 'force', quality: 80, format: 'webp' }],
      });
    });

    it('calls buildSrc with standard transformation', () => {
      const expected = 'https://ik.imagekit.io/testaccount/tr:w-1200/post.jpg';
      mockBuildSrc.mockReturnValue(expected);

      const result = getTransformedUrl('/posts/post.jpg', 'standard');

      expect(result).toBe(expected);
      expect(mockBuildSrc).toHaveBeenCalledWith({
        urlEndpoint: 'https://ik.imagekit.io/testaccount',
        src: '/posts/post.jpg',
        transformation: [{ width: 1200, quality: 85, format: 'webp' }],
      });
    });

    it('returns whatever buildSrc returns (pure passthrough)', () => {
      mockBuildSrc.mockReturnValue('https://custom-cdn.example.com/image.webp');
      expect(getTransformedUrl('/img.jpg', 'preview')).toBe(
        'https://custom-cdn.example.com/image.webp',
      );
    });
  });
});
