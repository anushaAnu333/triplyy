import { Request, Response, NextFunction } from 'express';
import { Destination, Availability } from '../models';
import { successResponse, createdResponse, getPaginationMeta } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest, DestinationFilters } from '../types/custom';

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
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.ar': { $regex: search, $options: 'i' } },
        { 'description.en': { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
      ];
    }

    const [destinations, total] = await Promise.all([
      Destination.find(query)
        .select('name slug shortDescription thumbnailImage country region depositAmount currency duration')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Destination.countDocuments(query),
    ]);

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

    const destination = await Destination.findOne({ slug, isActive: true });

    if (!destination) {
      throw new AppError('Destination not found', 404);
    }

    successResponse(res, 'Destination retrieved successfully', destination);
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
    const destination = await Destination.create(req.body);

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

    const destination = await Destination.findByIdAndUpdate(id, req.body, {
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

