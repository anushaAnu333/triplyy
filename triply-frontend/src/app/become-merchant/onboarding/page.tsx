'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, CheckCircle2, Loader2, Briefcase, UserCircle, FileUp, Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  SERVICE_CATEGORIES,
  EMIRATES,
  CURRENCIES,
  MIN_SERVICE_IMAGES,
} from '@/lib/merchant-onboarding/constants';
import {
  getDocumentsForBusinessType,
  areRequiredDocumentsUploaded,
} from '@/lib/merchant-onboarding/documentGenerator';
import {
  validateServiceItem,
  businessInfoSchema,
} from '@/lib/merchant-onboarding/validation';
import type { BusinessType, BusinessInfo, ServiceItem, ServicePointGroup } from '@/lib/merchant-onboarding/types';
import { submitMerchantOnboarding } from '@/lib/api/merchantOnboarding';
import { hasMerchantTcAccepted } from '@/lib/merchant-onboarding/merchantTc';
import { MerchantOnboardingServicesStep } from '@/components/merchant/MerchantOnboardingServicesStep';
import { cn } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Business Type', icon: Briefcase },
  { num: 2, label: 'Business Info', icon: UserCircle },
  { num: 3, label: 'Documents', icon: FileUp },
  { num: 4, label: 'Services', icon: Package },
];

const BUSINESS_TYPES: { type: BusinessType; label: string }[] = [
  { type: 'uae-company', label: 'UAE Company' },
  { type: 'freelancer', label: 'UAE Freelancer' },
  { type: 'international', label: 'International Business' },
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
  vatTrn: '',
  currency: 'AED',
};

function createEmptyService(): ServiceItem {
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    title: '',
    price: '',
    duration: '',
    groupSize: '',
    languages: '',
    description: '',
    pointsHeading: '',
    pointGroups: [{ text: '', subPoints: [] }],
    includes: [''],
    excludes: [''],
    images: [],
  };
}

