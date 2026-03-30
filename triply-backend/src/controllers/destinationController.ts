import { Request, Response, NextFunction } from 'express';
import { Destination, Availability } from '../models';
import { successResponse, createdResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest, DestinationFilters } from '../types/custom';
import { uploadImage } from '../utils/cloudinary';
import { cleanupFiles } from '../utils/upload';

function slugFromName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Normalize destination from legacy multilingual shape to single-language shape for API response */
function normalizeDestination(doc: unknown): Record<string, unknown> {
  const d = doc as Record<string, unknown>;
  const toStr = (v: unknown): string =>
    typeof v === 'string' ? v : (v as { en?: string })?.en ?? '';
  const toStrArr = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.map((x) => (typeof x === 'string' ? x : (x as { en?: string })?.en ?? ''))
      : [];
  return {
    ...d,
    name: toStr(d.name),
    description: toStr(d.description),
    shortDescription: d.shortDescription != null ? toStr(d.shortDescription) : undefined,
    highlights: d.highlights != null ? toStrArr(d.highlights) : [],
    inclusions: d.inclusions != null ? toStrArr(d.inclusions) : [],
    exclusions: d.exclusions != null ? toStrArr(d.exclusions) : [],
  };
}

/**
 * Get all active destinations with filters
 * GET /api/v1/destinations
 */
export const getDestinations = async (
  req: Request<object, object, object, DestinationFilters>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10', country, region, search } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: Record<string, unknown> = { isActive: true };

    if (country) {
      query.country = country;
    }

    if (region) {
      query.region = region;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
      ];
    }

    const [rawDestinations, total] = await Promise.all([
      Destination.find(query)
        .select('name slug shortDescription thumbnailImage country region depositAmount currency duration')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .lean(),
      Destination.countDocuments(query),
    ]);

    const destinations = rawDestinations.map((d) => normalizeDestination(d));

    successResponse(
      res,
      'Destinations retrieved successfully',
      destinations,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all destinations for admin (active + inactive)
 * GET /api/v1/destinations/admin/list
 */
export const getDestinationsForAdmin = async (
  req: Request<object, object, object, DestinationFilters>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10', country, region, search } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    if (country) query.country = country;
    if (region) query.region = region;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
      ];
    }

    const [rawDestinations, total] = await Promise.all([
      Destination.find(query)
        .select('name slug shortDescription thumbnailImage country region depositAmount currency duration isActive')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .lean(),
      Destination.countDocuments(query),
    ]);

    const destinations = rawDestinations.map((d) => normalizeDestination(d));

    successResponse(
      res,
      'Destinations retrieved successfully',
      destinations,
      getPaginationMeta(pageNum, limitNum, total)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get destination by slug
 * GET /api/v1/destinations/:slug
 */
export const getDestinationBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const raw = await Destination.findOne({ slug, isActive: true }).lean();

    if (!raw) {
      throw new AppError('Destination not found', 404);
    }

    successResponse(res, 'Destination retrieved successfully', normalizeDestination(raw));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new destination (Admin)
 * POST /api/v1/destinations
 */
export const createDestination = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = { ...req.body };
    if (!body.slug && typeof body.name === 'string' && body.name.trim()) {
      body.slug = slugFromName(body.name);
    }
    const destination = await Destination.create(body);

    createdResponse(res, 'Destination created successfully', destination);
  } catch (error) {
    next(error);
  }
};

/**
 * Update destination (Admin)
 * PUT /api/v1/destinations/:id
 */
export const updateDestination = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    if (!body.slug && typeof body.name === 'string' && body.name.trim()) {
      body.slug = slugFromName(body.name);
    }

    const destination = await Destination.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!destination) {
      throw new AppError('Destination not found', 404);
    }

    successResponse(res, 'Destination updated successfully', destination);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete/deactivate destination (Admin)
 * DELETE /api/v1/destinations/:id
 */
export const deleteDestination = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Soft delete by setting isActive to false
    const destination = await Destination.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!destination) {
      throw new AppError('Destination not found', 404);
    }

    successResponse(res, 'Destination deactivated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get availability calendar for destination
 * GET /api/v1/destinations/:id/availability
 */
export const getDestinationAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Verify destination exists
    const destination = await Destination.findById(id);
    if (!destination) {
      throw new AppError('Destination not found', 404);
    }

    // Build date query
    const dateQuery: Record<string, unknown> = { destinationId: id };

    if (startDate) {
      dateQuery.date = { $gte: new Date(startDate as string) };
    }

    if (endDate) {
      dateQuery.date = {
        ...(dateQuery.date as Record<string, Date>),
        $lte: new Date(endDate as string),
      };
    }

    // Default to next 6 months if no dates specified
    if (!startDate && !endDate) {
      const today = new Date();
      const sixMonthsLater = new Date();
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

      dateQuery.date = { $gte: today, $lte: sixMonthsLater };
    }

    const availability = await Availability.find(dateQuery).sort({ date: 1 });

    successResponse(res, 'Availability retrieved successfully', availability);
  } catch (error) {
    next(error);
  }
};

const DESTINATION_IMAGE_FOLDER = 'triply/destinations';

/**
 * Upload destination images (Admin) - max 5, returns URLs
 * POST /api/v1/destinations/upload-images
 */
export const uploadDestinationImagesHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      throw new AppError('No files uploaded', 400);
    }
    if (files.length > 5) {
      throw new AppError('Maximum 5 images allowed', 400);
    }
    const filePaths = files.map((f) => f.path).filter(Boolean);
    if (filePaths.length !== files.length) {
      throw new AppError('File path missing', 400);
    }
    const urls: string[] = [];
    try {
      for (const path of filePaths) {
        const result = await uploadImage(path, DESTINATION_IMAGE_FOLDER, { highQuality: true });
        urls.push(result.url);
      }
    } finally {
      cleanupFiles(filePaths);
    }
    successResponse(res, 'Images uploaded', { urls });
  } catch (error) {
    next(error);
  }
};

