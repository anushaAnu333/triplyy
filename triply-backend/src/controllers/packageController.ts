import { Request, Response, NextFunction } from 'express';
import { Package } from '../models';
import { successResponse, createdResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';
import type { IPackageItineraryDay } from '../models/Package';
import { uploadImage } from '../utils/cloudinary';
import { cleanupFiles } from '../utils/upload';

function slugFromName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const PACKAGE_IMAGE_FOLDER = 'triply/packages';

function normalizeItineraryFromBody(raw: unknown): IPackageItineraryDay[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: IPackageItineraryDay[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const d = item as Record<string, unknown>;
    const day = String(d.day || '').trim();
    if (!day) continue;
    const pointGroups = Array.isArray(d.pointGroups)
      ? (d.pointGroups as { text?: string; subPoints?: string[] }[])
          .map((g) => ({
            text: String(g.text || ''),
            subPoints: Array.isArray(g.subPoints) ? g.subPoints.map((s) => String(s)) : [],
          }))
          .filter((g) => g.text || (g.subPoints?.length ?? 0) > 0)
      : undefined;
    const highlights = Array.isArray(d.highlights) ? d.highlights.map((x) => String(x)) : [];
    const meals = Array.isArray(d.meals)
      ? d.meals
          .map((m) => String(m).trim().toUpperCase())
          .filter((m) => ['B', 'L', 'D'].includes(m))
      : undefined;
    out.push({
      day,
      route: d.route != null ? String(d.route) : undefined,
      meals: meals && meals.length ? meals : undefined,
      highlights,
      subHighlights: Array.isArray(d.subHighlights) ? d.subHighlights.map((x) => String(x)) : undefined,
      pointGroups: pointGroups?.length ? pointGroups : undefined,
      extra: d.extra != null ? String(d.extra) : undefined,
      checkin: d.checkin != null ? String(d.checkin) : undefined,
      overnight: d.overnight != null ? String(d.overnight) : undefined,
    });
  }
  return out.length ? out : undefined;
}

function normalizePricingTable(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const p = raw as Record<string, unknown>;
  const currency = String(p.currency || 'USD');
  const columnHeaders = Array.isArray(p.columnHeaders)
    ? (p.columnHeaders as unknown[]).map((h) => String(h))
    : [];
  const rowsIn = Array.isArray(p.rows) ? p.rows : [];
  const rows = rowsIn
    .map((r) => {
      if (!r || typeof r !== 'object') return null;
      const row = r as Record<string, unknown>;
      const category = String(row.category || '');
      const values = Array.isArray(row.values)
        ? (row.values as unknown[]).map((v) => Number(v))
        : [];
      return { category, values };
    })
    .filter(Boolean) as { category: string; values: number[] }[];
  if (!columnHeaders.length && !rows.length) return undefined;
  return { currency, columnHeaders, rows };
}

function normalizeHotelGroups(raw: unknown): { title: string; items: string[] }[] | undefined {
  if (!Array.isArray(raw) || !raw.length) return undefined;
  const out: { title: string; items: string[] }[] = [];
  for (const g of raw) {
    if (!g || typeof g !== 'object') continue;
    const o = g as Record<string, unknown>;
    const title = String(o.title || '').trim();
    const items = Array.isArray(o.items) ? (o.items as unknown[]).map((x) => String(x).trim()).filter(Boolean) : [];
    if (title || items.length) out.push({ title: title || 'Hotels', items });
  }
  return out.length ? out : undefined;
}

/**
 * Public: list active packages
 * GET /api/v1/packages
 */
export const getPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10', search } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = { isActive: true };

    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const [packages, total] = await Promise.all([
      Package.find(query)
        .select(
          'name slug shortDescription thumbnailImage location duration priceLabel priceCurrency highlights isPromotion promotionStartDate promotionEndDate'
        )
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .lean(),
      Package.countDocuments(query),
    ]);

    successResponse(res, 'Packages retrieved successfully', packages, getPaginationMeta(pageNum, limitNum, total));
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: get package by Mongo id
 * GET /api/v1/packages/admin/:id
 */
export const getPackageByIdAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const pkg = await Package.findById(id).lean();
    if (!pkg) {
      throw new AppError('Package not found', 404);
    }
    successResponse(res, 'Package retrieved successfully', pkg);
  } catch (error) {
    next(error);
  }
};

/**
 * Public: get package by slug
 * GET /api/v1/packages/:slug
 */
export const getPackageBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const pkg = await Package.findOne({ slug: slug.toLowerCase(), isActive: true }).lean();

    if (!pkg) {
      throw new AppError('Package not found', 404);
    }

    successResponse(res, 'Package retrieved successfully', pkg);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: list all packages
 * GET /api/v1/packages/admin/list
 */
export const getPackagesForAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10', search } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const [packages, total] = await Promise.all([
      Package.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }).lean(),
      Package.countDocuments(query),
    ]);

    successResponse(res, 'Packages retrieved successfully', packages, getPaginationMeta(pageNum, limitNum, total));
  } catch (error) {
    next(error);
  }
};

