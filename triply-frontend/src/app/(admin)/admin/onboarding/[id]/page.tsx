'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Briefcase,
  User,
  FileText,
  Package,
  ExternalLink,
  Trash2,
} from 'lucide-react';
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
import api from '@/lib/api/axios';
import {
  adminOnboardingApi,
  getOnboardingDocumentUrl,
  type MerchantOnboardingApplication,
  type OnboardingStatus,
} from '@/lib/api/adminOnboarding';
import { useAuth } from '@/context/AuthContext';

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

function needsReview(status: OnboardingStatus): boolean {
  return status === 'pending' || status === 'reapplied';
}

function getPreviousOnboardingId(
  prev: MerchantOnboardingApplication['previousApplicationId']
): string | null {
  if (!prev) return null;
  if (typeof prev === 'string') return prev;
  if (typeof prev === 'object' && '_id' in prev && typeof prev._id === 'string') return prev._id;
  return null;
}

function isImagePath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
}

function isPdfPath(path: string): boolean {
  return path.toLowerCase().endsWith('.pdf');
}

function toLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function renderUnknown(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value.trim() || '—';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          return String(item);
        }
        return JSON.stringify(item);
      })
      .join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return '—';
}

/** Renders document: image as thumbnail (fetched with auth) or PDF as "Open" link that fetches blob and opens in new tab */
function DocumentView({
  docKey,
  filePath,
  applicationId,
  approved,
  onApprove,
}: {
  docKey: string;
  filePath: string;
  applicationId: string;
  approved: boolean;
  onApprove: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [openingPdf, setOpeningPdf] = useState(false);
  const blobUrlRef = useRef<string | null>(null);
  const isImage = isImagePath(filePath);
  const isPdf = isPdfPath(filePath);

  useEffect(() => {
    if (!isImage || !applicationId || !docKey) return;
    const url = getOnboardingDocumentUrl(applicationId, docKey);
    api
      .get(url, { responseType: 'blob' })
      .then((res) => {
        const blob = res.data as Blob;
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;
        setImageUrl(blobUrl);
      })
      .catch(() => setImageError(true));
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [applicationId, docKey, isImage]);

  const handleOpenPdf = () => {
    setOpeningPdf(true);
    const url = getOnboardingDocumentUrl(applicationId, docKey);
    api
      .get(url, { responseType: 'blob' })
      .then((res) => {
        const blob = res.data as Blob;
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      })
      .catch(() => {
        // toast or silent
      })
      .finally(() => setOpeningPdf(false));
  };

  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border rounded-md p-3">
      <div className="flex items-start gap-3">
        {isImage && (
          <div className="flex-shrink-0">
            {imageUrl && (
              <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={imageUrl}
                  alt={docKey}
                  className="h-20 w-20 rounded-md object-cover border border-border"
                />
              </a>
            )}
            {imageError && (
              <div className="h-20 w-20 rounded-md border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Failed to load
              </div>
            )}
            {!imageUrl && !imageError && (
              <div className="h-20 w-20 rounded-md border border-border bg-muted flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
        <div className="text-sm space-y-1">
          <div className="font-semibold">{docKey}</div>
          {isPdf && (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-primary"
              onClick={handleOpenPdf}
              disabled={openingPdf}
            >
              {openingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1 inline" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-1 inline" />
              )}
              Open PDF
            </Button>
          )}
          {isImage && imageUrl && (
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">
              Open image in new tab
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {approved && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Approved
          </span>
        )}
        <Button
          size="sm"
          variant={approved ? 'outline' : 'secondary'}
          disabled={approved}
          onClick={onApprove}
        >
          {approved ? 'Approved' : 'Approve'}
        </Button>
      </div>
    </li>
  );
}

export default function AdminOnboardingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [approvedDocKeys, setApprovedDocKeys] = useState<string[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: application, isLoading, error } = useQuery({
    queryKey: ['admin-onboarding-detail', id],
    queryFn: () => adminOnboardingApi.getById(id),
    enabled: !!id && isAuthenticated && user?.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: () => adminOnboardingApi.approve(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-onboarding'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-onboarding-detail', id] });
      await queryClient.refetchQueries({ queryKey: ['admin-onboarding'] });
      toast({ title: 'Application approved' });
      router.push('/admin/onboarding');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Failed to approve', description: msg, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason?: string) => adminOnboardingApi.reject(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-onboarding'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-onboarding-detail', id] });
      await queryClient.refetchQueries({ queryKey: ['admin-onboarding'] });
      setRejectOpen(false);
      setRejectionReason('');
      toast({
        title: 'Application rejected',
        description: 'The applicant has been notified by email.',
      });
      router.push('/admin/onboarding');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Failed to reject', description: msg, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminOnboardingApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-onboarding'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-onboarding-detail', id] });
      await queryClient.refetchQueries({ queryKey: ['admin-onboarding'] });
      toast({ title: 'Application deleted' });
      router.push('/admin/onboarding');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Failed to delete', description: msg, variant: 'destructive' });
    },
  });

  const handleRejectSubmit = () => {
    rejectMutation.mutate(rejectionReason.trim() || undefined);
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <p className="text-muted-foreground">Invalid application ID.</p>
          <Link href="/admin/onboarding" className="text-primary hover:underline mt-2 inline-block">
            Back to onboarding list
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
          <Link href="/admin/onboarding" className="text-primary hover:underline mt-2 inline-block">
            Back to onboarding list
          </Link>
        </div>
      </div>
    );
  }

  const app = application as MerchantOnboardingApplication;
  const previousOnboardingId = getPreviousOnboardingId(app.previousApplicationId);
  const biz = (app.businessInfo || {}) as Record<string, unknown>;
  const knownBusinessKeys = new Set([
    'businessName',
    'contactPerson',
    'designation',
    'phone',
    'emirate',
    'website',
    'bankName',
    'accountHolderName',
    'accountNumber',
    'vatTrn',
    'currency',
    'email',
  ]);
  const extraBusinessEntries = Object.entries(biz).filter(([key]) => !knownBusinessKeys.has(key));

  return (
    <div className="min-h-screen bg-muted/30 py-6">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <Link
            href="/admin/onboarding"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Merchant Onboarding
          </Link>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold">Application details</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {(app.userId as { firstName?: string; lastName?: string })?.firstName}{' '}
                  {(app.userId as { lastName?: string })?.lastName} · {biz.businessName as string}
                </p>
              </div>
              {getStatusBadge(app.status)}
            </div>

            {app.status === 'reapplied' && (
              <div className="rounded-md border border-violet-200 bg-violet-50 dark:bg-violet-950/30 p-3 text-sm">
                <p className="font-medium text-violet-900 dark:text-violet-100">Resubmission</p>
                <p className="text-muted-foreground mt-0.5">
                  This is a new application after a previous rejection.
                  {previousOnboardingId && (
                    <>
                      {' '}
                      <Link
                        href={`/admin/onboarding/${previousOnboardingId}`}
                        className="text-primary underline font-medium"
                      >
                        View previous application
                      </Link>
                    </>
                  )}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <User className="h-4 w-4" /> Contact
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Applicant email</span>
                <span>{(app.userId as { email?: string })?.email}</span>
                <span>Applicant phone</span>
                <span>{(app.userId as { phoneNumber?: string })?.phoneNumber || '—'}</span>
                <span>Business email</span>
                <span>{(biz.email as string) || '—'}</span>
                <span>Business name</span>
                <span>{biz.businessName as string}</span>
                <span>Contact person</span>
                <span>{biz.contactPerson as string}</span>
                <span>Designation</span>
                <span>{biz.designation as string}</span>
                <span>Phone</span>
                <span>{biz.phone as string}</span>
                <span>Emirate</span>
                <span>{biz.emirate as string}</span>
                <span>Website</span>
                <span>
                  {biz.website ? (
                    <a
                      href={String(biz.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      {String(biz.website)}
                    </a>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              {extraBusinessEntries.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {extraBusinessEntries.map(([key, value]) => (
                    <div key={key} className="contents">
                      <span>{toLabel(key)}</span>
                      <span className="break-words">{renderUnknown(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4" /> Business
              </h4>
              <p className="text-sm text-muted-foreground">
                Type: {app.businessType} · Categories: {app.categories?.join(', ')}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Bank name</span>
                <span>{biz.bankName as string}</span>
                <span>Account holder</span>
                <span>{biz.accountHolderName as string}</span>
                <span>Account number</span>
                <span className="font-mono text-xs break-all">
                  {(biz.accountNumber ?? biz.iban) as string}
                </span>
                <span>VAT / TRN</span>
                <span>{(biz.vatTrn as string) || '—'}</span>
                <span>Currency</span>
                <span>{biz.currency as string}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" /> Documents
              </h4>
              {Object.keys(app.documentPaths || {}).length > 0 ? (
                <ul className="space-y-3">
                  {Object.entries(app.documentPaths).map(([key, rawPath]) => {
                    const path = typeof rawPath === 'string' ? rawPath : '';
                    return (
                      <DocumentView
                        key={key}
                        docKey={key}
                        filePath={path}
                        applicationId={app._id}
                        approved={approvedDocKeys.includes(key)}
                        onApprove={() =>
                          setApprovedDocKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
                        }
                      />
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              )}
            </div>

            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Package className="h-4 w-4" /> Services ({app.services?.length ?? 0})
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {app.services?.map((s, i) => (
                  <li key={i} className="border border-border rounded-md p-3">
                    <div className="font-medium text-foreground">
                      {s.title}{' '}
                      {s.price != null && (
                        <span className="text-xs font-normal">
                          — {(s.price as number)?.toLocaleString?.()} {(biz.currency as string) || 'AED'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-1 space-y-0.5">
                      {s.duration && (
                        <p>
                          <span className="font-semibold">Duration:</span> {s.duration}
                        </p>
                      )}
                      {s.groupSize && (
                        <p>
                          <span className="font-semibold">Group size:</span> {s.groupSize}
                        </p>
                      )}
                      {s.languages && (
                        <p>
                          <span className="font-semibold">Languages:</span> {s.languages}
                        </p>
                      )}
                      {s.description && (
                        <p>
                          <span className="font-semibold">Description:</span> {s.description}
                        </p>
                      )}
                      {s.includes && (
                        <p>
                          <span className="font-semibold">Includes:</span> {s.includes}
                        </p>
                      )}
                      {s.excludes && (
                        <p>
                          <span className="font-semibold">Excludes:</span> {s.excludes}
                        </p>
                      )}
                      {Object.entries(s as Record<string, unknown>)
                        .filter(([key]) => !['title', 'price', 'duration', 'groupSize', 'languages', 'description', 'includes', 'excludes'].includes(key))
                        .map(([key, value]) => (
                          <p key={key}>
                            <span className="font-semibold">{toLabel(key)}:</span> {renderUnknown(value)}
                          </p>
                        ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {app.status === 'rejected' && app.rejectionReason && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="font-medium text-destructive">Rejection reason</p>
                <p className="text-muted-foreground text-sm mt-1">{app.rejectionReason}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Submitted {formatDate(app.createdAt)}
            </p>

            {needsReview(app.status) && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                <Button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Approve application
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={rejectMutation.isPending}>
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
  );
}
