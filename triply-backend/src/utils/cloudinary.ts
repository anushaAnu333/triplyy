import { v2 as cloudinary } from 'cloudinary';
import env from '../config/environment';
import logger from './logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface UploadImageOptions {
  /** If true, store at full resolution with high quality (for destination/hero images). Default false = 1200x800 limit + auto quality. */
  highQuality?: boolean;
}

/**
 * Upload a single image to Cloudinary
 * @param filePath - Path to the file (from multer)
 * @param folder - Folder name in Cloudinary (optional)
 * @param options - highQuality: skip resize/compression to preserve clarity (for destination images)
 * @returns Upload result with URL and public ID
 */
export const uploadImage = async (
  filePath: string,
  folder = 'triply/activities',
  options: UploadImageOptions = {}
): Promise<UploadResult> => {
  const fs = require('fs');
  const { highQuality = false } = options;

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      const errorMsg = `File does not exist: ${filePath}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Check Cloudinary configuration
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      const errorMsg = 'Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    logger.info(`Uploading to Cloudinary: ${filePath} (highQuality: ${highQuality})`);

    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: 'image',
    };

    if (highQuality) {
      // Preserve clarity: store at original resolution, no resize. Best for destination/hero images.
      uploadOptions.quality = 'auto:best';
      // No transformation = image stored and delivered as uploaded (full clarity)
    } else {
      // Default: smaller size for activities/list thumbnails
      uploadOptions.transformation = [
        {
          width: 1200,
          height: 800,
          crop: 'limit',
          quality: 'auto',
        },
      ];
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    logger.info(`Successfully uploaded to Cloudinary: ${result.secure_url}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    const errorDetails = {
      message: error?.message,
      filePath,
      cloudName: env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
      apiKey: env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      apiSecret: env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing',
      errorCode: error?.http_code,
      errorName: error?.name,
    };
    
    logger.error('Cloudinary upload error:', errorDetails);
    
    // Provide more specific error message
    if (error?.message?.includes('Invalid API Key')) {
      throw new Error('Invalid Cloudinary API Key. Please check your CLOUDINARY_API_KEY in .env file.');
    }
    if (error?.message?.includes('Invalid signature')) {
      throw new Error('Invalid Cloudinary API Secret. Please check your CLOUDINARY_API_SECRET in .env file.');
    }
    if (error?.http_code === 401) {
      throw new Error('Cloudinary authentication failed. Please check your API credentials.');
    }
    
    throw new Error(`Failed to upload image to Cloudinary: ${error?.message || 'Unknown error'}`);
  }
};

export interface UploadAdminDestinationFileOptions {
  mimetype: string;
}

/**
 * Upload an admin-only destination attachment (PDF as raw, images as image).
 */
export const uploadDestinationAdminFile = async (
  filePath: string,
  folder: string,
  options: UploadAdminDestinationFileOptions
): Promise<UploadResult> => {
  const fs = require('fs');
  const { mimetype } = options;

  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary configuration is missing.');
  }

  const isPdf = mimetype === 'application/pdf';
  const uploadOptions: Record<string, unknown> = {
    folder,
    resource_type: isPdf ? 'raw' : 'image',
    use_filename: true,
    unique_filename: true,
  };
  if (!isPdf) {
    uploadOptions.quality = 'auto:best';
  }

  const result = await cloudinary.uploader.upload(filePath, uploadOptions);
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

/**
 * Parse the path segment after `/upload/` (version + public_id, optional transformations before `v…`).
 */
function parseAfterUploadSegment(afterUpload: string): { version?: number; publicId: string } {
  const segments = afterUpload.split('/').filter(Boolean);
  const versionIdx = segments.findIndex((s) => /^v\d+$/.test(s));
  if (versionIdx === -1) {
    return { publicId: decodeURIComponent(segments.join('/')) };
  }
  const version = parseInt(segments[versionIdx].slice(1), 10);
  const publicId = decodeURIComponent(segments.slice(versionIdx + 1).join('/'));
  return { version, publicId };
}

