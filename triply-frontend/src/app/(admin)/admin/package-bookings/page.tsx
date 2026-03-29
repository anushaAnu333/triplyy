'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { packageBookingsApi, PackageBooking } from '@/lib/api/packageBookings';
import { getBookingStatusLabel } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminPackageBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignOpen, setAssignOpen] = useState(false);
  const [selected, setSelected] = useState<PackageBooking | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-package-bookings', statusFilter],
    queryFn: () =>
      packageBookingsApi.adminList({
        limit: 100,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const assignMutation = useMutation({
    mutationFn: () => {
      if (!selected?._id) throw new Error('No booking');
      return packageBookingsApi.adminAssignDates(selected._id, {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        adminNotes: adminNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-package-bookings'] });
      toast({ title: 'Travel dates assigned' });
      setAssignOpen(false);
      setSelected(null);
      setStartDate('');
      setEndDate('');
      setAdminNotes('');
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast({ title: 'Failed', description: msg, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const openAssign = (b: PackageBooking) => {
    setSelected(b);
    setStartDate('');
    setEndDate('');
    setAdminNotes('');
    setAssignOpen(true);
  };

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const rows = data?.data ?? [];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Package bookings
            </h1>
            <p className="text-muted-foreground mt-1">Assign travel dates for bookings in pending_date status.</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending_deposit">Pending deposit</SelectItem>
                <SelectItem value="pending_date">Pending date</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((b) => {
              const pkg = b.packageId as { name?: string; slug?: string } | undefined;
              const u = b.userId as { email?: string; firstName?: string; lastName?: string } | undefined;
              return (
                <Card key={b._id}>
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="font-mono text-sm text-muted-foreground">{b.bookingReference}</p>
                      <p className="font-semibold">{pkg?.name ?? 'Package'}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {u?.firstName} {u?.lastName} · {u?.email}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">{getBookingStatusLabel(b.status)}</span>
                        {b.travelDates?.startDate && (
                          <span className="text-muted-foreground ml-2">
                            {new Date(b.travelDates.startDate).toLocaleDateString()} –{' '}
                            {b.travelDates.endDate ? new Date(b.travelDates.endDate).toLocaleDateString() : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {b.status === 'pending_date' && (
                        <Button size="sm" onClick={() => openAssign(b)}>
                          Assign dates
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/bookings/package/${b._id}`} target="_blank">
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {rows.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No package bookings match this filter.</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign travel dates</DialogTitle>
            <p className="text-sm text-muted-foreground">Booking {selected?.bookingReference}</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Admin notes (optional)</Label>
              <Input value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={!startDate || !endDate || assignMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90"
            >
              {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
