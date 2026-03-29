'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { affiliatesApi } from '@/lib/api/affiliates';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  AffiliateTable,
  AffiliateTableBody,
  AffiliateTableCell,
  AffiliateTableHead,
  AffiliateTableRow,
  AffiliateTableScroll,
  AffiliateTableTh,
} from '@/components/affiliate/AffiliateDataTable';
import { SearchFiltersModal, SearchFiltersTriggerButton } from '@/components/filters';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
];

export default function AffiliateCommissionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-commissions', page, statusFilter],
    queryFn: () => affiliatesApi.getCommissions(
      page, 
      10, 
      statusFilter === 'all' ? undefined : statusFilter
    ),
    enabled: isAuthenticated && user?.role === 'affiliate',
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400';
      case 'approved':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
      case 'paid':
        return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const commissionSourceLabel = (commission: { metadata?: { type?: string } }) => {
    const t = commission.metadata?.type;
    if (t === 'referral') return 'Referral sign-up';
    return 'Booking link';
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <SearchFiltersModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        title="Filter commissions"
        description="Show commissions by payout status."
        fields={[]}
        onClearAll={() => setStatusFilter('all')}
        clearLabel="Reset to all"
        applyLabel="Done"
      >
        <div className="space-y-2">
          <Label htmlFor="commission-status-filter">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="commission-status-filter" className="h-11 w-full">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SearchFiltersModal>

      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/affiliate/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-3xl font-bold">Commission History</h1>
            <p className="text-muted-foreground">Track all your earned commissions</p>
          </div>

          <SearchFiltersTriggerButton
            onClick={() => setFilterModalOpen(true)}
            activeCount={statusFilter !== 'all' ? 1 : 0}
            label="Filters"
          />
        </div>

        {/* Commissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Commissions</CardTitle>
            <CardDescription>
              <span className="font-medium text-foreground">Basis</span> is the customer&apos;s deposit total
              on that booking (e.g. AED 199). <span className="font-medium text-foreground">Your commission</span>{' '}
              is your partner commission rate applied to that amount — not the traveller&apos;s signup discount
              percent.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="text-center py-12 px-4">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No commissions found</p>
              </div>
            ) : (
              <AffiliateTableScroll>
                <AffiliateTable>
                  <AffiliateTableHead>
                    <AffiliateTableTh>Booking reference</AffiliateTableTh>
                    <AffiliateTableTh>Source</AffiliateTableTh>
                    <AffiliateTableTh>Code</AffiliateTableTh>
                    <AffiliateTableTh>Basis</AffiliateTableTh>
                    <AffiliateTableTh>Your commission</AffiliateTableTh>
                    <AffiliateTableTh>Rate</AffiliateTableTh>
                    <AffiliateTableTh>Payout status</AffiliateTableTh>
                    <AffiliateTableTh>Date</AffiliateTableTh>
                  </AffiliateTableHead>
                  <AffiliateTableBody>
                    {data?.data?.map((commission: any) => (
                      <AffiliateTableRow key={commission._id}>
                        <AffiliateTableCell className="font-mono text-sm">
                          {commission.bookingId?.bookingReference || 'N/A'}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-sm text-muted-foreground">
                          {commissionSourceLabel(commission)}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="font-mono text-sm font-medium">
                          {commission.affiliateCode}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-sm font-medium">
                          {formatCurrency(commission.bookingAmount)}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="font-semibold text-green-600">
                          {formatCurrency(commission.commissionAmount)}
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-sm">
                          {commission.commissionRate}%
                        </AffiliateTableCell>
                        <AffiliateTableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(commission.status)}`}>
                            {commission.status}
                          </span>
                        </AffiliateTableCell>
                        <AffiliateTableCell className="text-sm text-muted-foreground">
                          {formatDate(commission.createdAt)}
                        </AffiliateTableCell>
                      </AffiliateTableRow>
                    ))}
                  </AffiliateTableBody>
                </AffiliateTable>
              </AffiliateTableScroll>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data?.meta?.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page} of {data.meta.totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
              disabled={page === data.meta.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

