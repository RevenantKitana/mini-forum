import ImageKit, { toFile } from '@imagekit/nodejs';
import config from '../config/index.js';

const imagekit = new ImageKit({
  privateKey: config.imagekit.privateKey,
});

export interface UploadResult {
  fileId: string;
  filePath: string;
  url: string;
}

type TransformationPreset = 'preview' | 'standard';

// Transformation presets as per spec:
//   preview  → crop center 300×300, webp, quality 80
//   standard → max-width 1200, webp, quality 85
const TRANSFORMATION_PRESETS: Record<
  TransformationPreset,
  Array<Record<string, string | number>>
> = {
  preview: [{ width: 300, height: 300, crop: 'force', quality: 80, format: 'webp' }],
  standard: [{ width: 1200, quality: 85, format: 'webp' }],
};

/**
 * Upload a file buffer to ImageKit.
 * @param buffer  Raw file bytes from multer memoryStorage
 * @param fileName  Desired file name (without transformation suffix)
 * @param folder  Target folder path in ImageKit (e.g. '/avatars')
 */
export async function uploadImage(
  buffer: Buffer,
  fileName: string,
  folder: string,
): Promise<UploadResult> {
  const file = await toFile(buffer, fileName);
  const response = await imagekit.files.upload({
    file,
    fileName,
    folder,
  });

  return {
    fileId: response.fileId as string,
    filePath: response.filePath as string,
    url: response.url as string,
  };
}

/**
 * Delete a file from ImageKit by its fileId.
 * Does not throw if the file is already missing.
 */
export async function deleteImage(fileId: string): Promise<void> {
  await imagekit.files.delete(fileId);
}

/**
 * Build a CDN URL with a named transformation preset applied.
 * @param filePath  The relative file path in ImageKit (e.g. '/avatars/abc.jpg')
 * @param preset    'preview' | 'standard'
 */
export function getTransformedUrl(
  filePath: string,
  preset: TransformationPreset,
): string {
  return imagekit.helper.buildSrc({
    urlEndpoint: config.imagekit.urlEndpoint,
    src: filePath,
    transformation: TRANSFORMATION_PRESETS[preset],
  });
}
