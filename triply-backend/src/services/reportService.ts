import { Booking, Commission, User } from '../models';
import logger from '../utils/logger';

interface BookingReport {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  destination: string;
  status: string;
  depositAmount: number;
  paymentStatus: string;
  travelStartDate?: string;
  travelEndDate?: string;
  affiliateCode?: string;
  createdAt: string;
}

interface AffiliateReport {
  affiliateName: string;
  affiliateEmail: string;
  code: string;
  bookingReference: string;
  bookingAmount: number;
  commissionAmount: number;
  commissionStatus: string;
  createdAt: string;
}

/**
 * Generate bookings report data
 */
export const generateBookingsReport = async (
  filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    destinationId?: string;
  }
): Promise<BookingReport[]> => {
  try {
    const query: Record<string, unknown> = {};

    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.destinationId) {
      query.destinationId = filters.destinationId;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('destinationId', 'name')
      .sort({ createdAt: -1 });

    return bookings.map((booking) => {
      const user = booking.userId as unknown as {
        firstName: string;
        lastName: string;
        email: string;
      };
      const destination = booking.destinationId as unknown as {
        name: { en: string };
      };

      return {
        bookingReference: booking.bookingReference,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        destination: destination.name.en,
        status: booking.status,
        depositAmount: booking.depositPayment.amount,
        paymentStatus: booking.depositPayment.paymentStatus,
        travelStartDate: booking.travelDates.startDate?.toISOString().split('T')[0],
        travelEndDate: booking.travelDates.endDate?.toISOString().split('T')[0],
        affiliateCode: booking.affiliateCode,
        createdAt: booking.createdAt.toISOString().split('T')[0],
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to generate bookings report: ${message}`);
    throw error;
  }
};

/**
 * Generate affiliate commissions report data
 */
export const generateAffiliateReport = async (
  filters: {
    startDate?: Date;
    endDate?: Date;
    affiliateId?: string;
    status?: string;
  }
): Promise<AffiliateReport[]> => {
  try {
    const query: Record<string, unknown> = {};

    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    if (filters.affiliateId) {
      query.affiliateId = filters.affiliateId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const commissions = await Commission.find(query)
      .populate('affiliateId', 'firstName lastName email')
      .populate('bookingId', 'bookingReference')
      .sort({ createdAt: -1 });

    return commissions.map((commission) => {
      const affiliate = commission.affiliateId as unknown as {
        firstName: string;
        lastName: string;
        email: string;
      };
      const booking = commission.bookingId as unknown as {
        bookingReference: string;
      };

      return {
        affiliateName: `${affiliate.firstName} ${affiliate.lastName}`,
        affiliateEmail: affiliate.email,
        code: commission.affiliateCode,
        bookingReference: booking.bookingReference,
        bookingAmount: commission.bookingAmount,
        commissionAmount: commission.commissionAmount,
        commissionStatus: commission.status,
        createdAt: commission.createdAt.toISOString().split('T')[0],
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to generate affiliate report: ${message}`);
    throw error;
  }
};

/**
 * Convert report data to CSV format
 */
export const convertToCSV = <T extends Record<string, unknown>>(
  data: T[],
  headers: string[]
): string => {
  if (data.length === 0) {
    return headers.join(',');
  }

  const headerRow = headers.join(',');
  const dataRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

