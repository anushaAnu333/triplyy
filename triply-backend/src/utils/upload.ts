import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import AppError from './AppError';

// Create uploads directories if they don't exist
const uploadDir = path.join(process.cwd(), 'uploads', 'activities');
const destinationUploadDir = path.join(process.cwd(), 'uploads', 'destinations');
[uploadDir, destinationUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `activity-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for images only
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400));
  }
};

const destinationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, destinationUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `dest-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Configure multer
export const uploadActivityImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 3, // Max 3 files
  },
});

export const uploadDestinationImages = multer({
  storage: destinationStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5,
  },
});

/**
 * Clean up uploaded files after processing
 */
export const cleanupFiles = (filePaths: string[]): void => {
  filePaths.forEach((filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  });
};
