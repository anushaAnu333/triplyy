'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Filter, Users, DollarSign, Copy, 
  Check, X, Eye, Loader2 
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
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api/axios';

export default function AdminAffiliatesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-affiliates', page],
    queryFn: async () => {
      const response = await api.get(`/admin/affiliates?page=${page}&limit=10`);
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: pendingCommissions } = useQuery({
    queryKey: ['pending-commissions'],
    queryFn: async () => {
      const response = await api.get('/admin/commissions/pending');
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const payMutation = useMutation({
    mutationFn: async ({ affiliateId, amount }: { affiliateId: string; amount: number }) => {
      return api.post('/admin/commissions/pay', { affiliateId, amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      queryClient.invalidateQueries({ queryKey: ['pending-commissions'] });
      toast({ title: 'Payment processed successfully' });
      setShowPayDialog(false);
      setSelectedAffiliate(null);
      setPaymentAmount(0);
    },
    onError: () => {
      toast({ title: 'Failed to process payment', variant: 'destructive' });
    },
  });

  const approveCommissionMutation = useMutation({
    mutationFn: (commissionId: string) => api.put(`/admin/commissions/${commissionId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-commissions'] });
      toast({ title: 'Commission approved' });
    },
    onError: () => {
      toast({ title: 'Failed to approve commission', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Code copied to clipboard' });
  };

  const handlePay = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setPaymentAmount(affiliate.pendingCommission || 0);
    setShowPayDialog(true);
  };

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Manage Affiliates</h1>
            <p className="text-muted-foreground">View and manage affiliate partners</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search affiliates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Affiliates</p>
                  <p className="text-3xl font-bold">{data?.meta?.total || 0}</p>
                </div>
                <Users className="w-12 h-12 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Commissions</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {pendingCommissions?.data?.length || 0}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid Out</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(data?.totalPaidOut || 0)}
                  </p>
                </div>
                <Check className="w-12 h-12 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Commissions */}
        {pendingCommissions?.data?.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-amber-600">Pending Commission Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingCommissions.data.slice(0, 5).map((commission: any) => (
                  <div 
                    key={commission._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {commission.affiliateId?.firstName} {commission.affiliateId?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Booking: {commission.bookingId?.bookingReference}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(commission.commissionAmount)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveCommissionMutation.mutate(commission._id)}
                        disabled={approveCommissionMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Affiliates Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No affiliates found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Affiliate</th>
                      <th className="text-left p-4 font-medium">Codes</th>
                      <th className="text-left p-4 font-medium">Referrals</th>
                      <th className="text-left p-4 font-medium">Pending</th>
                      <th className="text-left p-4 font-medium">Paid</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((affiliate: any) => (
                      <tr key={affiliate._id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">
                              {affiliate.firstName} {affiliate.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {affiliate.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {affiliate.affiliateCodes?.slice(0, 2).map((code: any) => (
                              <span
                                key={code.code}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs font-mono cursor-pointer hover:bg-muted-foreground/20"
                                onClick={() => copyCode(code.code)}
                              >
                                {code.code}
                                <Copy className="w-3 h-3" />
                              </span>
                            ))}
                            {affiliate.affiliateCodes?.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{affiliate.affiliateCodes.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-medium">{affiliate.totalReferrals || 0}</td>
                        <td className="p-4 font-medium text-amber-600">
                          {formatCurrency(affiliate.pendingCommission || 0)}
                        </td>
                        <td className="p-4 font-medium text-green-600">
                          {formatCurrency(affiliate.paidCommission || 0)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {affiliate.pendingCommission > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePay(affiliate)}
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Pay
                              </Button>
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

      {/* Pay Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Pay commission to {selectedAffiliate?.firstName} {selectedAffiliate?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Amount (AED)</Label>
              <Input
                type="number"
                min={0}
                max={selectedAffiliate?.pendingCommission || 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Max: {formatCurrency(selectedAffiliate?.pendingCommission || 0)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => payMutation.mutate({ 
                affiliateId: selectedAffiliate._id, 
                amount: paymentAmount 
              })}
              disabled={payMutation.isPending || paymentAmount <= 0}
            >
              {payMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

