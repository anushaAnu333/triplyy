'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Search,
  Users,
  DollarSign,
  Copy,
  Check,
  Eye,
  Loader2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  KNOWN_BUSINESS_INFO_KEYS,
  renderUnknown,
  toLabel,
} from '@/lib/admin/onboardingDetailShared';
import api from '@/lib/api/axios';

interface AffiliateCodeRow {
  _id: string;
  code: string;
  isActive: boolean;
  usageCount: number;
}

interface AffiliateRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: string;
  affiliateCodes?: AffiliateCodeRow[];
  totalReferrals?: number;
  /** pending + approved (not yet paid out) */
  unpaidCommission?: number;
  /** approved only — eligible for Pay */
  approvedCommission?: number;
  paidCommission?: number;
}

interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AffiliatesListResponse {
  success: boolean;
  data: AffiliateRow[];
  meta?: PaginatedMeta;
  totalPaidOut?: number;
}

interface CommissionPendingRow {
  _id: string;
  commissionAmount: number;
  affiliateId?: { firstName?: string; lastName?: string; email?: string };
  bookingId?: { bookingReference?: string };
}

interface PendingCommissionsResponse {
  success: boolean;
  data: CommissionPendingRow[];
  meta?: PaginatedMeta;
}

interface AffiliateAccountUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  referralPartnerTermsAcceptedAt?: string;
  referralPartnerTermsVersion?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ReferralPartnerOnboardingDetail {
  _id: string;
  status: string;
  businessType: string;
  categories: string[];
  businessInfo: Record<string, unknown>;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AffiliateDetailsPayload {
  user: AffiliateAccountUser;
  referralPartnerOnboarding: ReferralPartnerOnboardingDetail | null;
}

interface AffiliateDetailsApiResponse {
  success: boolean;
  data: AffiliateDetailsPayload;
}

/** businessInfo keys that may contain payout / bank data — only these get a copy control */
const BANK_DETAIL_KEYS = new Set([
  'bankName',
  'accountHolderName',
  'accountNumber',
  'iban',
  'currency',
]);

function isBankDetailKey(key: string): boolean {
  return BANK_DETAIL_KEYS.has(key);
}

function orderedBusinessInfoKeys(info: Record<string, unknown>): string[] {
  const known = Array.from(KNOWN_BUSINESS_INFO_KEYS);
  const rest = Object.keys(info)
    .filter((k) => !KNOWN_BUSINESS_INFO_KEYS.has(k))
    .sort();
  return [...known.filter((k) => k in info), ...rest];
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
    const d = err.response.data as { message?: string };
    if (d.message) return d.message;
  }
  return fallback;
}

function buildBankDetailsCopyText(payload: AffiliateDetailsPayload | undefined): string {
  const o = payload?.referralPartnerOnboarding;
  if (!o) return '';
  const info = o.businessInfo || {};
  const lines: string[] = [];
  for (const key of orderedBusinessInfoKeys(info)) {
    if (!isBankDetailKey(key)) continue;
    const raw = renderUnknown(info[key]).trim();
    if (!raw || raw === '—') continue;
    lines.push(`${toLabel(key)}: ${raw}`);
  }
  return lines.join('\n');
}

function DetailField({ label, value }: { label: string; value: string }) {
  const trimmed = value.trim();
  return (
    <div className="flex items-start gap-2 py-2 px-3 border-b border-border/50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-all">{trimmed.length ? trimmed : '—'}</p>
      </div>
    </div>
  );
}

