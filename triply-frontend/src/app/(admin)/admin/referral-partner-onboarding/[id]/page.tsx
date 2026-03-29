'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, FileText, Loader2, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  adminReferralPartnerOnboardingApi,
  getReferralPartnerDocumentUrl,
  type ReferralPartnerOnboardingApplication,
  type ReferralPartnerOnboardingStatus,
} from '@/lib/api/adminReferralPartnerOnboarding';
import {
  formatDetailDate,
  getPreviousApplicationId,
  normalizeStoredDocumentPath,
} from '@/lib/admin/onboardingDetailShared';
import { AdminOnboardingBusinessBlocks } from '@/components/admin/AdminOnboardingBusinessBlocks';
import { AdminOnboardingDocumentPreview } from '@/components/admin/AdminOnboardingDocumentPreview';

function getStatusBadge(status: ReferralPartnerOnboardingStatus) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-600">
          Pending
        </Badge>
      );
    case 'reapplied':
      return (
        <Badge variant="outline" className="text-violet-700 border-violet-600">
          Reapplied
        </Badge>
      );
    case 'approved':
      return <Badge className="bg-green-600">Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function needsReview(status: ReferralPartnerOnboardingStatus): boolean {
  return status === 'pending' || status === 'reapplied';
}

export default function AdminReferralPartnerDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: application, isLoading, error } = useQuery({
    queryKey: ['admin-referral-partner-onboarding', id],
    queryFn: () => adminReferralPartnerOnboardingApi.getById(id),
    enabled: Boolean(id) && isAuthenticated && user?.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: () => adminReferralPartnerOnboardingApi.approve(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-referral-partner-onboarding'] });
      toast({ title: 'Application approved' });
      router.push('/admin/referral-partner-onboarding');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Failed to approve', description: msg, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason?: string) => adminReferralPartnerOnboardingApi.reject(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-referral-partner-onboarding'] });
      setRejectOpen(false);
      setRejectionReason('');
      toast({ title: 'Application rejected' });
      router.push('/admin/referral-partner-onboarding');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Failed to reject', description: msg, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminReferralPartnerOnboardingApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-referral-partner-onboarding'] });
      toast({ title: 'Application deleted' });
      router.push('/admin/referral-partner-onboarding');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Failed to delete', description: msg, variant: 'destructive' });
    },
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <p className="text-muted-foreground">Invalid application ID.</p>
          <Link href="/admin/referral-partner-onboarding" className="text-primary hover:underline mt-2 inline-block">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !application) {
    return (
      <div className="min-h-screen bg-muted/30 py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <p className="text-destructive">Failed to load application.</p>
          <Link href="/admin/referral-partner-onboarding" className="text-primary hover:underline mt-2 inline-block">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  const app = application as ReferralPartnerOnboardingApplication;
  const biz = (app.businessInfo || {}) as Record<string, unknown>;
  const previousId = getPreviousApplicationId(app.previousApplicationId);

  return (
    <div className="min-h-screen bg-muted/30 py-6">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <Link
            href="/admin/referral-partner-onboarding"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Referral Partner Onboarding
          </Link>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold">Referral partner application</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {(app.userId as { firstName?: string; lastName?: string })?.firstName}{' '}
                  {(app.userId as { lastName?: string })?.lastName} · {(biz.businessName as string) || '—'}
                </p>
              </div>
              {getStatusBadge(app.status)}
            </div>

            {app.status === 'reapplied' && (
              <div className="rounded-md border border-violet-200 bg-violet-50 dark:bg-violet-950/30 p-3 text-sm">
                <p className="font-medium text-violet-900 dark:text-violet-100">Resubmission</p>
                <p className="text-muted-foreground mt-0.5">
                  This is a new application after a previous rejection.
                  {previousId && (
                    <>
                      {' '}
                      <Link
                        href={`/admin/referral-partner-onboarding/${previousId}`}
                        className="text-primary underline font-medium"
                      >
                        View previous application
                      </Link>
                    </>
                  )}
                </p>
              </div>
            )}

            <AdminOnboardingBusinessBlocks
              userId={app.userId}
              businessType={app.businessType}
              categories={app.categories ?? []}
              businessInfo={biz}
            />

            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" /> Documents
              </h4>
              {Object.keys(app.documentPaths || {}).length > 0 ? (
                <ul className="space-y-3">
                  {Object.entries(app.documentPaths).map(([key, rawPath]) => {
                    const path = normalizeStoredDocumentPath(rawPath);
                    return (
                      <AdminOnboardingDocumentPreview
                        key={key}
                        docKey={key}
                        filePath={path}
                        applicationId={app._id}
                        getDocumentUrl={getReferralPartnerDocumentUrl}
                        showDownload
                      />
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              )}
            </div>

            {app.status === 'rejected' && app.rejectionReason && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="font-medium text-destructive">Rejection reason</p>
                <p className="text-muted-foreground text-sm mt-1">{app.rejectionReason}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">Submitted {formatDetailDate(app.createdAt)}</p>

            {needsReview(app.status) && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                  {approveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Approve application
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setRejectOpen(true)}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  const ok = window.confirm('Delete this onboarding application permanently?');
                  if (!ok) return;
                  deleteMutation.mutate();
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Optionally add a reason. The applicant can resubmit after addressing feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rp-rejectionReason">Rejection reason (optional)</Label>
              <Textarea
                id="rp-rejectionReason"
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
              onClick={() => rejectMutation.mutate(rejectionReason.trim() || undefined)}
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
  );
}
