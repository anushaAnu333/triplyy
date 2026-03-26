import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'AED'): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(new Date(date));
}

/** Human-readable label for activity bookings (single day or multi-day in one reservation). */
export function formatActivityBookingDates(booking: {
  selectedDate: string;
  selectedDates?: string[];
  lastActivityDate?: string;
}): string {
  const dates =
    booking.selectedDates && booking.selectedDates.length > 0
      ? [...booking.selectedDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      : [booking.selectedDate];
  if (dates.length <= 1) {
    return formatDate(dates[0]);
  }
  const first = formatDate(dates[0], { month: 'short', day: 'numeric' });
  const last = formatDate(dates[dates.length - 1], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${first} – ${last}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_deposit: 'bg-yellow-100 text-yellow-800',
    pending_date: 'bg-amber-100 text-amber-900',
    deposit_paid: 'bg-blue-100 text-blue-800',
    dates_selected: 'bg-purple-100 text-purple-800',
    confirmed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getBookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_deposit: 'Pending Deposit',
    pending_date: 'Awaiting travel dates',
    deposit_paid: 'Deposit Paid',
    dates_selected: 'Dates Selected',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

/** Merchant hub pages: wide column; horizontal padding only (parent layout supplies top offset for fixed header). */
export const MERCHANT_PAGE_WIDTH_CLASS =
  'mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8';