/** Remove `s--…--` signature segment so we can re-sign with the current API secret (old signatures may 401). */
function stripSignatureFromPathname(pathname: string): string {
  return pathname.replace(/\/s--[^/]+--(?=\/)/g, '');
}

interface ParsedCloudinaryDeliveryUrl {
  resourceType: 'image' | 'raw';
  publicId: string;
  version?: number;
}

/** Parse a `res.cloudinary.com` `secure_url` into resource type, public id, and optional version. */
function parseCloudinaryDeliveryUrl(secureUrl: string): ParsedCloudinaryDeliveryUrl {
  const trimmed = secureUrl.trim();
  const u = new URL(trimmed);
  u.pathname = stripSignatureFromPathname(u.pathname);
  const m = u.pathname.match(/\/(image|raw)\/upload\/(.+)$/);
  if (!m) {
    throw new Error('Not a valid res.cloudinary.com delivery URL');
  }
  const resourceType = m[1] as 'image' | 'raw';
  const { version, publicId } = parseAfterUploadSegment(m[2]);
  return { resourceType, publicId, version };
}

function buildSignedDeliveryUrl(parsed: ParsedCloudinaryDeliveryUrl, longUrlSignature: boolean): string {
  const options: Record<string, unknown> = {
    resource_type: parsed.resourceType,
    sign_url: true,
    secure: true,
    long_url_signature: longUrlSignature,
  };
  if (parsed.version !== undefined) {
    options.version = parsed.version;
  } else {
    // SDK defaults force_version=true and injects v1 when public_id contains `/`, which often mismatches the real asset → 401.
    options.force_version = false;
  }
  return cloudinary.url(parsed.publicId, options);
}

const CLOUDINARY_FETCH_HEADERS = {
  Accept: '*/*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
} as const;

function inferFormatFromPublicId(publicId: string): string {
  const base = publicId.split('/').pop() || publicId;
  const dot = base.lastIndexOf('.');
  return dot === -1 ? '' : base.slice(dot + 1);
}

/**
 * Fetch bytes from Cloudinary for server-side proxying: tries signed CDN URL (short sig), then long SHA-256
 * signature, then the authenticated Admin API download URL (avoids CDN-only auth issues).
 */
export async function fetchCloudinaryAssetForProxy(secureUrl: string): Promise<globalThis.Response> {
  const parsed = parseCloudinaryDeliveryUrl(secureUrl);
  const short = buildSignedDeliveryUrl(parsed, false);
  let res = await fetch(short, { redirect: 'follow', headers: CLOUDINARY_FETCH_HEADERS });
  if (res.ok) return res;

  if (res.status === 401) {
    const long = buildSignedDeliveryUrl(parsed, true);
    res = await fetch(long, { redirect: 'follow', headers: CLOUDINARY_FETCH_HEADERS });
    if (res.ok) return res;

    const ext = inferFormatFromPublicId(parsed.publicId);
    const format = ext || (parsed.resourceType === 'image' ? 'jpg' : 'pdf');
    const apiUrl = cloudinary.utils.private_download_url(parsed.publicId, format, {
      resource_type: parsed.resourceType,
      type: 'upload',
    });
    res = await fetch(apiUrl, { redirect: 'follow', headers: CLOUDINARY_FETCH_HEADERS });
  }

  return res;
}

/**
 * Upload multiple images to Cloudinary (max 3)
 * @param filePaths - Array of file paths (from multer)
 * @param folder - Folder name in Cloudinary (optional)
 * @returns Array of upload results
 */
export const uploadImages = async (
  filePaths: string[],
  folder = 'triply/activities'
): Promise<UploadResult[]> => {
  if (filePaths.length === 0 || filePaths.length > 3) {
    throw new Error('Must upload between 1 and 3 images');
  }

  try {
    const uploadPromises = filePaths.map((filePath) => uploadImage(filePath, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error: any) {
    logger.error('Cloudinary batch upload error:', {
      message: error?.message,
      filePaths,
      errorName: error?.name,
    });
    // Re-throw the original error to preserve the specific error message
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param publicId - Public ID of the image
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

export default cloudinary;
