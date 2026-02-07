import { Request, Response, NextFunction } from 'express';
import { Availability, Destination } from '../models';
import { successResponse, createdResponse } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';

/**
 * Get availability for a destination
 * GET /api/v1/availability/destination/:destinationId
 */
export const getAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { destinationId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify destination exists
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      throw new AppError('Destination not found', 404);
    }

    // Build date query
    const query: Record<string, unknown> = { destinationId };

    const start = startDate
      ? new Date(startDate as string)
      : new Date();
    const end = endDate
      ? new Date(endDate as string)
      : new Date(new Date().setMonth(new Date().getMonth() + 6));

    query.date = { $gte: start, $lte: end };

    const availability = await Availability.find(query).sort({ date: 1 });

    successResponse(res, 'Availability retrieved successfully', availability);
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update availability slot (Admin)
 * POST /api/v1/availability
 */
export const createAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { destinationId, date, availableSlots, priceOverride } = req.body;

    // Verify destination exists
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      throw new AppError('Destination not found', 404);
    }

    // Upsert availability
    const availability = await Availability.findOneAndUpdate(
      { destinationId, date: new Date(date) },
      {
        destinationId,
        date: new Date(date),
        availableSlots,
        priceOverride,
      },
      { upsert: true, new: true, runValidators: true }
    );

    createdResponse(res, 'Availability updated successfully', availability);
  } catch (error) {
    next(error);
  }
};

/**
 * Block a specific date (Admin)
 * PUT /api/v1/availability/:id/block
 */
export const blockDate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { blockReason } = req.body;

    const availability = await Availability.findByIdAndUpdate(
      id,
      { isBlocked: true, blockReason },
      { new: true }
    );

    if (!availability) {
      throw new AppError('Availability record not found', 404);
    }

    successResponse(res, 'Date blocked successfully', availability);
  } catch (error) {
    next(error);
  }
};

/**
 * Unblock a specific date (Admin)
 * PUT /api/v1/availability/:id/unblock
 */
export const unblockDate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const availability = await Availability.findByIdAndUpdate(
      id,
      { isBlocked: false, blockReason: undefined },
      { new: true }
    );

    if (!availability) {
      throw new AppError('Availability record not found', 404);
    }

    successResponse(res, 'Date unblocked successfully', availability);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update availability (Admin)
 * POST /api/v1/availability/bulk-update
 */
export const bulkUpdateAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { destinationId, dateRange, availableSlots, isBlocked, priceOverride } = req.body;

    // Verify destination exists
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      throw new AppError('Destination not found', 404);
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    // Validate date range
    if (startDate > endDate) {
      throw new AppError('Start date must be before end date', 400);
    }

    // Generate array of dates
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Bulk upsert operations
    const bulkOps = dates.map((date) => ({
      updateOne: {
        filter: { destinationId, date },
        update: {
          $set: {
            destinationId,
            date,
            availableSlots,
            isBlocked: isBlocked || false,
            priceOverride,
          },
          $setOnInsert: {
            bookedSlots: 0,
          },
        },
        upsert: true,
      },
    }));

    await Availability.bulkWrite(bulkOps);

    successResponse(res, `Availability updated for ${dates.length} dates`, {
      destinationId,
      datesUpdated: dates.length,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update slots for specific dates (Admin)
 * PUT /api/v1/availability/:destinationId/bulk
 */
export const bulkUpdateSlots = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { destinationId } = req.params;
    const { dates, totalSlots } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      throw new AppError('Dates array is required', 400);
    }

    if (!totalSlots || totalSlots < 0) {
      throw new AppError('Total slots must be a positive number', 400);
    }

    // Verify destination exists
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      throw new AppError('Destination not found', 404);
    }

    // Bulk upsert operations
    const bulkOps = dates.map((dateStr: string) => {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      
      return {
        updateOne: {
          filter: { destinationId, date },
          update: {
            $set: {
              destinationId,
              date,
              availableSlots: totalSlots,
            },
            $setOnInsert: {
              bookedSlots: 0,
              isBlocked: false,
            },
          },
          upsert: true,
        },
      };
    });

    await Availability.bulkWrite(bulkOps);

    successResponse(res, `Updated slots for ${dates.length} date(s) successfully`, {
      destinationId,
      datesUpdated: dates.length,
      totalSlots,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk block/unblock dates (Admin)
 * PUT /api/v1/availability/:destinationId/block
 */
export const bulkBlockDates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { destinationId } = req.params;
    const { dates, isBlocked } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      throw new AppError('Dates array is required', 400);
    }

    // Verify destination exists
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      throw new AppError('Destination not found', 404);
    }

    // Bulk upsert operations
    const bulkOps = dates.map((dateStr: string) => {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      
      return {
        updateOne: {
          filter: { destinationId, date },
          update: {
            $set: {
              destinationId,
              date,
              isBlocked: isBlocked || false,
            },
            $setOnInsert: {
              availableSlots: 999,
              bookedSlots: 0,
            },
          },
          upsert: true,
        },
      };
    });

    await Availability.bulkWrite(bulkOps);

    successResponse(res, `${isBlocked ? 'Blocked' : 'Unblocked'} ${dates.length} date(s) successfully`, {
      destinationId,
      datesUpdated: dates.length,
      isBlocked,
    });
  } catch (error) {
    next(error);
  }
};

