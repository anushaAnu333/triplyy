'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { adminActivitiesApi } from '@/lib/api/activities';
import { formatCurrency, formatDate } from '@/lib/utils';

function getStatusVariant(status: string) {
  if (status === 'confirmed') return 'default';
  if (status === 'payment_completed') return 'secondary';
  if (status === 'cancelled' || status === 'refunded') return 'destructive';
  return 'outline';
}

function getStringField(record: Record<string, unknown> | undefined, keys: string[]): string {
  if (!record) return 'Not provided';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return 'Not provided';
}

export default function AdminActivityBookingDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const bookingId = params?.id;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-activity-booking-detail', bookingId],
    queryFn: () => adminActivitiesApi.getAdminActivityBookingById(bookingId),
    enabled: Boolean(bookingId),
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-600">Admin access required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    const message = error instanceof Error ? error.message : 'Failed to load booking details';
    return (
      <div className="container mx-auto p-6 space-y-3">
        <p className="text-red-600 text-sm">{message}</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const booking = data.booking;
  const activity = booking.activityId;
  const merchant = data.merchant;
  const merchantInfo = data.merchantOnboarding?.businessInfo as Record<string, unknown> | undefined;
  const customer = booking.userId as
    | { firstName?: string; lastName?: string; email?: string; phoneNumber?: string }
    | undefined;

  const tripDates =
    Array.isArray(booking.selectedDates) && booking.selectedDates.length > 0
      ? booking.selectedDates.map((d) => formatDate(d)).join(', ')
      : booking.selectedDate
        ? formatDate(booking.selectedDate)
        : 'N/A';

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Activity Booking Detail</h1>
          <p className="text-sm text-muted-foreground">
            Booking reference: <span className="font-medium text-foreground">{booking.bookingReference}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/activity-bookings">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Trip Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(booking.status)}>{booking.status.replace('_', ' ')}</Badge>
              <Badge variant={booking.payment.paymentStatus === 'completed' ? 'default' : 'outline'}>
                Payment: {booking.payment.paymentStatus}
              </Badge>
              <Badge variant={booking.payment.merchantPayoutStatus === 'paid' ? 'default' : 'outline'}>
                Payout: {booking.payment.merchantPayoutStatus}
              </Badge>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <p><span className="text-muted-foreground">Activity:</span> {activity?.title || 'N/A'}</p>
              <p><span className="text-muted-foreground">Location:</span> {activity?.location || 'N/A'}</p>
              <p><span className="text-muted-foreground">Trip date(s):</span> {tripDates}</p>
              <p><span className="text-muted-foreground">Participants:</span> {booking.numberOfParticipants ?? 'N/A'}</p>
            </div>
            {booking.specialRequests ? (
              <p>
                <span className="text-muted-foreground">Special requests:</span> {booking.specialRequests}
              </p>
            ) : null}
            <Separator />
            <div className="grid gap-2 md:grid-cols-2">
              <p><span className="text-muted-foreground">Guest paid:</span> {formatCurrency(booking.payment.amount, booking.payment.currency)}</p>
              <p><span className="text-muted-foreground">Merchant 80%:</span> {formatCurrency(booking.payment.merchantAmount, booking.payment.currency)}</p>
              <p><span className="text-muted-foreground">Triply 20%:</span> {formatCurrency(booking.payment.triplyCommission, booking.payment.currency)}</p>
              <p><span className="text-muted-foreground">Payout date:</span> {booking.payment.merchantPayoutDate ? formatDate(booking.payment.merchantPayoutDate) : 'Pending'}</p>
              <p className="md:col-span-2"><span className="text-muted-foreground">Payout reference:</span> {booking.payment.merchantPayoutTransactionId || 'Not recorded'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Customer Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{[customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || booking.customerName || 'N/A'}</p>
            <p className="text-muted-foreground">{customer?.email || booking.customerEmail || 'N/A'}</p>
            <p className="text-muted-foreground">{customer?.phoneNumber || booking.customerPhone || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Merchant Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{[merchant?.firstName, merchant?.lastName].filter(Boolean).join(' ') || 'N/A'}</p>
            <p className="text-muted-foreground">{merchant?.email || 'N/A'}</p>
            <p className="text-muted-foreground">{merchant?.phoneNumber || 'N/A'}</p>
            <Separator className="my-2" />
            <p><span className="text-muted-foreground">Business type:</span> {data.merchantOnboarding?.businessType || 'N/A'}</p>
            <p>
              <span className="text-muted-foreground">Categories:</span>{' '}
              {data.merchantOnboarding?.categories?.length ? data.merchantOnboarding.categories.join(', ') : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Merchant Account Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Account holder:</span> {getStringField(merchantInfo, ['accountHolderName', 'beneficiaryName', 'holderName', 'name'])}</p>
            <p><span className="text-muted-foreground">Account number:</span> {getStringField(merchantInfo, ['accountNumber', 'accountNo'])}</p>
            <p><span className="text-muted-foreground">Bank name:</span> {getStringField(merchantInfo, ['bankName'])}</p>
          
            <p><span className="text-muted-foreground">Updated:</span> {data.merchantOnboarding?.updatedAt ? formatDate(data.merchantOnboarding.updatedAt) : 'N/A'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