export default function MerchantOnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [businessInfo, setBusinessInfo] = useState<Partial<BusinessInfo>>(defaultBusinessInfo);
  const [documents, setDocuments] = useState<Record<string, { file: File | null; uploaded: boolean }>>({});
  const [services, setServices] = useState<ServiceItem[]>([createEmptyService()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const serviceImageUploadRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [serviceOpenSections, setServiceOpenSections] = useState<Record<string, { basic: boolean; points: boolean; includedExcluded: boolean; images: boolean }>>({});
  const [merchantTcReady, setMerchantTcReady] = useState(false);
  const [showStep2Errors, setShowStep2Errors] = useState(false);

  const progressPercent = (step / 5) * 100;

  useEffect(() => {
    if (!businessType) return;
    const docs = getDocumentsForBusinessType(businessType);
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
    if (user?.role === 'merchant') return;
    if (user?.merchantTermsAcceptedAt || hasMerchantTcAccepted()) {
      setMerchantTcReady(true);
    } else {
      router.replace('/become-merchant/terms');
    }
  }, [authLoading, isAuthenticated, user?.role, user?.merchantTermsAcceptedAt, router]);

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const canProceedStep1 = businessType !== null && categories.length > 0;
  const step2Result = useMemo(() => businessInfoSchema.safeParse(businessInfo), [businessInfo]);
  const canProceedStep2 = () => step2Result.success;
  const step2Errors = !step2Result.success && step2Result.error?.errors
    ? step2Result.error.errors.map((e) => `${e.path[0]}: ${e.message}`).slice(0, 3)
    : [];
  const canProceedStep3 = useMemo(
    () => (businessType ? areRequiredDocumentsUploaded(businessType, documents) : false),
    [businessType, documents]
  );
  const canProceedStep4 = useMemo(() => {
    if (services.length === 0) return false;
    return services.every((s) => validateServiceItem(s).success && s.images.length >= MIN_SERVICE_IMAGES);
  }, [services]);
  const docsForBusinessType = useMemo(
    () => (businessType ? getDocumentsForBusinessType(businessType) : []),
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

  const addService = () => setServices((prev) => [...prev, createEmptyService()]);
  const removeService = (id: string) => {
    if (services.length <= 1) return;
    setServices((prev) => prev.filter((s) => s.id !== id));
  };
  const updateService = (id: string, patch: Partial<ServiceItem>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const setServiceImages = (id: string, files: File[]) => updateService(id, { images: files });

  const getServiceSections = (id: string) =>
    serviceOpenSections[id] ?? { basic: true, points: false, includedExcluded: false, images: true };
  const toggleServiceSection = (id: string, key: keyof ReturnType<typeof getServiceSections>) => {
    setServiceOpenSections((prev) => {
      const current = prev[id] ?? { basic: true, points: false, includedExcluded: false, images: true };
      return { ...prev, [id]: { ...current, [key]: !current[key] } };
    });
  };

  const setServicePointGroups = (id: string, pointGroups: ServicePointGroup[]) =>
    updateService(id, { pointGroups });

  const addServicePoint = (id: string) => {
    const svc = services.find((s) => s.id === id);
    const groups = svc?.pointGroups?.length ? svc.pointGroups : [{ text: '', subPoints: [] }];
    setServicePointGroups(id, [...groups, { text: '', subPoints: [] }]);
  };

  const removeServicePoint = (id: string, index: number) => {
    const svc = services.find((s) => s.id === id);
    const groups = (svc?.pointGroups ?? []).filter((_, i) => i !== index);
    setServicePointGroups(id, groups.length ? groups : [{ text: '', subPoints: [] }]);
  };

  const setServicePointText = (id: string, index: number, text: string) => {
    const svc = services.find((s) => s.id === id);
    const groups = [...(svc?.pointGroups ?? [{ text: '', subPoints: [] }])];
    if (!groups[index]) groups[index] = { text: '', subPoints: [] };
    groups[index] = { ...groups[index], text };
    setServicePointGroups(id, groups);
  };

  const addServiceSubPoint = (id: string, index: number) => {
    const svc = services.find((s) => s.id === id);
    const groups = [...(svc?.pointGroups ?? [{ text: '', subPoints: [] }])];
    if (!groups[index]) groups[index] = { text: '', subPoints: [] };
    groups[index] = { ...groups[index], subPoints: [...(groups[index].subPoints || []), ''] };
    setServicePointGroups(id, groups);
  };

  const setServiceSubPoint = (id: string, index: number, subIndex: number, value: string) => {
    const svc = services.find((s) => s.id === id);
    const groups = [...(svc?.pointGroups ?? [{ text: '', subPoints: [] }])];
    if (!groups[index]) groups[index] = { text: '', subPoints: [] };
    const sub = [...(groups[index].subPoints || [])];
    sub[subIndex] = value;
    groups[index] = { ...groups[index], subPoints: sub };
    setServicePointGroups(id, groups);
  };

  const removeServiceSubPoint = (id: string, index: number, subIndex: number) => {
    const svc = services.find((s) => s.id === id);
    const groups = [...(svc?.pointGroups ?? [{ text: '', subPoints: [] }])];
    if (!groups[index]) groups[index] = { text: '', subPoints: [] };
    const sub = (groups[index].subPoints || []).filter((_, i) => i !== subIndex);
    groups[index] = { ...groups[index], subPoints: sub };
    setServicePointGroups(id, groups);
  };

  const addServiceListItem = (id: string, key: 'includes' | 'excludes') => {
    const svc = services.find((s) => s.id === id);
    const arr = [...((svc?.[key] as string[]) ?? [])];
    updateService(id, { [key]: [...arr, ''] } as Partial<ServiceItem>);
  };

  const setServiceListItem = (id: string, key: 'includes' | 'excludes', index: number, value: string) => {
    const svc = services.find((s) => s.id === id);
    const arr = [...((svc?.[key] as string[]) ?? [''])];
    arr[index] = value;
    updateService(id, { [key]: arr } as Partial<ServiceItem>);
  };

  const removeServiceListItem = (id: string, key: 'includes' | 'excludes', index: number) => {
    const svc = services.find((s) => s.id === id);
    const arr = (((svc?.[key] as string[]) ?? [])).filter((_, i) => i !== index);
    updateService(id, { [key]: arr.length ? arr : [''] } as Partial<ServiceItem>);
  };

  const goNext = () => {
    if (step === 1 && !canProceedStep1) {
      toast({ title: 'Select merchant type and at least one category', variant: 'destructive' });
      return;
    }
    if (step === 2 && !canProceedStep2()) {
      setShowStep2Errors(true);
      toast({ title: 'Please complete all required business details', variant: 'destructive' });
      return;
    }
    if (step === 2) {
      setShowStep2Errors(false);
    }
    if (step === 3 && !canProceedStep3) {
      toast({ title: 'Please upload all required documents', variant: 'destructive' });
      return;
    }
    if (step === 4 && !canProceedStep4) {
      toast({
        title: 'Add at least one service with required fields and minimum images',
        variant: 'destructive',
      });
      return;
    }
    if (step < 5) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const infoResult = businessInfoSchema.safeParse(businessInfo);
    if (!infoResult.success || !businessType) {
      toast({
        title: 'Validation error',
        description: 'Please complete all steps correctly.',
        variant: 'destructive',
      });
      return;
    }
    const docsRecord: Record<string, File> = {};
    Object.entries(documents).forEach(([k, v]) => {
      if (v.file) docsRecord[k] = v.file;
    });
    const servicesPayload = services
      .filter((s) => validateServiceItem(s).success && s.images.length >= MIN_SERVICE_IMAGES)
      .map((s) => ({
        title: s.title,
        price: parseFloat(s.price) || 0,
        duration: s.duration,
        groupSize: s.groupSize ? parseInt(s.groupSize, 10) : null,
        languages: s.languages,
        description: s.description,
        pointsHeading: s.pointsHeading?.trim() || undefined,
        pointGroups: (s.pointGroups || []).filter((g) => (g.text || '').trim() || (g.subPoints || []).some((sp) => (sp || '').trim())),
        includes: (s.includes || []).map((x) => x.trim()).filter(Boolean).join('\n'),
        excludes: (s.excludes || []).map((x) => x.trim()).filter(Boolean).join('\n'),
        images: s.images,
      }));
    if (servicesPayload.length === 0) {
      toast({ title: 'Add at least one valid service with images', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitMerchantOnboarding({
        businessType,
        categories,
        businessInfo: infoResult.data as BusinessInfo,
        documents: docsRecord,
        services: servicesPayload,
      });
      setStep(5);
      toast({ title: 'Application submitted', description: 'Our team will review your application.' });
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
    router.push('/login?redirect=/become-merchant/terms');
    return null;
  }

  if (user?.role === 'merchant') {
    router.push('/merchant/dashboard');
    return null;
  }

  if (!merchantTcReady) {
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
          <Link href="/become-merchant" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        {/* Heading outside card */}
        <div className="text-center mb-8">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            TR✨PLY Merchant Partner
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-2">
            Complete your onboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Fill in the details below to list your services on TRIPLY.
          </p>
        </div>

        {/* Progress stepper: circles with connecting lines, labels below */}
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
                  onClick={() => step < 5 && setStep(s.num)}
                  className={cn(
                    'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors border-2 shadow-sm',
                    isCompleted && 'bg-primary text-primary-foreground border-primary',
                    isActive && 'bg-primary text-primary-foreground border-primary ring-4 ring-primary/15',
                    isUpcoming && 'bg-background text-muted-foreground border-border'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
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
          {STEPS.map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            const isUpcoming = step < s.num;
            return (
              <span
                key={s.num}
                className={cn(
                  'flex-1 text-center text-xs font-medium',
                  isCompleted && 'text-primary',
                  isActive && 'text-primary',
                  isUpcoming && 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
            );
          })}
        </div>

        {/* Form card */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Step 1: Business Type + Categories */}
          {step === 1 && (
            <>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm text-foreground">What type of merchant are you? *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map(({ type, label }) => (
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
                <p className="font-medium text-foreground mb-1">Document requirements</p>
                <p>
                  UAE Company: Trade License + Emirates ID. Freelancer: Freelance Permit + Emirates ID.
                  International: Passport + Business registration.
                </p>
              </div>
              <div className="space-y-1.5 sm:space-y-2 pt-4 border-t border-border">
                <Label className="text-sm text-foreground">What services will you offer? *</Label>
                <p className="text-xs text-muted-foreground">Select at least one category</p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_CATEGORIES.map((cat) => (
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

          {/* Step 2: Business Info */}
          {step === 2 && (
            <>
              <p className="text-sm font-medium text-foreground border-b border-border pb-2">Business Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2 space-y-1.5 sm:space-y-2">
                  <Label htmlFor="businessName" className="text-sm text-foreground">Business / Trading Name *</Label>
                  <Input
                    id="businessName"
                    value={businessInfo.businessName ?? ''}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, businessName: e.target.value }))}
                    placeholder="e.g. Desert Dream Tours LLC"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="contactPerson" className="text-sm text-foreground">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={businessInfo.contactPerson ?? ''}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, contactPerson: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="designation" className="text-sm text-foreground">Designation *</Label>
                  <Input
                    id="designation"
                    value={businessInfo.designation ?? ''}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, designation: e.target.value }))}
                    placeholder="e.g. Owner, Manager"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="phone" className="text-sm text-foreground">Mobile *</Label>
                  <Input
                    id="phone"
                    value={businessInfo.phone ?? ''}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+971 XX XXX XXXX"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-sm text-foreground">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessInfo.email ?? ''}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, email: e.target.value }))}
                    placeholder="info@yourbusiness.com"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm text-foreground">Emirates / City *</Label>
                  <Select
                    value={businessInfo.emirate ?? ''}
                    onValueChange={(v) => setBusinessInfo((p) => ({ ...p, emirate: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select emirate" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMIRATES.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="website" className="text-sm">Website (optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    value={businessInfo.website ?? ''}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://yourbusiness.com"
                  />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground border-b border-border pb-2 pt-4">Bank Account Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="bankName" className="text-sm text-foreground">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={businessInfo.bankName ?? ''}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, bankName: e.target.value }))}
                    placeholder="e.g. Emirates NBD"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="accountHolderName" className="text-sm text-foreground">Account Holder Name *</Label>
                  <Input
                    id="accountHolderName"
                    value={businessInfo.accountHolderName ?? ''}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, accountHolderName: e.target.value }))}
                    placeholder="Must match trade license"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5 sm:space-y-2">
                  <Label htmlFor="accountNumber" className="text-sm text-foreground">Account number *</Label>
                  <Input
                    id="accountNumber"
                    value={businessInfo.accountNumber ?? ''}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, accountNumber: e.target.value }))}
                    placeholder="e.g. 1234567890123456"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="vatTrn" className="text-sm">VAT / TRN (optional)</Label>
                  <Input
                    id="vatTrn"
                    value={businessInfo.vatTrn ?? ''}
                    onChange={(e) => setBusinessInfo((p) => ({ ...p, vatTrn: e.target.value }))}
                    placeholder="If VAT registered"
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
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Documents */}
          {step === 3 && businessType && (
            <>
              <p className="text-sm font-medium text-foreground border-b border-border pb-2">Required Documents</p>
              <p className="text-xs text-muted-foreground">Upload PDF, JPG or PNG. Max 10MB per file.</p>
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

          {/* Step 4: Services */}
          {step === 4 && (
            <MerchantOnboardingServicesStep
              services={services}
              minServiceImages={MIN_SERVICE_IMAGES}
              serviceImageUploadRefs={serviceImageUploadRefs}
              getServiceSections={getServiceSections}
              toggleServiceSection={toggleServiceSection}
              updateService={updateService}
              addService={addService}
              removeService={removeService}
              addServicePoint={addServicePoint}
              removeServicePoint={removeServicePoint}
              setServicePointText={setServicePointText}
              addServiceSubPoint={addServiceSubPoint}
              setServiceSubPoint={setServiceSubPoint}
              removeServiceSubPoint={removeServiceSubPoint}
              addServiceListItem={addServiceListItem}
              setServiceListItem={setServiceListItem}
              removeServiceListItem={removeServiceListItem}
              setServiceImages={setServiceImages}
            />
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm font-medium text-foreground">Application submitted</p>
              <p className="text-sm text-muted-foreground">
                Thank you for applying. Our team will review your application and documents within 2–3 business days.
              </p>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-left text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">What happens next</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Document verification</li>
                  <li>Listing review & approval</li>
                  <li>Merchant dashboard access</li>
                  <li>Your services go live</li>
                </ul>
                <p className="mt-2">Questions? Email hello@triplysquads.com or call +971 52 516 3595</p>
              </div>
              <p className="text-xs text-muted-foreground">
                No action is needed right now. You&apos;ll be able to access your merchant dashboard after approval.
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer: Back + Proceed */}
        {step < 5 && (
          <CardFooter className="flex flex-col gap-3 p-6 sm:p-8 pt-6 border-t border-border bg-card">
            {step === 2 && showStep2Errors && step2Errors.length > 0 && (
              <p className="text-sm text-destructive">
                Please complete all required business details to continue.
              </p>
            )}
            <div className="flex flex-row justify-between gap-4">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2()) ||
                  (step === 3 && !canProceedStep3)
                }
              >
                Proceed to next step
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceedStep4 || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Proceed to final step
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
