'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { merchantActivitiesApi } from '@/lib/api/activities';
import { formatCurrency, formatDate, cn, MERCHANT_PAGE_WIDTH_CLASS } from '@/lib/utils';
import { SearchFiltersModal, SearchFiltersTriggerButton, countActiveFilters } from '@/components/filters';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'payment_completed', label: 'Payment completed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

function MerchantBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const urlKey = searchParams.toString();

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const attention = searchParams.get('attention') || '';
  const status = searchParams.get('status') || '';
  const qFromUrl = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(qFromUrl);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    setSearchInput(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      const cur = qFromUrl.trim();
      if (next === cur) return;
      const params = new URLSearchParams(urlKey);
      if (next) params.set('q', next);
      else params.delete('q');
      params.set('page', '1');
      router.replace(`/merchant/bookings?${params.toString()}`, { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, qFromUrl, urlKey, router]);

  const queryArgs = useMemo(
    () => ({
      attention: attention || undefined,
      status: attention ? undefined : status || undefined,
      search: qFromUrl || undefined,
    }),
    [attention, status, qFromUrl]
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['merchant-bookings', page, queryArgs.attention, queryArgs.status, queryArgs.search],
    queryFn: () => merchantActivitiesApi.getBookings(page, 15, queryArgs),
    enabled: isAuthenticated && user?.role === 'merchant',
    placeholderData: (previousData) => previousData,
  });

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: () => merchantActivitiesApi.getDashboard(),
    enabled: isAuthenticated && user?.role === 'merchant',
    staleTime: 60_000,
  });

  const dashboardStats = dashboard?.stats;
  const bookingStatusCounts = dashboard?.bookingStatusCounts;

  const statusOptionsForSelect = useMemo(() => {
    const counts = bookingStatusCounts;
    if (!counts) return STATUS_OPTIONS;
    return STATUS_OPTIONS.filter((o) => {
      if (o.value === 'all') return true;
      const key = o.value as keyof typeof counts;
      const c = counts[key] ?? 0;
      if (c > 0) return true;
      if (status === o.value) return true;
      return false;
    });
  }, [bookingStatusCounts, status]);

  const showQuickAvailability =
    dashboardLoading ||
    (dashboardStats?.needsConfirmAvailability ?? 0) > 0 ||
    attention === 'availability';
  const showQuickAwaiting =
    dashboardLoading ||
    (dashboardStats?.awaitingGuestPayment ?? 0) > 0 ||
    attention === 'awaiting_guest';
  const showQuickConfirm =
    dashboardLoading ||
    (dashboardStats?.needsConfirmBooking ?? 0) > 0 ||
    attention === 'confirm_booking';
  const hasWorkflowQuickFilters = showQuickAvailability || showQuickAwaiting || showQuickConfirm;

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== 'merchant') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  const applyFilters = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') params.delete(k);
        else params.set(k, v);
      });
      if (!('page' in updates)) params.set('page', '1');
      router.replace(`/merchant/bookings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const resetAllFilters = useCallback(() => {
    setSearchInput('');
    setFilterModalOpen(false);
    router.replace('/merchant/bookings', { scroll: false });
  }, [router]);

  const applyFiltersAndClose = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      applyFilters(updates);
      setFilterModalOpen(false);
    },
    [applyFilters]
  );

  const merchantFilterActiveCount = useMemo(
    () =>
      countActiveFilters([
        Boolean(qFromUrl.trim()),
        Boolean(attention),
        Boolean(!attention && status),
      ]),
    [qFromUrl, attention, status]
  );

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== 'merchant') {
    return null;
  }

  const bookings = data?.data ?? [];
  const meta = data?.meta;

  const filterLabel = attention
    ? attention === 'availability'
      ? 'Confirm slot'
      : attention === 'awaiting_guest'
        ? 'Awaiting guest payment'
        : attention === 'confirm_booking'
          ? 'Confirm trip'
          : attention
    : status
      ? STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
      : null;

  const quickFilterIdle = !attention && !status;
  const showResultsDimmed = isFetching && !isLoading;
  const hasActiveChips = Boolean(filterLabel || qFromUrl);

  return (
    <div className="bg-muted/30 py-5 sm:py-6">
      <div className={MERCHANT_PAGE_WIDTH_CLASS}>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3 h-8 text-muted-foreground">
          <Link href="/merchant/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to dashboard
          </Link>
        </Button>

        <SearchFiltersModal
          open={filterModalOpen}
          onOpenChange={setFilterModalOpen}
          title="Search & filters"
          description="Search by reference, guest, email, or activity title. "
          fields={[
            {
              id: 'merchant-booking-search',
              label: 'Search',
              value: searchInput,
              onChange: setSearchInput,
              placeholder: 'Reference, guest, email, activity…',
              onKeyDown: (e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const next = searchInput.trim();
                const params = new URLSearchParams(searchParams.toString());
                if (next) params.set('q', next);
                else params.delete('q');
                params.set('page', '1');
                router.replace(`/merchant/bookings?${params.toString()}`, { scroll: false });
              },
            },
          ]}
          onClearAll={resetAllFilters}
        >
          <div className="flex flex-col gap-3">
           

            <div className="flex flex-col gap-2">
              <p className="m-0 text-sm text-muted-foreground">Status</p>
              <Select
                value={attention ? 'all' : status || 'all'}
                onValueChange={(v) => {
                  if (attention) {
                    applyFiltersAndClose({ attention: null, status: v === 'all' ? null : v, page: '1' });
                  } else if (v === 'all') {
                    applyFiltersAndClose({ status: null, page: '1' });
                  } else {
                    applyFiltersAndClose({ status: v, page: '1' });
                  }
                }}
                disabled={Boolean(attention)}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptionsForSelect.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {attention ? (
                <p className="m-0 text-xs text-muted-foreground">Clear a quick filter to use status.</p>
              ) : null}
            </div>
          </div>
        </SearchFiltersModal>

        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="flex flex-col gap-2 border-b bg-card pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight">Bookings</CardTitle>
              {meta ? (
                <CardDescription className="text-sm">
                  {meta.total} booking{meta.total === 1 ? '' : 's'}
                  {meta.totalPages > 1 ? ` · Page ${meta.page} of ${meta.totalPages}` : ''}
                </CardDescription>
              ) : null}
            </div>
            <SearchFiltersTriggerButton
              onClick={() => setFilterModalOpen(true)}
              activeCount={merchantFilterActiveCount}
            />
          </CardHeader>

          {hasActiveChips ? (
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed bg-muted/40 px-3 py-2 text-sm">
                <p className="m-0 text-muted-foreground">Active</p>
                {filterLabel ? <Badge variant="secondary">{filterLabel}</Badge> : null}
                {qFromUrl ? (
                  <Badge variant="outline" className="font-normal">
                    Search: &quot;{qFromUrl}&quot;
                  </Badge>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={() => setFilterModalOpen(true)}
                >
                  Edit
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={resetAllFilters}>
                  Clear all
                </Button>
              </div>
            </CardContent>
          ) : null}

          {hasActiveChips ? <Separator /> : null}

          <CardContent className={cn('p-3 sm:p-4', showResultsDimmed && 'opacity-60 transition-opacity')}>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No bookings match your filters.</p>
                <Button type="button" variant="outline" className="mt-4" onClick={() => setFilterModalOpen(true)}>
                  Adjust search &amp; filters
                </Button>
              </div>
            ) : (
              <ul className="m-0 list-none space-y-2 p-0">
                {bookings.map((b) => (
                  <li key={b._id}>
                    <Link
                      href={`/merchant/bookings/${b._id}`}
                      className={cn(
                        'grid grid-cols-1 gap-3 rounded-lg border border-border/80 bg-background p-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:p-4',
                        'transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{b.bookingReference}</span>
                          <Badge variant={b.payment.paymentStatus === 'completed' ? 'default' : 'outline'} className="text-xs">
                            {b.payment.paymentStatus === 'completed' ? 'Paid' : 'Unpaid'}
                          </Badge>
                          <Badge variant="secondary" className="capitalize text-xs">
                            {b.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="mt-1 font-semibold leading-snug">{b.activity.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {b.customer.name} · {formatDate(b.selectedDate)} · {b.numberOfParticipants} guest(s)
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0 sm:justify-end">
                        <p className="text-sm font-semibold tabular-nums sm:text-right">
                          {formatCurrency(b.payment.merchantAmount, b.payment.currency)}{' '}
                          <span className="font-normal text-muted-foreground">to you</span>
                        </p>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {meta && meta.totalPages > 1 ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => applyFilters({ page: String(page - 1) })}
                >
                  Previous
                </Button>
                <p className="text-sm text-muted-foreground">
                  Page {page} of {meta.totalPages}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => applyFilters({ page: String(page + 1) })}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MerchantBookingsListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MerchantBookingsContent />
    </Suspense>
  );
}
