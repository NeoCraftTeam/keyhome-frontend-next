import imageCompression from 'browser-image-compression';

/**
 * Compression presets for different image use cases.
 *
 * Ad photos  — standard property photos, max 1920px wide, ~200KB target
 * Tour scenes — 360° panoramic images, preserve resolution for quality viewing
 */

/** Options for regular ad listing photos */
const AD_PHOTO_OPTIONS: Parameters<typeof imageCompression>[1] = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp',
  initialQuality: 0.82,
};

/** Options for 360° tour scene images — preserve more detail */
const TOUR_SCENE_OPTIONS: Parameters<typeof imageCompression>[1] = {
  maxSizeMB: 3,
  maxWidthOrHeight: 4096,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.85,
};

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
}

/**
 * Compress a single image file for ad photo upload.
 */
export async function compressAdPhoto(file: File): Promise<CompressionResult> {
  return compressImage(file, AD_PHOTO_OPTIONS);
}

/**
 * Compress a single image file for 360° tour scene upload.
 */
export async function compressTourScene(
  file: File
): Promise<CompressionResult> {
  return compressImage(file, TOUR_SCENE_OPTIONS);
}

/**
 * Compress multiple ad photos in parallel.
 */
export async function compressAdPhotos(
  files: File[],
  onProgress?: (index: number, result: CompressionResult) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  // Process in batches of 3 to avoid memory pressure
  const batchSize = 3;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (file, batchIndex) => {
        const result = await compressAdPhoto(file);
        onProgress?.(i + batchIndex, result);
        return result;
      })
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Compress multiple tour scene images in parallel.
 */
export async function compressTourScenes(
  files: File[],
  onProgress?: (index: number, result: CompressionResult) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  // Tour scenes are large — process 2 at a time
  const batchSize = 2;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (file, batchIndex) => {
        const result = await compressTourScene(file);
        onProgress?.(i + batchIndex, result);
        return result;
      })
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Internal: compress a single file with given options.
 * Skips compression if the file is already smaller than target.
 */
async function compressImage(
  file: File,
  options: Parameters<typeof imageCompression>[1]
): Promise<CompressionResult> {
  const originalSize = file.size;
  const targetBytes = (options.maxSizeMB ?? 1) * 1024 * 1024;

  // Skip compression if already under target size
  if (originalSize <= targetBytes) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
    };
  }

  try {
    const compressed = await imageCompression(file, options);

    // Keep original if compression made it larger
    const useCompressed = compressed.size < originalSize;
    const finalFile = useCompressed
      ? new File([compressed], file.name, { type: compressed.type })
      : file;

    return {
      file: finalFile,
      originalSize,
      compressedSize: finalFile.size,
      savedPercent: useCompressed
        ? Math.round((1 - compressed.size / originalSize) * 100)
        : 0,
    };
  } catch {
    // Fallback: return original file if compression fails
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
    };
  }
}

/**
 * Format bytes to a human-readable string (e.g., "1.5 MB").
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
