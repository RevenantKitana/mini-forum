import { describe, it, expect } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { uploadSingle, uploadMultiple } from '../middlewares/uploadMiddleware.js';

// ---------------------------------------------------------------------------
// Minimal Express app used for all middleware tests
// ---------------------------------------------------------------------------
function buildApp(middleware: ReturnType<typeof uploadMultiple> | typeof uploadSingle) {
  const app = express();
  app.post('/upload', middleware, (req: Request, res: Response) => {
    res.json({ ok: true, file: (req as any).file ?? null, files: (req as any).files ?? null });
  });
  return app;
}

// ---------------------------------------------------------------------------
// Helpers to build multipart bodies
// ---------------------------------------------------------------------------
const VALID_TYPES: Array<[string, string, string]> = [
  ['image/jpeg', 'photo.jpg', '\xFF\xD8\xFF'],
  ['image/png', 'image.png', '\x89PNG'],
  ['image/webp', 'image.webp', 'RIFF'],
  ['image/gif', 'anim.gif', 'GIF89a'],
];

describe('uploadMiddleware', () => {
  // -------------------------------------------------------------------------
  // uploadSingle — exports & basic wiring
  // -------------------------------------------------------------------------
  describe('uploadSingle', () => {
    it('is a middleware function (RequestHandler)', () => {
      expect(typeof uploadSingle).toBe('function');
    });

    it('accepts a valid jpeg upload and attaches req.file', async () => {
      const app = buildApp(uploadSingle);
      const res = await request(app)
        .post('/upload')
        .attach('file', Buffer.from('fake-jpeg'), { filename: 'avatar.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(200);
      expect(res.body.file).not.toBeNull();
      expect(res.body.file.originalname).toBe('avatar.jpg');
    });

    it('rejects files with unsupported MIME type (text/plain)', async () => {
      const app = buildApp(uploadSingle);
      const res = await request(app)
        .post('/upload')
        .attach('file', Buffer.from('not an image'), { filename: 'doc.txt', contentType: 'text/plain' });

      // multer calls next(err) which Express converts to a 500 by default
      expect(res.status).toBe(500);
    });

    it('rejects files with unsupported MIME type (application/pdf)', async () => {
      const app = buildApp(uploadSingle);
      const res = await request(app)
        .post('/upload')
        .attach('file', Buffer.from('%PDF-1.4'), { filename: 'doc.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(500);
    });
  });

  // -------------------------------------------------------------------------
  // uploadMultiple — exports & basic wiring
  // -------------------------------------------------------------------------
  describe('uploadMultiple', () => {
    it('returns a middleware function (RequestHandler)', () => {
      expect(typeof uploadMultiple()).toBe('function');
      expect(typeof uploadMultiple(5)).toBe('function');
    });

    it('accepts multiple valid image uploads', async () => {
      const app = buildApp(uploadMultiple(3));
      const res = await request(app)
        .post('/upload')
        .attach('files', Buffer.from('img1'), { filename: 'a.jpg', contentType: 'image/jpeg' })
        .attach('files', Buffer.from('img2'), { filename: 'b.png', contentType: 'image/png' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body.files).toHaveLength(2);
    });

    it('rejects any file with an unsupported MIME type in a batch', async () => {
      const app = buildApp(uploadMultiple(3));
      const res = await request(app)
        .post('/upload')
        .attach('files', Buffer.from('img1'), { filename: 'a.jpg', contentType: 'image/jpeg' })
        .attach('files', Buffer.from('bad'), { filename: 'virus.exe', contentType: 'application/octet-stream' });

      expect(res.status).toBe(500);
    });

    it('enforces maxCount — returns 500 when too many files are sent', async () => {
      const app = buildApp(uploadMultiple(2));
      const res = await request(app)
        .post('/upload')
        .attach('files', Buffer.from('a'), { filename: '1.jpg', contentType: 'image/jpeg' })
        .attach('files', Buffer.from('b'), { filename: '2.jpg', contentType: 'image/jpeg' })
        .attach('files', Buffer.from('c'), { filename: '3.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(500);
    });
  });

  // -------------------------------------------------------------------------
  // Accepted MIME types (parametric)
  // -------------------------------------------------------------------------
  describe('accepted MIME types for uploadSingle', () => {
    it.each(VALID_TYPES)(
      'accepts %s (%s)',
      async (mime, filename) => {
        const app = buildApp(uploadSingle);
        const res = await request(app)
          .post('/upload')
          .attach('file', Buffer.from('data'), { filename, contentType: mime });

        expect(res.status).toBe(200);
        expect(res.body.file).not.toBeNull();
      },
    );
  });
});
