import Link from 'next/link';
import { ArrowRight, Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatActivityBookingDates } from '@/lib/utils';
import type { ActivityBooking } from '@/lib/api/activities';

function getActivityBookingStatusLabel(status: ActivityBooking['status']) {
  switch (status) {
    case 'pending_payment':
      return 'Pending Payment';
    case 'payment_completed':
      return 'Payment Completed';
    case 'confirmed':
      return 'Confirmed';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}

function getActivityBookingStatusColor(status: ActivityBooking['status']): string {
  const colors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    payment_completed: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function ActivityBookingCard({ booking }: { booking: ActivityBooking }) {
  // Backend may populate `activityId`, so treat it as an object at runtime.
  const activity = booking.activityId as unknown as {
    title?: string;
    location?: string;
    photos?: string[];
  } | null;

  const photo = activity?.photos?.[0] || '/placeholder-activity.jpg';
  const title = activity?.title || 'Activity';

  return (
    <Card key={booking._id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="w-full md:w-40 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {activity?.photos?.[0] ? (
              <img src={photo} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground font-mono">{booking.bookingReference}</p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getActivityBookingStatusColor(
                  booking.status
                )}`}
              >
                {getActivityBookingStatusLabel(booking.status)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Booked: {formatDate(booking.createdAt)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Selected: {formatActivityBookingDates(booking)}</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">
                  {formatCurrency(booking.payment.amount, booking.payment.currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              {booking.status === 'payment_completed' && (
                <p className="text-sm text-amber-600">Awaiting confirmation</p>
              )}
              {booking.status === 'confirmed' && (
                <p className="text-sm text-green-600">Your trip is confirmed!</p>
              )}
              {!['payment_completed', 'confirmed'].includes(booking.status) && (
                <div />
              )}

              <Button variant="ghost" size="sm" asChild>
                <Link href={`/bookings/${booking._id}`}>
                  View Details
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

