'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Loader2,
  CheckCircle2,
  DollarSign,
  Wallet,
  Banknote,
  Calendar,
  CalendarDays,
  ClipboardList,
  ArrowRight,
  X,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { merchantActivitiesApi, Activity } from '@/lib/api/activities';
import { formatCurrency, formatDate, cn, MERCHANT_PAGE_WIDTH_CLASS } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h2>
  );
}

function MerchantDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const listingParam = searchParams.get('listing');
  const listingFilter: Activity['status'] | null =
    listingParam === 'pending' || listingParam === 'approved' || listingParam === 'rejected'
      ? listingParam
      : null;

  const { data: activities, isLoading } = useQuery({
    queryKey: ['merchant-activities'],
    queryFn: () => merchantActivitiesApi.getMyActivities(),
    enabled: isAuthenticated && user?.role === 'merchant',
  });

  const { data: dashboard, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: () => merchantActivitiesApi.getDashboard(),
    enabled: isAuthenticated && user?.role === 'merchant',
  });

  const approveAvailabilityMutation = useMutation({
    mutationFn: (bookingId: string) => merchantActivitiesApi.approveMerchantAvailability(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-bookings'] });
      toast({
        title: 'Availability confirmed',
        description: 'The customer can now pay from their booking page to secure their seat.',
      });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        title: 'Could not confirm availability',
        description: error.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const approveBookingMutation = useMutation({
    mutationFn: (bookingId: string) => merchantActivitiesApi.approveActivityBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-bookings'] });
      toast({ title: 'Booking confirmed', description: 'This booking is now confirmed.' });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast({
        title: 'Failed to confirm booking',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  if (!authLoading && isAuthenticated && user?.role !== 'merchant') {
    router.push('/dashboard');
    return null;
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const pendingCount = activities?.filter((a) => a.status === 'pending').length || 0;
  const approvedCount = activities?.filter((a) => a.status === 'approved').length || 0;
  const rejectedCount = activities?.filter((a) => a.status === 'rejected').length || 0;

  const displayedActivities =
    listingFilter && activities ? activities.filter((a) => a.status === listingFilter) : activities;

  const getStatusBadge = (status: Activity['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="shrink-0 bg-emerald-600 hover:bg-emerald-600/90 text-white">Approved</Badge>
        );
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="shrink-0 border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const hasActionItems =
    (dashboard?.needsConfirmAvailability?.length ?? 0) > 0 ||
    (dashboard?.needsConfirmBooking?.length ?? 0) > 0;

  const stats = dashboard?.stats;

  return (
    <div className="min-h-screen bg-muted/30 py-8 pb-14">
      <div className={MERCHANT_PAGE_WIDTH_CLASS}>
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Merchant dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Overview of earnings, bookings, and listings</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button variant="outline" size="default" asChild className="bg-background">
              <Link href="/merchant/bookings">
                <ClipboardList className="mr-2 h-4 w-4" />
                Bookings
              </Link>
            </Button>
            <Button variant="outline" size="default" asChild className="bg-background">
              <Link href="/merchant/availability">
                <CalendarDays className="mr-2 h-4 w-4" />
                Availability
              </Link>
            </Button>
            <Button size="lg" className="h-11 min-w-[10rem] font-semibold shadow-sm" asChild>
              <Link href="/merchant/add-activity">
                <Plus className="mr-2 h-5 w-5" />
                Add activity
              </Link>
            </Button>
          </div>
        </div>

        {/* Overview */}
        <section className="mb-12">
          <SectionHeading>Overview</SectionHeading>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
            {/* Primary: total earned */}
            <Card className="border-2 border-emerald-600/25 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg lg:col-span-5">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <p className="text-sm font-medium text-emerald-100">Total earned</p>
                    <p className="text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                      {isLoadingDashboard ? '…' : formatCurrency(stats?.totalEarnings ?? 0, 'AED')}
                    </p>
                    <p className="max-w-sm text-sm leading-snug text-emerald-100/90">
                      Your share from guest payments that have completed successfully.
                    </p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <DollarSign className="h-8 w-8 text-white/90" aria-hidden />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Secondary metrics — neutral + semantic accents */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-1 xl:grid-cols-3">
              <Link href="/merchant/bookings?status=confirmed" className="group block h-full">
                <Card className="h-full border-amber-200/80 bg-amber-50/50 transition-all hover:border-amber-300 hover:shadow-md dark:border-amber-900/40 dark:bg-amber-950/20">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-amber-900/80 dark:text-amber-100/80">
                          Awaiting payouts
                        </p>
                        <p className="mt-2 text-2xl font-bold tabular-nums text-amber-950 dark:text-amber-50">
                          {isLoadingDashboard ? '…' : formatCurrency(stats?.pendingPayouts ?? 0, 'AED')}
                        </p>
                        <p className="mt-2 text-xs leading-snug text-amber-900/70 dark:text-amber-100/70">
                          Earned but not yet transferred to you by the platform.
                        </p>
                        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-900/90 dark:text-amber-100/90">
                          View bookings
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </p>
                      </div>
                      <Wallet className="h-9 w-9 shrink-0 text-amber-600/70 dark:text-amber-400/70" aria-hidden />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/merchant/bookings?status=confirmed" className="group block h-full">
                <Card className="h-full border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Paid out amount
                        </p>
                        <p className="mt-2 text-2xl font-bold tabular-nums">
                          {isLoadingDashboard ? '…' : formatCurrency(stats?.paidOut ?? 0, 'AED')}
                        </p>
                        <p className="mt-2 text-xs leading-snug text-muted-foreground">
                          Amount already paid out to your account.
                        </p>
                        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                          View bookings
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </p>
                      </div>
                      <Banknote className="h-9 w-9 shrink-0 text-muted-foreground/60" aria-hidden />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/merchant/bookings" className="group block h-full">
                <Card className="h-full border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Guest-paid bookings
                        </p>
                        <p className="mt-2 text-2xl font-bold tabular-nums">
                          {isLoadingDashboard ? '…' : stats?.totalBookings ?? 0}
                        </p>
                        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                          View in Bookings
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </p>
                        {stats != null && stats.completedBookings != null && stats.completedBookings !== stats.totalBookings ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Confirmed trips: {stats.completedBookings}
                          </p>
                        ) : null}
                      </div>
                      <Calendar className="h-9 w-9 shrink-0 text-muted-foreground/60" aria-hidden />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Bookings */}
        <section className="mb-12 space-y-8">
          <SectionHeading>Bookings</SectionHeading>

          {hasActionItems && (
            <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/15">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
                <div>
                  <CardTitle className="text-lg">Needs your attention</CardTitle>
                  <CardDescription>
                    Resolve here or in{' '}
                    <Link href="/merchant/bookings" className="font-medium text-foreground underline underline-offset-2">
                      Bookings
                    </Link>
                    .
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/merchant/bookings">View in list</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-8 pt-2">
                {(dashboard?.needsConfirmAvailability?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-amber-950 dark:text-amber-100">
                      Confirm availability ({dashboard?.needsConfirmAvailability?.length})
                    </h3>
                    <div className="space-y-3">
                      {dashboard!.needsConfirmAvailability!.map((booking) => (
                        <div
                          key={booking._id}
                          className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {booking.bookingReference}
                              </span>
                              <Badge variant="outline">Slot</Badge>
                            </div>
                            <p className="mt-1 font-semibold">{booking.activityTitle}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.customerName} · {formatDate(booking.selectedDate)} ·{' '}
                              {booking.numberOfParticipants} guest(s)
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                            <Button
                              size="sm"
                              disabled={approveAvailabilityMutation.isPending}
                              onClick={() => {
                                if (
                                  confirm(
                                    'Confirm that this date and number of guests are available? The customer will be able to pay after this.'
                                  )
                                ) {
                                  approveAvailabilityMutation.mutate(booking._id);
                                }
                              }}
                            >
                              {approveAvailabilityMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Calendar className="mr-2 h-4 w-4" />
                              )}
                              Confirm availability
                            </Button>
                            <Button variant="ghost" size="sm" className="h-auto py-1" asChild>
                              <Link href={`/merchant/bookings/${booking._id}`}>Details</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(dashboard?.needsConfirmBooking?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-violet-950 dark:text-violet-100">
                      Confirm paid bookings ({dashboard?.needsConfirmBooking?.length})
                    </h3>
                    <div className="space-y-3">
                      {dashboard!.needsConfirmBooking!.map((booking) => (
                        <div
                          key={booking._id}
                          className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {booking.bookingReference}
                              </span>
                              <Badge>Paid</Badge>
                            </div>
                            <p className="mt-1 font-semibold">{booking.activityTitle}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.customerName} · {formatDate(booking.selectedDate)}
                            </p>
                            <p className="mt-1 text-sm font-medium">
                              {formatCurrency(booking.merchantAmount, booking.currency)} your share
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={approveBookingMutation.isPending}
                              onClick={() => {
                                if (confirm('Mark this booking as fully confirmed?')) {
                                  approveBookingMutation.mutate(booking._id);
                                }
                              }}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Confirm booking
                            </Button>
                            <Button variant="ghost" size="sm" className="h-auto py-1" asChild>
                              <Link href={`/merchant/bookings/${booking._id}`}>Details</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </section>

        {/* Listings */}
        <section className="mb-12">
          <SectionHeading>Listings</SectionHeading>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              href="/merchant/dashboard?listing=pending"
              className={cn(
                'block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                listingFilter === 'pending' && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending review</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold tabular-nums">{pendingCount}</div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {pendingCount === 0
                      ? 'Nothing waiting — you are up to date.'
                      : 'Click to view these listings.'}
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link
              href="/merchant/dashboard?listing=approved"
              className={cn(
                'block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                listingFilter === 'approved' && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold tabular-nums text-emerald-600">{approvedCount}</div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {approvedCount === 0
                      ? 'No approved listings yet.'
                      : 'Click to view these listings.'}
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link
              href="/merchant/dashboard?listing=rejected"
              className={cn(
                'block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                listingFilter === 'rejected' && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold tabular-nums text-destructive">{rejectedCount}</div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {rejectedCount === 0 ? 'None — good news.' : 'Click to view these listings.'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {!listingFilter ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Select Pending review, Approved, or Rejected to view your listings.
            </p>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {listingFilter === 'pending'
                    ? 'Pending review'
                    : listingFilter === 'approved'
                      ? 'Approved'
                      : 'Rejected'}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/merchant/dashboard">
                    <X className="mr-1 h-4 w-4" />
                    Close list
                  </Link>
                </Button>
              </div>

              <Card className="mt-4 border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {listingFilter === 'pending'
                      ? 'Pending review'
                      : listingFilter === 'approved'
                        ? 'Approved listings'
                        : 'Rejected listings'}
                  </CardTitle>
                  <CardDescription>Click a row to open the activity</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-14">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !displayedActivities || displayedActivities.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">No listings in this category.</p>
                      <Button className="mt-6" size="lg" asChild>
                        <Link href="/merchant/add-activity">
                          <Plus className="mr-2 h-4 w-4" />
                          Add an activity
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayedActivities.map((activity) => (
                        <div
                          key={activity._id}
                          role="button"
                          tabIndex={0}
                          className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5"
                          onClick={() => router.push(`/merchant/activities/${activity._id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              router.push(`/merchant/activities/${activity._id}`);
                            }
                          }}
                        >
                          <div className="flex min-w-0 flex-1 gap-4">
                            {activity.photos[0] ? (
                              <img
                                src={activity.photos[0]}
                                alt={activity.title}
                                className="h-24 w-24 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Calendar className="h-8 w-8" aria-hidden />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <h3 className="text-base font-bold leading-snug tracking-tight">{activity.title}</h3>
                                {getStatusBadge(activity.status)}
                              </div>
                              <p className="mt-1 truncate text-sm text-muted-foreground">{activity.location}</p>
                              <p className="mt-3 text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                                {activity.currency} {activity.price}
                              </p>
                            </div>
                          </div>
                          {activity.status === 'rejected' && activity.rejectionReason ? (
                            <div className="text-sm text-muted-foreground sm:max-w-xs">
                              <p className="font-medium text-foreground">Rejection reason</p>
                              <p className="line-clamp-2">{activity.rejectionReason}</p>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function MerchantDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center py-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <MerchantDashboardContent />
    </Suspense>
  );
}