function CopyableField({ label, value }: { label: string; value: string }) {
  const { toast } = useToast();
  const trimmed = value.trim();
  const canCopy = trimmed.length > 0;
  const copy = () => {
    void navigator.clipboard.writeText(trimmed);
    toast({ title: 'Copied', description: label });
  };
  return (
    <div className="flex items-start gap-2 py-2 px-3 border-b border-border/50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-all">{canCopy ? trimmed : '—'}</p>
      </div>
      {canCopy && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={copy}
          aria-label={`Copy ${label}`}
        >
          <Copy className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export default function AdminAffiliatesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [payTarget, setPayTarget] = useState<AffiliateRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<AffiliateRow | null>(null);
  const [paymentReference, setPaymentReference] = useState('');

  const { data: affiliatesRes, isLoading } = useQuery({
    queryKey: ['admin-affiliates', page],
    queryFn: async () => {
      const response = await api.get<AffiliatesListResponse>(
        `/admin/affiliates?page=${page}&limit=10`
      );
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: pendingRes, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-commissions'],
    queryFn: async () => {
      const response = await api.get<PendingCommissionsResponse>(
        '/admin/commissions/pending?limit=50&page=1'
      );
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const {
    data: affiliateDetailsRes,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: ['admin-affiliate-details', detailTarget?._id],
    queryFn: async () => {
      const response = await api.get<AffiliateDetailsApiResponse>(
        `/admin/affiliates/${detailTarget!._id}/details`
      );
      return response.data.data;
    },
    enabled:
      isAuthenticated &&
      user?.role === 'admin' &&
      showDetailDialog &&
      !!detailTarget?._id,
    retry: 1,
  });

  const payMutation = useMutation({
    mutationFn: async ({
      affiliateId,
      paymentReference: ref,
    }: {
      affiliateId: string;
      paymentReference?: string;
    }) => {
      return api.post(`/admin/affiliates/${affiliateId}/pay-commissions`, {
        paymentReference: ref?.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-details'] });
      queryClient.invalidateQueries({ queryKey: ['pending-commissions'] });
      toast({ title: 'Payout recorded', description: 'Approved commissions were marked as paid.' });
      setShowPayDialog(false);
      setPayTarget(null);
      setPaymentReference('');
    },
    onError: (err: unknown) => {
      toast({
        title: 'Could not record payout',
        description: getErrorMessage(err, 'Try again or mark commissions paid individually.'),
        variant: 'destructive',
      });
    },
  });

  const approveCommissionMutation = useMutation({
    mutationFn: (commissionId: string) =>
      api.put(`/admin/commissions/${commissionId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      toast({ title: 'Commission approved', description: 'It can now be included in a payout.' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Approval failed',
        description: getErrorMessage(err, 'Could not approve commission.'),
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const affiliates = affiliatesRes?.data ?? [];
  const filteredAffiliates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return affiliates;
    return affiliates.filter((a) => {
      const name = `${a.firstName} ${a.lastName}`.toLowerCase();
      return name.includes(q) || (a.email ?? '').toLowerCase().includes(q);
    });
  }, [affiliates, search]);

  const pendingList = pendingRes?.data ?? [];
  const pendingTotal = pendingRes?.meta?.total ?? pendingList.length;

  const bankDetailsCopyText = useMemo(
    () => buildBankDetailsCopyText(affiliateDetailsRes),
    [affiliateDetailsRes]
  );

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast({ title: 'Code copied' });
  };

  const openPay = (affiliate: AffiliateRow) => {
    setPayTarget(affiliate);
    setPaymentReference('');
    setShowPayDialog(true);
  };

  const openDetail = (affiliate: AffiliateRow) => {
    setDetailTarget(affiliate);
    setShowDetailDialog(true);
  };

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-6 sm:py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Affiliates & payouts
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Approve new commission rows, then record a payout to mark all{' '}
              <span className="font-medium text-foreground">approved</span> commissions as paid for
              an affiliate.
            </p>
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Affiliates
                  </p>
                  <p className="text-2xl font-bold tabular-nums">{affiliatesRes?.meta?.total ?? 0}</p>
                </div>
                <Users className="w-10 h-10 text-muted-foreground/25 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Awaiting approval
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-amber-600">
                    {pendingLoading ? '—' : pendingTotal}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-muted-foreground/25 shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Commission rows still pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Paid out (all time)
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-green-600">
                    {formatCurrency(affiliatesRes?.totalPaidOut ?? 0)}
                  </p>
                </div>
                <Check className="w-10 h-10 text-muted-foreground/25 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {pendingList.length > 0 && (
          <Card className="mb-6 border-amber-200/60 dark:border-amber-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-800 dark:text-amber-200">
                Approve commissions
              </CardTitle>
              <CardDescription>
                {pendingTotal} row{pendingTotal === 1 ? '' : 's'} need approval before they can be
                paid.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingList.slice(0, 8).map((commission) => (
                <div
                  key={commission._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border bg-card px-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {commission.affiliateId?.firstName} {commission.affiliateId?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {commission.bookingId?.bookingReference ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-green-700 dark:text-green-400 tabular-nums">
                      +{formatCurrency(commission.commissionAmount)}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8"
                      onClick={() => approveCommissionMutation.mutate(commission._id)}
                      disabled={approveCommissionMutation.isPending}
                    >
                      {approveCommissionMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Partners</CardTitle>
            <CardDescription>
              Unpaid = pending + approved. Payout marks <span className="font-medium">approved</span>{' '}
              rows as paid.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : filteredAffiliates.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {affiliates.length === 0 ? 'No affiliates yet.' : 'No matches for your search.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-y">
                    <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <th className="p-3 pl-4">Partner</th>
                      <th className="p-3">Codes</th>
                      <th className="p-3 text-right">Referrals</th>
                      <th className="p-3 text-right">Unpaid</th>
                      <th className="p-3 text-right hidden md:table-cell">Approved</th>
                      <th className="p-3 text-right">Paid</th>
                      <th className="p-3 pr-4 text-right w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliates.map((affiliate) => {
                      const codes = affiliate.affiliateCodes ?? [];
                      const unpaid = affiliate.unpaidCommission ?? 0;
                      const approved = affiliate.approvedCommission ?? 0;
                      const paid = affiliate.paidCommission ?? 0;
                      const referrals = affiliate.totalReferrals ?? 0;
                      return (
                        <tr key={affiliate._id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-3 pl-4 align-top">
                            <p className="font-medium">
                              {affiliate.firstName} {affiliate.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {affiliate.email}
                            </p>
                          </td>
                          <td className="p-3 align-top">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {codes.slice(0, 3).map((c) => (
                                <button
                                  type="button"
                                  key={c._id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs font-mono hover:bg-muted/80"
                                  onClick={() => copyCode(c.code)}
                                >
                                  {c.code}
                                  <Copy className="w-3 h-3 opacity-70" />
                                </button>
                              ))}
                              {codes.length > 3 && (
                                <span className="text-xs text-muted-foreground self-center">
                                  +{codes.length - 3}
                                </span>
                              )}
                              {codes.length === 0 && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right tabular-nums align-top">{referrals}</td>
                          <td className="p-3 text-right tabular-nums text-amber-700 dark:text-amber-400 font-medium align-top">
                            {formatCurrency(unpaid)}
                          </td>
                          <td className="p-3 text-right tabular-nums hidden md:table-cell align-top font-medium text-blue-700 dark:text-blue-300">
                            {formatCurrency(approved)}
                          </td>
                          <td className="p-3 text-right tabular-nums text-green-700 dark:text-green-400 font-medium align-top">
                            {formatCurrency(paid)}
                          </td>
                          <td className="p-3 pr-4 text-right align-top">
                            <div className="flex justify-end gap-1 flex-wrap">
                              {approved > 0 && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8 text-xs"
                                  onClick={() => openPay(affiliate)}
                                >
                                  <Wallet className="w-3.5 h-3.5 mr-1" />
                                  Pay
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                aria-label="Details"
                                onClick={() => openDetail(affiliate)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {affiliatesRes?.meta && affiliatesRes.meta.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2 tabular-nums">
              {page} / {affiliatesRes.meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() =>
                setPage((p) => Math.min(affiliatesRes.meta!.totalPages, p + 1))
              }
              disabled={page === affiliatesRes.meta.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={showPayDialog}
        onOpenChange={(open) => {
          setShowPayDialog(open);
          if (!open) {
            setPayTarget(null);
            setPaymentReference('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record payout</DialogTitle>
            <DialogDescription>
              This marks every <strong>approved</strong> commission for this partner as{' '}
              <strong>paid</strong> (bank transfer is done outside the app).
            </DialogDescription>
          </DialogHeader>
          {payTarget && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <p className="font-medium">
                  {payTarget.firstName} {payTarget.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{payTarget.email}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approved (will mark paid)</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(payTarget.approvedCommission ?? 0)}
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-ref">Payment reference (optional)</Label>
                <Input
                  id="pay-ref"
                  placeholder="e.g. bank ref, Wise ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                payTarget &&
                payMutation.mutate({
                  affiliateId: payTarget._id,
                  paymentReference: paymentReference || undefined,
                })
              }
              disabled={
                payMutation.isPending ||
                !payTarget ||
                (payTarget.approvedCommission ?? 0) <= 0
              }
            >
              {payMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDetailDialog}
        onOpenChange={(open) => {
          setShowDetailDialog(open);
          if (!open) setDetailTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>Referral partner account</DialogTitle>
            <DialogDescription>
              Login profile, onboarding / payout details from their application, and commission
              totals.
            </DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <>
              <div className="flex items-center justify-between gap-2 px-6 pb-2 shrink-0">
                <p className="text-sm font-medium">
                  {detailTarget.firstName} {detailTarget.lastName}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8"
                  disabled={!bankDetailsCopyText.trim()}
                  onClick={() => {
                    void navigator.clipboard.writeText(bankDetailsCopyText);
                    toast({ title: 'Copied', description: 'Bank details' });
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy bank details
                </Button>
              </div>
              <div className="px-6 overflow-y-auto flex-1 min-h-0 pb-2 space-y-4 text-sm">
                {detailLoading && (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                )}
                {detailError && (
                  <p className="text-sm text-destructive py-2">
                    Could not load account details. Try again.
                  </p>
                )}
                {!detailLoading && affiliateDetailsRes && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Account
                      </p>
                      <div className="rounded-lg border bg-muted/20">
                        <DetailField label="Email" value={affiliateDetailsRes.user.email ?? ''} />
                        <DetailField
                          label="Phone"
                          value={affiliateDetailsRes.user.phoneNumber ?? ''}
                        />
                        <DetailField label="User ID" value={affiliateDetailsRes.user._id ?? ''} />
                        <div className="flex items-start gap-2 py-2 px-3 border-b border-border/50">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Email verified</p>
                            <p className="text-sm font-medium">
                              {affiliateDetailsRes.user.isEmailVerified ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                        {affiliateDetailsRes.user.referralPartnerTermsAcceptedAt && (
                          <DetailField
                            label="Terms accepted at"
                            value={formatDate(affiliateDetailsRes.user.referralPartnerTermsAcceptedAt)}
                          />
                        )}
                        {affiliateDetailsRes.user.referralPartnerTermsVersion && (
                          <DetailField
                            label="Terms version"
                            value={affiliateDetailsRes.user.referralPartnerTermsVersion}
                          />
                        )}
                      </div>
                    </div>

                    {affiliateDetailsRes.referralPartnerOnboarding && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Referral partner application
                        </p>
                        <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-muted font-medium capitalize">
                              {affiliateDetailsRes.referralPartnerOnboarding.status}
                            </span>
                            <span className="text-muted-foreground">
                              {affiliateDetailsRes.referralPartnerOnboarding.businessType}
                            </span>
                          </div>
                          {affiliateDetailsRes.referralPartnerOnboarding.categories.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {affiliateDetailsRes.referralPartnerOnboarding.categories.join(', ')}
                            </p>
                          )}
                          <div className="border-t border-border/60 pt-2 space-y-0 overflow-hidden rounded-md">
                            {orderedBusinessInfoKeys(
                              affiliateDetailsRes.referralPartnerOnboarding.businessInfo || {}
                            ).map((key) => {
                              const value = renderUnknown(
                                affiliateDetailsRes.referralPartnerOnboarding?.businessInfo[key]
                              );
                              const label = toLabel(key);
                              if (isBankDetailKey(key)) {
                                return (
                                  <CopyableField key={key} label={label} value={value} />
                                );
                              }
                              return <DetailField key={key} label={label} value={value} />;
                            })}
                          </div>
                          {affiliateDetailsRes.referralPartnerOnboarding.rejectionReason && (
                            <p className="text-xs text-destructive pt-1">
                              {affiliateDetailsRes.referralPartnerOnboarding.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {!affiliateDetailsRes.referralPartnerOnboarding && (
                      <p className="text-xs text-muted-foreground">
                        No referral partner onboarding record on file (legacy affiliate or not yet
                        submitted).
                      </p>
                    )}
                  </>
                )}

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Commissions (this list)
                  </p>
                  <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Referrals</p>
                      <p className="font-medium tabular-nums">{detailTarget.totalReferrals ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unpaid</p>
                      <p className="font-medium tabular-nums text-amber-700 dark:text-amber-400">
                        {formatCurrency(detailTarget.unpaidCommission ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Approved</p>
                      <p className="font-medium tabular-nums text-blue-700 dark:text-blue-300">
                        {formatCurrency(detailTarget.approvedCommission ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="font-medium tabular-nums text-green-700 dark:text-green-400">
                        {formatCurrency(detailTarget.paidCommission ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Affiliate codes
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(detailTarget.affiliateCodes ?? []).map((c) => (
                      <span
                        key={c._id}
                        className="inline-flex items-center px-2 py-1 bg-muted rounded text-xs font-mono"
                      >
                        {c.code}
                      </span>
                    ))}
                    {(detailTarget.affiliateCodes ?? []).length === 0 && (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
