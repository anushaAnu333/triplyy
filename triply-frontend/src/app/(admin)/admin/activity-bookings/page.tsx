'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, MapPin, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { adminActivitiesApi, type ActivityBooking } from '@/lib/api/activities';
import { formatCurrency, formatDate } from '@/lib/utils';

/** Populated user from admin bookings list */
type PopulatedUser = { firstName?: string; lastName?: string; email?: string };

function getActivityBookingStatusLabel(status: ActivityBooking['status']): string {
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

/** True if last activity day is before today (merchant payout allowed). */
function isActivityDateInPast(booking: ActivityBooking): boolean {
  const raw = booking.lastActivityDate || booking.selectedDate;
  if (!raw) return false;
  const end = new Date(raw);
  end.setHours(23, 59, 59, 999);
  return end <= new Date();
}

export default function AdminActivityBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'payment_completed' | 'pending_payment' | 'confirmed' | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [payoutBooking, setPayoutBooking] = useState<ActivityBooking | null>(null);
  const [payoutReference, setPayoutReference] = useState('');

  const statusOptions = useMemo(
    () =>
      [
        { value: 'payment_completed', label: 'Payment Completed (needs approval)' },
        { value: 'pending_payment', label: 'Pending Payment' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'all', label: 'All' },
      ] as const,
    []
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-activity-bookings', page, statusFilter],
    queryFn: () => {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      return adminActivitiesApi.getAdminActivityBookings(page, limit, status);
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const approveMutation = useMutation({
    mutationFn: (bookingId: string) => adminActivitiesApi.approveActivityBooking(bookingId),
    onSuccess: () => {
      toast({ title: 'Booking approved', description: 'Activity booking is now confirmed.' });
      queryClient.invalidateQueries({ queryKey: ['admin-activity-bookings'] });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Please try again';
      toast({
        title: 'Failed to approve booking',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const payoutMutation = useMutation({
    mutationFn: ({ bookingId, paymentReference }: { bookingId: string; paymentReference?: string }) =>
      adminActivitiesApi.markMerchantPayoutPaid(bookingId, { paymentReference }),
    onSuccess: () => {
      toast({
        title: 'Merchant payout recorded',
        description: 'The merchant dashboard will show this amount as paid out.',
      });
      setPayoutBooking(null);
      setPayoutReference('');
      queryClient.invalidateQueries({ queryKey: ['admin-activity-bookings'] });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Please try again';
      toast({
        title: 'Could not record payout',
        description: message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const bookings = data?.data ?? [];
  const meta = data?.meta;

  const openPayoutDialog = (b: ActivityBooking) => {
    setPayoutReference('');
    setPayoutBooking(b);
  };

  const submitPayout = () => {
    if (!payoutBooking) return;
    payoutMutation.mutate({
      bookingId: payoutBooking._id,
      paymentReference: payoutReference.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6 space-y-3">
          <div>
            <h1 className="text-xl font-bold mb-1">Activity Bookings (Admin)</h1>
            <p className="text-xs text-muted-foreground">
              Approve paid bookings, then after the trip date record the merchant payout (manual bank transfer).
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as 'payment_completed' | 'pending_payment' | 'confirmed' | 'all')
              }
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={() => void refetch()}>
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No bookings found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-xs">Activity</th>
                      <th className="text-left p-3 font-medium text-xs">Customer</th>
                      <th className="text-left p-3 font-medium text-xs">Status</th>
                      <th className="text-left p-3 font-medium text-xs">Merchant (80%)</th>
                      <th className="text-left p-3 font-medium text-xs">Merchant payout</th>
                      <th className="text-left p-3 font-medium text-xs">Trip date</th>
                      <th className="text-left p-3 font-medium text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => {
                      const activity = booking.activityId as {
                        title?: string;
                        location?: string;
                        photos?: string[];
                        merchantId?: { firstName?: string; lastName?: string; email?: string; _id?: string };
                      };
                      const customer = booking.userId as unknown as PopulatedUser;
                      const payoutPending =
                        booking.status === 'confirmed' &&
                        booking.payment.paymentStatus === 'completed' &&
                        booking.payment.merchantPayoutStatus === 'pending';
                      const tripPast = isActivityDateInPast(booking);
                      const canRecordPayout = payoutPending && tripPast;

                      return (
                        <tr key={booking._id} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <div className="flex items-start gap-3">
                              {activity?.photos?.[0] ? (
                                <img
                                  src={activity.photos[0]}
                                  alt={activity.title}
                                  className="w-10 h-10 rounded-md object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                  <MapPin className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium leading-tight">{activity?.title || 'Activity'}</p>
                                <p className="text-[11px] text-muted-foreground">{activity?.location}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <p className="font-mono text-[10px] text-muted-foreground leading-none">
                                {booking.bookingReference}
                              </p>
                              <p className="text-sm font-medium leading-tight">
                                {customer?.firstName} {customer?.lastName}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{customer?.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityBookingStatusColor(booking.status)}`}
                            >
                              {getActivityBookingStatusLabel(booking.status)}
                            </span>
                          </td>
                          <td className="p-3 font-medium tabular-nums">
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold tabular-nums">
                                {formatCurrency(booking.payment.merchantAmount, booking.payment.currency)}
                              </p>
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-normal text-muted-foreground leading-tight">
                                  {activity?.merchantId?.firstName || activity?.merchantId?._id
                                    ? `${activity?.merchantId?.firstName ?? ''} ${activity?.merchantId?.lastName ?? ''}`.trim()
                                    : 'Merchant'}
                                </p>
                                {activity?.merchantId?.email ? (
                                  <p className="text-[10px] font-normal text-muted-foreground leading-tight">
                                    {activity.merchantId.email}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            {booking.payment.merchantPayoutStatus === 'paid' ? (
                              <div>
                                <Badge className="bg-emerald-600 hover:bg-emerald-600">Paid</Badge>
                                {booking.payment.merchantPayoutDate ? (
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    {formatDate(booking.payment.merchantPayoutDate)}
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {booking.selectedDate ? formatDate(booking.selectedDate) : 'N/A'}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col items-start gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/admin/activity-bookings/${booking._id}`}>Details</Link>
                              </Button>
                              {booking.status === 'payment_completed' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  disabled={approveMutation.isPending}
                                  onClick={() => {
                                    if (confirm('Approve this activity booking?')) {
                                      approveMutation.mutate(booking._id);
                                    }
                                  }}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                              ) : payoutPending ? (
                                <Button
                                  size="sm"
                                  
                                  disabled={!canRecordPayout}
                                  title={
                                    !tripPast
                                      ? 'Available after the activity date (trip completed)'
                                      : 'Record that you sent the merchant their 80%'
                                  }
                                  onClick={() => openPayoutDialog(booking)}
                                >
                                  <Banknote className="w-4 h-4 mr-1" />
                                Record Payout
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {meta && meta.totalPages > 1 ? (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <div className="flex items-center px-4 text-xs text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </div>
            <Button
              variant="outline"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        ) : null}

        <Dialog
          open={payoutBooking !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPayoutBooking(null);
              setPayoutReference('');
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Trip completed — record merchant payout</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2 text-xs text-muted-foreground pt-1">
                  <p>
                    After you have <strong className="text-foreground">manually transferred</strong> the merchant
                    share (80%), confirm here so the merchant dashboard updates.
                  </p>
                  {payoutBooking ? (
                    <p className="rounded-md border bg-muted/50 px-2 py-1 text-foreground">
                      Pay merchant:{' '}
                      <strong className="tabular-nums">
                        {formatCurrency(payoutBooking.payment.merchantAmount, payoutBooking.payment.currency)}
                      </strong>
                      <span className="text-muted-foreground"> · ref {payoutBooking.bookingReference}</span>
                    </p>
                  ) : null}
                  <p className="text-[11px]">You will transfer the money manually, then record it here.</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="payout-ref">Transfer reference (optional)</Label>
              <Input
                id="payout-ref"
                placeholder="Bank ref, Wise ID, etc."
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setPayoutBooking(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={submitPayout} disabled={payoutMutation.isPending}>
                {payoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Payment to merchant completed'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
