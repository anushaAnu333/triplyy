'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Filter, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { affiliatesApi, type ReferralBookingRow } from '@/lib/api/affiliates';
import {
  formatCurrency,
  formatDate,
  getBookingStatusColor,
  getBookingStatusLabel,
  getPayoutStatusColor,
  getPayoutStatusLabel,
} from '@/lib/utils';
import {
  AffiliateTable,
  AffiliateTableBody,
  AffiliateTableCell,
  AffiliateTableHead,
  AffiliateTableRow,
  AffiliateTableScroll,
  AffiliateTableTh,
} from '@/components/affiliate/AffiliateDataTable';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'dates_selected', label: 'Dates Selected' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,120px)_1fr] gap-x-3 gap-y-1 text-sm border-b border-border py-2 last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium break-words">{value ?? '—'}</span>
    </div>
  );
}

function formatTravelDates(td?: {
  startDate?: string;
  endDate?: string;
  isFlexible?: boolean;
}): string {
  if (!td) return '—';
  if (td.isFlexible) return 'Flexible dates';
  if (td.startDate && td.endDate) {
    return `${formatDate(td.startDate)} – ${formatDate(td.endDate)}`;
  }
  if (td.startDate) return formatDate(td.startDate);
  return '—';
}

export default function AffiliateBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [detailBooking, setDetailBooking] = useState<ReferralBookingRow | null>(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-bookings', page, statusFilter],
    queryFn: () => affiliatesApi.getReferralBookings(
      page, 
      10, 
      statusFilter === 'all' ? undefined : statusFilter
    ),
    enabled: isAuthenticated && user?.role === 'affiliate',
  });

  const totalPages = data?.meta?.totalPages ?? 0;

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'affiliate')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'affiliate') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-4 sm:py-6">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 h-8 text-sm">
          <Link href="/affiliate/dashboard">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Dashboard
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">Referral bookings</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
              <Filter className="w-3.5 h-3.5 mr-2 shrink-0" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No referral bookings yet
              </div>
            ) : (
              <AffiliateTableScroll>
                <AffiliateTable>
                  <AffiliateTableHead>
                    <AffiliateTableTh className="text-xs py-2 px-3">Reference</AffiliateTableTh>
                    <AffiliateTableTh className="text-xs py-2 px-3">Destination</AffiliateTableTh>
                    <AffiliateTableTh className="text-xs py-2 px-3">Status</AffiliateTableTh>
                    <AffiliateTableTh className="text-xs py-2 px-3 text-right whitespace-nowrap">
                      Deposit
                    </AffiliateTableTh>
                    <AffiliateTableTh className="text-xs py-2 px-3 text-right whitespace-nowrap">
                      Commission
                    </AffiliateTableTh>
                    <AffiliateTableTh className="text-xs py-2 px-3">Payout</AffiliateTableTh>
                    <AffiliateTableTh className="text-xs py-2 px-3">Date</AffiliateTableTh>
                    <AffiliateTableTh className="text-xs py-2 px-3 text-right w-[92px]">View</AffiliateTableTh>
                  </AffiliateTableHead>
                  <AffiliateTableBody>
                    {data?.data?.map((booking: ReferralBookingRow) => {
                      const rc = booking.referralCommission;
                      return (
                      <AffiliateTableRow key={booking._id}>
                        <AffiliateTableCell className="text-xs py-2 px-3 font-mono font-medium">
                          {booking.bookingReference}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-xs py-2 px-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{booking.destinationId?.name || '—'}</span>
                          </div>
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-xs py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${getBookingStatusColor(booking.status)}`}>
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-xs py-2 px-3 text-right tabular-nums font-medium">
                          {formatCurrency(booking.depositPayment?.amount ?? 0)}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-xs py-2 px-3 text-right tabular-nums font-semibold text-green-700 dark:text-green-400">
                          {rc ? formatCurrency(rc.commissionAmount) : '—'}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-xs py-2 px-3">
                          {rc?.status ? (
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium ${getPayoutStatusColor(rc.status)}`}
                            >
                              {getPayoutStatusLabel(rc.status)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-xs py-2 px-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(booking.createdAt)}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-xs py-2 px-3 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setDetailBooking(booking)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </AffiliateTableCell>
                      </AffiliateTableRow>
                    );
                    })}
                  </AffiliateTableBody>
                </AffiliateTable>
              </AffiliateTableScroll>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        <Dialog open={detailBooking != null} onOpenChange={(open) => !open && setDetailBooking(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-display">Booking details</DialogTitle>
            </DialogHeader>
            {detailBooking && (() => {
              const b = detailBooking;
              const rc = b.referralCommission;
              const u = b.userId;
              const codeUsed =
                rc?.affiliateCode ||
                (typeof u === 'object' && u?.referralCode) ||
                '—';
              const referredName =
                typeof u === 'object' && u
                  ? [u.firstName, u.lastName].filter(Boolean).join(' ') || '—'
                  : '—';
              const basis =
                rc &&
                (typeof rc.commissionBasisAmount === 'number'
                  ? rc.commissionBasisAmount
                  : typeof rc.bookingAmount === 'number'
                    ? rc.bookingAmount
                    : null);
              return (
                <div className="space-y-0 pt-1">
                  <DetailRow label="Reference" value={<span className="font-mono">{b.bookingReference}</span>} />
                  <DetailRow label="Destination" value={b.destinationId?.name} />
                  <DetailRow
                    label="Booking status"
                    value={
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(b.status)}`}
                      >
                        {getBookingStatusLabel(b.status)}
                      </span>
                    }
                  />
                  <DetailRow label="Created" value={formatDate(b.createdAt)} />
                  {b.updatedAt && (
                    <DetailRow label="Last updated" value={formatDate(b.updatedAt)} />
                  )}
                  <DetailRow label="Travel dates" value={formatTravelDates(b.travelDates)} />
                  <DetailRow label="Travellers" value={b.numberOfTravellers ?? '—'} />
                  <DetailRow
                    label="Special requests"
                    value={b.specialRequests?.trim() ? b.specialRequests : '—'}
                  />
                  <DetailRow label="Referred user" value={referredName} />
                  <DetailRow label="Email" value={typeof u === 'object' ? u?.email : '—'} />
                  <DetailRow label="Code used" value={<span className="font-mono text-xs">{codeUsed}</span>} />
                  {b.affiliateCode && (
                    <DetailRow
                      label="Booking affiliate code"
                      value={<span className="font-mono text-xs">{b.affiliateCode}</span>}
                    />
                  )}
                  <DetailRow
                    label="Deposit paid"
                    value={
                      <>
                        {formatCurrency(b.depositPayment?.amount ?? 0)}
                        {b.depositPayment?.currency ? (
                          <span className="text-muted-foreground text-xs ml-1">
                            {b.depositPayment.currency}
                          </span>
                        ) : null}
                      </>
                    }
                  />
                  <DetailRow
                    label="Payment status"
                    value={b.depositPayment?.paymentStatus ?? '—'}
                  />
                  {b.depositPayment?.transactionId && (
                    <DetailRow label="Transaction ID" value={String(b.depositPayment.transactionId)} />
                  )}
                  <DetailRow
                    label="Your commission"
                    value={
                      rc ? (
                        <span className="text-green-600 dark:text-green-400">
                          {formatCurrency(rc.commissionAmount)}
                        </span>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <DetailRow
                    label="Commission basis"
                    value={basis != null ? formatCurrency(basis) : '—'}
                  />
                  <DetailRow label="Rate" value={rc != null ? `${rc.commissionRate}%` : '—'} />
                  <DetailRow
                    label="Payout status"
                    value={
                      rc?.status ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPayoutStatusColor(rc.status)}`}
                        >
                          {getPayoutStatusLabel(rc.status)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm font-normal">No commission yet</span>
                      )
                    }
                  />
                  {b.calendarUnlockedUntil && (
                    <DetailRow
                      label="Calendar unlocked until"
                      value={formatDate(b.calendarUnlockedUntil)}
                    />
                  )}
                  {b.status === 'rejected' && b.rejectionReason && (
                    <DetailRow label="Rejection reason" value={b.rejectionReason} />
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

