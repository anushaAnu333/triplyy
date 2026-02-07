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

/**
 * Upload a single image to Cloudinary
 * @param filePath - Path to the file (from multer)
 * @param folder - Folder name in Cloudinary (optional)
 * @returns Upload result with URL and public ID
 */
export const uploadImage = async (
  filePath: string,
  folder = 'triply/activities'
): Promise<UploadResult> => {
  const fs = require('fs');
  
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

    logger.info(`Uploading to Cloudinary: ${filePath}`);

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      transformation: [
        {
          width: 1200,
          height: 800,
          crop: 'limit',
          quality: 'auto',
        },
      ],
    });

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
