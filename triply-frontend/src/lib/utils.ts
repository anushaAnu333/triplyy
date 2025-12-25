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

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_deposit: 'bg-yellow-100 text-yellow-800',
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
    deposit_paid: 'Deposit Paid',
    dates_selected: 'Dates Selected',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

