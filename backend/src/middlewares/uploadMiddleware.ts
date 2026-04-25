import multer from 'multer';
import { RequestHandler } from 'express';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const MB = 1024 * 1024;
const AVATAR_SIZE_LIMIT = 5 * MB;   // 5 MB per avatar upload
const MEDIA_SIZE_LIMIT = 10 * MB;   // 10 MB per post-media file

function buildStorage() {
  return multer.memoryStorage();
}

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
}

/** Single-file upload middleware for avatar uploads (max 5 MB). */
export const uploadSingle: RequestHandler = multer({
  storage: buildStorage(),
  limits: { fileSize: AVATAR_SIZE_LIMIT },
  fileFilter,
}).single('file');

/**
 * Multi-file upload middleware for post-media uploads (max 10 MB per file).
 * @param maxCount  Maximum number of files per request (default 10).
 */
export function uploadMultiple(maxCount = 10): RequestHandler {
  return multer({
    storage: buildStorage(),
    limits: { fileSize: MEDIA_SIZE_LIMIT },
    fileFilter,
  }).array('files', maxCount);
}
