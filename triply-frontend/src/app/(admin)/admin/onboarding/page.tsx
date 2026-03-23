'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Briefcase,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  adminOnboardingApi,
  type MerchantOnboardingApplication,
  type OnboardingStatus,
} from '@/lib/api/adminOnboarding';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return s;
  }
}

function getStatusBadge(status: OnboardingStatus) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>;
    case 'approved':
      return <Badge className="bg-green-600">Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function AdminOnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<OnboardingStatus | 'all'>('pending');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selected, setSelected] = useState<MerchantOnboardingApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [page, setPage] = useState(1);

  const statusFilter = activeTab === 'all' ? undefined : activeTab;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-onboarding', statusFilter, page],
    queryFn: () => adminOnboardingApi.getList(statusFilter, page, 10),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminOnboardingApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-onboarding'] });
      toast({ title: 'Application approved' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Failed to approve', description: msg, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminOnboardingApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-onboarding'] });
      setRejectOpen(false);
      setRejectionReason('');
      setSelected(null);
      toast({ title: 'Application rejected' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Failed to reject', description: msg, variant: 'destructive' });
    },
  });

  const openReject = (app: MerchantOnboardingApplication) => {
    setSelected(app);
    setRejectionReason('');
    setRejectOpen(true);
  };

  const handleRejectSubmit = () => {
    if (!selected) return;
    rejectMutation.mutate({ id: selected._id, reason: rejectionReason.trim() || undefined });
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const applications = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  return (
    <div className="min-h-screen bg-muted/30 py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Merchant Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve or reject merchant partner applications
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as OnboardingStatus | 'all');
            setPage(1);
          }}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : applications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {tab === 'pending'
                      ? 'No pending applications'
                      : tab === 'approved'
                        ? 'No approved applications'
                        : tab === 'rejected'
                          ? 'No rejected applications'
                          : 'No applications yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => {
                  const user = app.userId as { firstName?: string; lastName?: string; email?: string };
                  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Unknown';
                  const info = (app.businessInfo || {}) as Record<string, unknown>;
                  const businessName = (info.businessName as string) || '—';
                  return (
                    <Card key={app._id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{businessName}</h3>
                              {getStatusBadge(app.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {name} · {user?.email}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 rounded-md bg-muted">
                                {app.businessType}
                              </span>
                              {app.categories?.slice(0, 3).map((c) => (
                                <span
                                  key={c}
                                  className="text-xs px-2 py-0.5 rounded-md border border-border"
                                >
                                  {c}
                                </span>
                              ))}
                              {app.categories?.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{app.categories.length - 3} more
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Submitted {formatDate(app.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/onboarding/${app._id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                            {app.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => approveMutation.mutate(app._id)}
                                  disabled={approveMutation.isPending}
                                >
                                  {approveMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openReject(app)}
                                  disabled={rejectMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>
          ))}
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject application</DialogTitle>
              <DialogDescription>
                Optionally add a reason. The user&apos;s merchant role will be reverted to user.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason">Rejection reason (optional)</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete documents..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectSubmit}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject application'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
