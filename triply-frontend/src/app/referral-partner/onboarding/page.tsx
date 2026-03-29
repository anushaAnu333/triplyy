'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, CheckCircle2, Loader2, Briefcase, UserCircle, FileUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { EMIRATES, CURRENCIES } from '@/lib/merchant-onboarding/constants';
import { referralPartnerBusinessInfoSchema } from '@/lib/referral-partner-onboarding/validation';
import type { BusinessInfo, BusinessType } from '@/lib/merchant-onboarding/types';
import {
  REFERRAL_PROMOTION_CATEGORIES,
  REFERRAL_PROFILE_TYPES,
  type ReferralPartnerProfileType,
} from '@/lib/referral-partner-onboarding/constants';
import {
  getReferralPartnerDocuments,
  areReferralPartnerDocumentsComplete,
} from '@/lib/referral-partner-onboarding/documents';
import { affiliatesApi } from '@/lib/api/affiliates';
import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Profile type', icon: Briefcase },
  { num: 2, label: 'Your details', icon: UserCircle },
  { num: 3, label: 'Documents', icon: FileUp },
];

const defaultBusinessInfo: Partial<BusinessInfo> = {
  businessName: '',
  contactPerson: '',
  designation: '',
  email: '',
  phone: '',
  emirate: '',
  website: '',
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  currency: 'AED',
};