function buildPackagePayload(body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const duration =
    body.duration && typeof body.duration === 'object'
      ? {
          days: Number((body.duration as { days?: number }).days) || 1,
          nights: Number((body.duration as { nights?: number }).nights) || 0,
        }
      : { days: 1, nights: 0 };

  const itinerary = normalizeItineraryFromBody(body.itinerary);
  const secondaryItinerary = normalizeItineraryFromBody(body.secondaryItinerary);
  const pricingTable = normalizePricingTable(body.pricingTable);
  const hotelGroups = normalizeHotelGroups(body.hotelGroups);

  const payload: Record<string, unknown> = {
    description: String(body.description || ''),
    shortDescription: body.shortDescription != null ? String(body.shortDescription) : undefined,
    images: Array.isArray(body.images) ? body.images : [],
    thumbnailImage: body.thumbnailImage != null ? String(body.thumbnailImage) : '',
    location: String(body.location || '').trim(),
    duration,
    priceLabel: body.priceLabel != null ? String(body.priceLabel).trim() : undefined,
    priceCurrency: body.priceCurrency != null ? String(body.priceCurrency) : 'USD',
    pricingTable: pricingTable || undefined,
    hotelGroups: hotelGroups || undefined,
    blackoutDates: Array.isArray(body.blackoutDates)
      ? (body.blackoutDates as unknown[]).map((x) => String(x)).filter(Boolean)
      : undefined,
    inclusions: Array.isArray(body.inclusions) ? body.inclusions : [],
    exclusions: Array.isArray(body.exclusions) ? body.exclusions : [],
    importantNotes: Array.isArray(body.importantNotes)
      ? (body.importantNotes as unknown[]).map((x) => String(x)).filter(Boolean)
      : undefined,
    highlights: Array.isArray(body.highlights) ? body.highlights : [],
    itinerary: itinerary || undefined,
    secondaryItineraryTitle: body.secondaryItineraryTitle != null ? String(body.secondaryItineraryTitle) : undefined,
    secondaryItinerary: secondaryItinerary || undefined,
    contactPhone: body.contactPhone != null ? String(body.contactPhone).trim() : undefined,
    contactEmail: body.contactEmail != null ? String(body.contactEmail).trim() : undefined,
    contactInstagram: body.contactInstagram != null ? String(body.contactInstagram).trim() : undefined,
    seoTitle: body.seoTitle != null ? String(body.seoTitle).trim() : undefined,
    seoDescription: body.seoDescription != null ? String(body.seoDescription).trim() : undefined,
    seoKeywords: body.seoKeywords != null ? String(body.seoKeywords).trim() : undefined,
    isPromotion: body.isPromotion !== false,
    promotionStartDate: body.promotionStartDate ? new Date(String(body.promotionStartDate)) : undefined,
    promotionEndDate: body.promotionEndDate ? new Date(String(body.promotionEndDate)) : undefined,
    isActive: body.isActive !== false,
  };

  if (!partial) {
    payload.name = String(body.name || '').trim();
  }

  return payload;
}

/**
 * Admin: create package
 * POST /api/v1/packages
 */
export const createPackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;
    const name = String(body.name || '').trim();
    if (!name) {
      throw new AppError('Name is required', 400);
    }

    const location = String(body.location || '').trim();
    if (!location) {
      throw new AppError('Location is required', 400);
    }

    let slug = typeof body.slug === 'string' && body.slug.trim() ? slugFromName(body.slug) : slugFromName(name);

    const existing = await Package.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const data = buildPackagePayload(body, false);
    const doc = await Package.create({
      name,
      slug,
      ...data,
    });

    createdResponse(res, 'Package created successfully', doc);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: update package
 * PUT /api/v1/packages/:id
 */
export const updatePackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const pkg = await Package.findById(id);
    if (!pkg) {
      throw new AppError('Package not found', 404);
    }

    const body = req.body as Record<string, unknown>;

    if (body.name !== undefined) pkg.name = String(body.name).trim();

    const updates = buildPackagePayload(body, true);
    Object.assign(pkg, updates);

    if (body.location !== undefined) {
      const loc = String(body.location).trim();
      if (!loc) throw new AppError('Location cannot be empty', 400);
      pkg.location = loc;
    }
    if (body.slug !== undefined && String(body.slug).trim()) {
      pkg.slug = slugFromName(String(body.slug));
    }

    await pkg.save();
    successResponse(res, 'Package updated successfully', pkg);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: delete (deactivate) package
 * DELETE /api/v1/packages/:id
 */
export const deletePackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const pkg = await Package.findById(id);
    if (!pkg) {
      throw new AppError('Package not found', 404);
    }
    pkg.isActive = false;
    await pkg.save();
    successResponse(res, 'Package deactivated successfully', { id: pkg._id });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload package images (Admin) - max 5, returns URLs
 * POST /api/v1/packages/upload-images
 */
export const uploadPackageImagesHandler = async (
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
        const result = await uploadImage(path, PACKAGE_IMAGE_FOLDER, { highQuality: true });
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
