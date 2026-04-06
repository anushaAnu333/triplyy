import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import AppError from './AppError';

// Create uploads directories if they don't exist
const uploadDir = path.join(process.cwd(), 'uploads', 'activities');
const destinationUploadDir = path.join(process.cwd(), 'uploads', 'destinations');
const homepageUploadDir = path.join(process.cwd(), 'uploads', 'homepage');
const onboardingUploadDir = path.join(process.cwd(), 'uploads', 'onboarding');
[uploadDir, destinationUploadDir, homepageUploadDir, onboardingUploadDir].forEach((dir) => {
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

const destinationAdminAttachmentFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else
    cb(
      new AppError(
        'Only PDF, JPEG, PNG, or WebP are allowed for internal destination files.',
        400
      )
    );
};

/** Admin-only destination attachments (PDF + images), max 5 files per request */
export const uploadDestinationAdminAttachments = multer({
  storage: destinationStorage,
  fileFilter: destinationAdminAttachmentFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB per file (PDFs)
    files: 5,
  },
});

const homepageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, homepageUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `homepage-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadHomepageImage = multer({
  storage: homepageStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});

// Onboarding: PDF + images, multiple files
const onboardingStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, onboardingUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `onboarding-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const onboardingFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new AppError('Only PDF, JPG and PNG are allowed for onboarding documents.', 400));
};

export const uploadOnboardingFiles = multer({
  storage: onboardingStorage,
  fileFilter: onboardingFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 30,
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

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

/**
 * Resolve a stored path for serving; must resolve under {@link UPLOADS_ROOT} (blocks path traversal).
 */
export function resolveUploadPathForServing(filePath: string): string {
  const resolved = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(process.cwd(), filePath);
  const relativeToUploads = path.relative(UPLOADS_ROOT, resolved);
  if (relativeToUploads.startsWith('..') || path.isAbsolute(relativeToUploads)) {
    throw new AppError('Invalid document path', 403);
  }
  if (!fs.existsSync(resolved)) {
    throw new AppError('File not found on server', 404);
  }
  return resolved;
}
