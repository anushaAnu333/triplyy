'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Filter, Check, X, Eye, Download, 
  Loader2, Calendar, MapPin 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate, formatCurrency, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils';
import api from '@/lib/api/axios';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending_deposit', label: 'Pending Deposit' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'dates_selected', label: 'Dates Selected' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await api.get(`/bookings/admin/all?${params.toString()}`);
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const confirmMutation = useMutation({
    mutationFn: (bookingId: string) => api.put(`/bookings/admin/${bookingId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({ title: 'Booking confirmed successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to confirm booking', variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      api.put(`/bookings/admin/${bookingId}/reject`, { rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({ title: 'Booking rejected' });
      setShowRejectDialog(false);
      setRejectReason('');
    },
    onError: () => {
      toast({ title: 'Failed to reject booking', variant: 'destructive' });
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
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleConfirm = (bookingId: string) => {
    if (confirm('Are you sure you want to confirm this booking?')) {
      confirmMutation.mutate(bookingId);
    }
  };

  const handleReject = (booking: any) => {
    setSelectedBooking(booking);
    setShowRejectDialog(true);
  };

  const submitReject = () => {
    if (!rejectReason.trim()) {
      toast({ title: 'Please provide a rejection reason', variant: 'destructive' });
      return;
    }
    rejectMutation.mutate({ bookingId: selectedBooking._id, reason: rejectReason });
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Manage Bookings</h1>
            <p className="text-muted-foreground">View and manage all bookings</p>
          </div>
          
          <div className="flex items-center gap-4">
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

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No bookings found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Reference</th>
                      <th className="text-left p-4 font-medium">Customer</th>
                      <th className="text-left p-4 font-medium">Destination</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((booking: any) => (
                      <tr key={booking._id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <span className="font-mono font-medium">{booking.bookingReference}</span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">
                              {booking.userId?.firstName} {booking.userId?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.userId?.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{booking.destinationId?.name?.en || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </td>
                        <td className="p-4 font-medium">
                          {formatCurrency(booking.depositPayment?.amount, booking.depositPayment?.currency)}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(booking.createdAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {booking.status === 'dates_selected' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleConfirm(booking._id)}
                                  disabled={confirmMutation.isPending}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleReject(booking)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this booking.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full p-3 border rounded-lg min-h-[100px]"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={submitReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Reject Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