export default function ReferralPartnerOnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<ReferralPartnerProfileType | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [businessInfo, setBusinessInfo] = useState<Partial<BusinessInfo>>(defaultBusinessInfo);
  const [documents, setDocuments] = useState<Record<string, { file: File | null; uploaded: boolean }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsReady, setTermsReady] = useState(false);
  const [showStep2Errors, setShowStep2Errors] = useState(false);

  useEffect(() => {
    if (!businessType) return;
    const docs = getReferralPartnerDocuments(businessType);
    setDocuments((prev) => {
      const next = { ...prev };
      docs.forEach((d) => {
        if (!(d.id in next)) next[d.id] = { file: null, uploaded: false };
      });
      return next;
    });
  }, [businessType]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    if (user?.role === 'affiliate') return;
    if (user?.referralPartnerTermsAcceptedAt) {
      setTermsReady(true);
    } else {
      router.replace('/referral-partner/terms');
    }
  }, [authLoading, isAuthenticated, user?.role, user?.referralPartnerTermsAcceptedAt, router]);

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const canProceedStep1 = businessType !== null && categories.length > 0;
  const step2Result = useMemo(() => referralPartnerBusinessInfoSchema.safeParse(businessInfo), [businessInfo]);
  const canProceedStep2 = () => step2Result.success;
  const step2Errors = !step2Result.success && step2Result.error?.errors
    ? step2Result.error.errors.map((e) => `${e.path[0]}: ${e.message}`).slice(0, 3)
    : [];
  const canProceedStep3 = useMemo(
    () => (businessType ? areReferralPartnerDocumentsComplete(businessType, documents) : false),
    [businessType, documents]
  );
  const docsForBusinessType = useMemo(
    () => (businessType ? getReferralPartnerDocuments(businessType) : []),
    [businessType]
  );

  useEffect(() => {
    if (step === 2 && step2Result.success && showStep2Errors) {
      setShowStep2Errors(false);
    }
  }, [step, step2Result.success, showStep2Errors]);

  const handleDocUpload = (docId: string, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [docId]: { file, uploaded: !!file } }));
  };

  const goNext = () => {
    if (step === 1 && !canProceedStep1) {
      toast({ title: 'Select type and at least one category', variant: 'destructive' });
      return;
    }
    if (step === 2 && !canProceedStep2()) {
      setShowStep2Errors(true);
      toast({ title: 'Please complete all required details', variant: 'destructive' });
      return;
    }
    if (step === 2) setShowStep2Errors(false);
    if (step === 3 && !canProceedStep3) {
      toast({ title: 'Please upload all required documents', variant: 'destructive' });
      return;
    }
    if (step < 3) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const infoResult = referralPartnerBusinessInfoSchema.safeParse(businessInfo);
    if (!infoResult.success || !businessType) {
      toast({ title: 'Validation error', description: 'Complete all steps correctly.', variant: 'destructive' });
      return;
    }
    if (!canProceedStep3) {
      toast({ title: 'Upload required documents', variant: 'destructive' });
      return;
    }
    const docsRecord: Record<string, File> = {};
    Object.entries(documents).forEach(([k, v]) => {
      if (v.file) docsRecord[k] = v.file;
    });
    setIsSubmitting(true);
    try {
      await affiliatesApi.submitReferralPartnerOnboarding({
        businessType: businessType as BusinessType,
        categories,
        businessInfo: infoResult.data as BusinessInfo,
        documents: docsRecord,
      });
      setStep(4);
      toast({ title: 'Application submitted', description: 'Our team will review your details.' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Submission failed';
      toast({ title: 'Submission failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login?redirect=/referral-partner/terms');
    return null;
  }

  if (user?.role === 'affiliate') {
    router.push('/affiliate/dashboard');
    return null;
  }

  if (user?.role !== 'user') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground text-center max-w-md">
          Referral partner onboarding is only available for standard accounts. Please contact support if you need help.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Home</Link>
        </Button>
      </div>
    );
  }

  if (!termsReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4 pt-24 pb-14">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/referral-partner" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="text-center mb-8">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            TR✨PLY Referral Partner
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-2">
            Complete your application
          </h1>
        
        </div>

        <div className="flex items-center w-full mb-2 px-2">
          {STEPS.map((s, index) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            const isUpcoming = step < s.num;
            return (
              <div key={s.num} className="flex flex-1 items-center">
                {index > 0 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 min-w-[10px] rounded-full',
                      step >= s.num ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}
                <button
                  type="button"
                  onClick={() => step < 4 && setStep(s.num)}
                  className={cn(
                    'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors border-2 shadow-sm',
                    isCompleted && 'bg-primary text-primary-foreground border-primary',
                    isActive && 'bg-primary text-primary-foreground border-primary ring-4 ring-primary/15',
                    isUpcoming && 'bg-background text-muted-foreground border-border'
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 min-w-[10px] rounded-full',
                      step > s.num ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between px-2 mb-8">
          {STEPS.map((s) => (
            <span
              key={s.num}
              className={cn(
                'flex-1 text-center text-xs font-medium',
                step >= s.num ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {s.label}
            </span>
          ))}
        </div>

        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm text-foreground">Your profile type *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                    {REFERRAL_PROFILE_TYPES.map(({ type, label }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBusinessType(type)}
                        className={cn(
                          'rounded-xl border bg-background px-3 py-3 text-sm text-left transition-colors',
                          businessType === type
                            ? 'border-primary ring-1 ring-primary bg-primary/10 text-foreground'
                            : 'border-border text-foreground hover:bg-muted/50'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Documents</p>
                  <p>
                    UAE Freelancer: Emirates ID and proof of address or bank statement. International: valid passport and
                    proof of address or bank statement.
                  </p>
                </div>
                <div className="space-y-1.5 sm:space-y-2 pt-4 border-t border-border">
                  <Label className="text-sm text-foreground">What will you promote? *</Label>
                  <p className="text-xs text-muted-foreground">Select at least one category</p>
                  <div className="flex flex-wrap gap-2">
                    {REFERRAL_PROMOTION_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm transition-colors',
                          categories.includes(cat)
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-background text-foreground hover:bg-muted/50'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm font-medium text-foreground border-b border-border pb-2">Contact &amp; payout details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 space-y-1.5 sm:space-y-2">
                    <Label htmlFor="businessName" className="text-sm text-foreground">
                      Name *
                    </Label>
                    <Input
                      id="businessName"
                      value={businessInfo.businessName ?? ''}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, businessName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="contactPerson" className="text-sm text-foreground">
                      Contact person *
                    </Label>
                    <Input
                      id="contactPerson"
                      value={businessInfo.contactPerson ?? ''}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, contactPerson: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="designation" className="text-sm text-foreground">
                      Designation *
                    </Label>
                    <Input
                      id="designation"
                      value={businessInfo.designation ?? ''}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, designation: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="phone" className="text-sm text-foreground">
                      Mobile *
                    </Label>
                    <Input
                      id="phone"
                      value={businessInfo.phone ?? ''}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-sm text-foreground">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={businessInfo.email ?? ''}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm text-foreground">Emirates / City *</Label>
                    <Select
                      value={businessInfo.emirate ?? ''}
                      onValueChange={(v) => setBusinessInfo((p) => ({ ...p, emirate: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMIRATES.map((e) => (
                          <SelectItem key={e} value={e}>
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="website" className="text-sm">
                      Website (optional)
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={businessInfo.website ?? ''}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, website: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground border-b border-border pb-2 pt-4">Bank details (for payouts)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="bankName" className="text-sm text-foreground">
                      Bank name *
                    </Label>
                    <Input
                      id="bankName"
                      value={businessInfo.bankName ?? ''}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, bankName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="accountHolderName" className="text-sm text-foreground">
                      Account holder *
                    </Label>
                    <Input
                      id="accountHolderName"
                      value={businessInfo.accountHolderName ?? ''}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, accountHolderName: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5 sm:space-y-2">
                    <Label htmlFor="accountNumber" className="text-sm text-foreground">
                      Account number *
                    </Label>
                    <Input
                      id="accountNumber"
                      value={businessInfo.accountNumber ?? ''}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, accountNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm text-foreground">Currency *</Label>
                    <Select
                      value={businessInfo.currency ?? 'AED'}
                      onValueChange={(v) => setBusinessInfo((p) => ({ ...p, currency: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 3 && businessType && (
              <>
                <p className="text-sm font-medium text-foreground border-b border-border pb-2">Required documents</p>
                <p className="text-xs text-muted-foreground">PDF, JPG or PNG. Max 10MB per file.</p>
                <div className="space-y-3">
                  {docsForBusinessType.map((doc) => (
                    <div
                      key={doc.id}
                      className={cn(
                        'space-y-1.5 rounded-md border border-input p-3',
                        doc.required && 'border-l-4 border-l-primary'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-sm">{doc.label}</Label>
                        <span className="text-xs text-muted-foreground">{doc.required ? 'Required' : 'Optional'}</span>
                      </div>
                      <label className="flex flex-col items-center justify-center w-full min-h-[80px] rounded-md border border-dashed border-input bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocUpload(doc.id, e.target.files?.[0] ?? null)}
                        />
                        {documents[doc.id]?.uploaded ? (
                          <div className="flex items-center gap-2 text-sm text-primary py-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {documents[doc.id].file?.name ?? 'Uploaded'}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground text-sm py-2">
                            <Upload className="h-5 w-5" />
                            <span>Click to upload</span>
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <p className="text-sm font-medium text-foreground">Application submitted</p>
                <p className="text-sm text-muted-foreground">
                  We will verify your documents and payout details. You will receive your referral code after approval.
                </p>
                <Button asChild className="mt-2">
                  <Link href="/referral-partner">Back to Referral Partner</Link>
                </Button>
              </div>
            )}
          </CardContent>

          {step < 4 && (
            <CardFooter className="flex flex-col gap-3 p-6 sm:p-8 pt-6 border-t border-border bg-card">
              {step === 2 && showStep2Errors && step2Errors.length > 0 && (
                <p className="text-sm text-destructive">Please complete all required fields.</p>
              )}
              <div className="flex flex-row justify-between gap-4">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={goBack}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={
                      (step === 1 && !canProceedStep1) ||
                      (step === 2 && !canProceedStep2()) ||
                      (step === 3 && !canProceedStep3)
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={!canProceedStep3 || isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit application
                  </Button>
                )}
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
