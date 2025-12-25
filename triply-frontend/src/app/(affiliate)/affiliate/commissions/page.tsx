'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/affiliate/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Commission History</h1>
            <p className="text-muted-foreground">Track all your earned commissions</p>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
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

        {/* Commissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No commissions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Booking Reference</th>
                      <th className="text-left p-4 font-medium">Code Used</th>
                      <th className="text-left p-4 font-medium">Booking Amount</th>
                      <th className="text-left p-4 font-medium">Commission</th>
                      <th className="text-left p-4 font-medium">Rate</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((commission: any) => (
                      <tr key={commission._id} className="border-b hover:bg-muted/30">
                        <td className="p-4 font-mono">
                          {commission.bookingId?.bookingReference || 'N/A'}
                        </td>
                        <td className="p-4 font-mono font-medium">
                          {commission.affiliateCode}
                        </td>
                        <td className="p-4">
                          {formatCurrency(commission.bookingAmount)}
                        </td>
                        <td className="p-4 font-semibold text-green-600">
                          +{formatCurrency(commission.commissionAmount)}
                        </td>
                        <td className="p-4">
                          {commission.commissionRate}%
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(commission.status)}`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(commission.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

