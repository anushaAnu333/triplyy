'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { merchantActivitiesApi } from '@/lib/api/activities';
import { useQueryClient } from '@tanstack/react-query';
import { MerchantOnboardingServicesStep } from '@/components/merchant/MerchantOnboardingServicesStep';
import { MIN_SERVICE_IMAGES } from '@/lib/merchant-onboarding/constants';
import { validateServiceItem } from '@/lib/merchant-onboarding/validation';
import type { ServiceItem } from '@/lib/merchant-onboarding/types';
import type { MutableRefObject } from 'react';
import { Loader2 } from 'lucide-react';

interface ServiceSections {
  basic: boolean;
  points: boolean;
  includedExcluded: boolean;
  images: boolean;
}

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

export default function AddActivityPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([createEmptyService()]);
  const serviceImageUploadRefs = useRef<Record<string, HTMLInputElement | null>>({} as Record<string, HTMLInputElement | null>);
  const [serviceOpenSections, setServiceOpenSections] = useState<Record<string, ServiceSections>>({});

  const getServiceSections = (id: string): ServiceSections =>
    serviceOpenSections[id] ?? { basic: true, points: false, includedExcluded: false, images: true };

  const toggleServiceSection = (id: string, key: keyof ServiceSections) => {
    setServiceOpenSections((prev) => {
      const current = prev[id] ?? { basic: true, points: false, includedExcluded: false, images: true };
      return { ...prev, [id]: { ...current, [key]: !current[key] } };
    });
  };

  const updateService = (id: string, patch: Partial<ServiceItem>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addService = () => {
    // Keep this page aligned with the single-activity submit flow.
    if (services.length >= 1) {
      toast({
        title: 'Only one activity per submission',
        description: 'Remove the extra service by editing the current one.',
        variant: 'destructive',
      });
      return;
    }
    setServices((prev) => [...prev, createEmptyService()]);
  };

  const removeService = (id: string) => {
    if (services.length <= 1) return;
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const setServiceImages = (id: string, files: File[]) => updateService(id, { images: files.slice(0, 3) });

  const addServicePoint = (id: string) => {
    const svc = services.find((s) => s.id === id);
    const groups = svc?.pointGroups?.length ? svc.pointGroups : [{ text: '', subPoints: [] }];
    updateService(id, { pointGroups: [...groups, { text: '', subPoints: [] }] });
  };

  const removeServicePoint = (id: string, index: number) => {
    const svc = services.find((s) => s.id === id);
    const groups = (svc?.pointGroups ?? []).filter((_, i) => i !== index);
    updateService(id, { pointGroups: groups.length ? groups : [{ text: '', subPoints: [] }] });
  };

  const setServicePointText = (id: string, index: number, text: string) => {
    const svc = services.find((s) => s.id === id);
    const groups = [...(svc?.pointGroups ?? [{ text: '', subPoints: [] }])];
    if (!groups[index]) groups[index] = { text: '', subPoints: [] };
    groups[index] = { ...groups[index], text };
    updateService(id, { pointGroups: groups });
  };

  const addServiceSubPoint = (id: string, index: number) => {
    const svc = services.find((s) => s.id === id);
    const groups = [...(svc?.pointGroups ?? [{ text: '', subPoints: [] }])];
    if (!groups[index]) groups[index] = { text: '', subPoints: [] };
    groups[index] = { ...groups[index], subPoints: [...(groups[index].subPoints || []), ''] };
    updateService(id, { pointGroups: groups });
  };

  const setServiceSubPoint = (id: string, index: number, subIndex: number, value: string) => {
    const svc = services.find((s) => s.id === id);
    const groups = [...(svc?.pointGroups ?? [{ text: '', subPoints: [] }])];
    if (!groups[index]) groups[index] = { text: '', subPoints: [] };
    const sub = [...(groups[index].subPoints || [])];
    sub[subIndex] = value;
    groups[index] = { ...groups[index], subPoints: sub };
    updateService(id, { pointGroups: groups });
  };

  const removeServiceSubPoint = (id: string, index: number, subIndex: number) => {
    const svc = services.find((s) => s.id === id);
    const groups = [...(svc?.pointGroups ?? [{ text: '', subPoints: [] }])];
    if (!groups[index]) groups[index] = { text: '', subPoints: [] };
    const sub = (groups[index].subPoints || []).filter((_, i) => i !== subIndex);
    groups[index] = { ...groups[index], subPoints: sub };
    updateService(id, { pointGroups: groups });
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

  const canSubmit = useMemo(() => {
    const svc = services[0];
    if (!svc) return false;
    return validateServiceItem(svc).success && svc.images.length >= MIN_SERVICE_IMAGES && location.trim().length > 0;
  }, [services, location]);

  // Check if user is merchant
  if (!authLoading && isAuthenticated && user?.role !== 'merchant') {
    router.push('/dashboard');
    return null;
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const handleSubmit = async () => {
    const svc = services[0];
    if (!svc) return;
    const locTrimmed = location.trim();
    const titleTrimmed = svc.title.trim();
    const descriptionTrimmed = svc.description.trim();

    if (!locTrimmed) {
      toast({ title: 'Location is required', description: 'Please enter where this activity happens.', variant: 'destructive' });
      return;
    }

    if (titleTrimmed.length > 200) {
      toast({ title: 'Title is too long', description: 'Title cannot exceed 200 characters.', variant: 'destructive' });
      return;
    }

    if (descriptionTrimmed.length > 2000) {
      toast({
        title: 'Description is too long',
        description: 'Description cannot exceed 2000 characters for activities.',
        variant: 'destructive',
      });
      return;
    }

    if (locTrimmed.length > 200) {
      toast({ title: 'Location is too long', description: 'Location cannot exceed 200 characters.', variant: 'destructive' });
      return;
    }
    const result = validateServiceItem(svc);
    if (!result.success) {
      toast({ title: 'Please complete the service details', description: 'Some required fields are missing or invalid.', variant: 'destructive' });
      return;
    }
    if (svc.images.length < MIN_SERVICE_IMAGES) {
      toast({ title: 'At least one photo is required', description: `Upload at least ${MIN_SERVICE_IMAGES} photo(s).`, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const pointGroups = (svc.pointGroups || [])
        .filter((g) => (g.text || '').trim() || (g.subPoints || []).some((sp) => (sp || '').trim()))
        .map((g) => ({
          text: g.text.trim(),
          subPoints: (g.subPoints || []).map((sp) => sp.trim()).filter(Boolean),
        }));

      const includes = (svc.includes || []).map((x) => x.trim()).filter(Boolean);
      const excludes = (svc.excludes || []).map((x) => x.trim()).filter(Boolean);

      const parsedGroupSize = svc.groupSize?.trim() ? parseInt(svc.groupSize, 10) : null;

      const created = await merchantActivitiesApi.submit({
        title: titleTrimmed,
        description: descriptionTrimmed,
        location: locTrimmed,
        price: parseFloat(svc.price),
        currency: 'AED',
        photos: svc.images,
        duration: svc.duration?.trim() ? svc.duration.trim() : undefined,
        groupSize: Number.isFinite(parsedGroupSize as number) ? parsedGroupSize : null,
        languages: svc.languages?.trim() ? svc.languages.trim() : undefined,
        pointsHeading: svc.pointsHeading?.trim() ? svc.pointsHeading.trim() : undefined,
        pointGroups: pointGroups.length ? pointGroups : undefined,
        includes: includes.length ? includes : undefined,
        excludes: excludes.length ? excludes : undefined,
      });

      toast({
        title: created.status === 'approved' ? 'Activity is live!' : 'Activity submitted!',
        description:
          created.status === 'approved'
            ? 'Your activity is now visible to customers.'
            : 'Your activity has been submitted and is pending admin approval.',
      });

      queryClient.invalidateQueries({ queryKey: ['merchant-activities'] });
      router.push('/merchant/dashboard');
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to submit activity. Please try again.';
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-6 pb-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Add New Activity</CardTitle>
            <CardDescription>
              Submit your activity for review. Once approved, it will be visible to customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Dubai, UAE"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This is used to display and filter activities on the customer side.
                </p>
              </div>

              <div className="mt-6">
                <MerchantOnboardingServicesStep
                  services={services}
                  minServiceImages={MIN_SERVICE_IMAGES}
                  serviceImageUploadRefs={serviceImageUploadRefs as MutableRefObject<Record<string, HTMLInputElement | null>>}
                  getServiceSections={getServiceSections}
                  toggleServiceSection={toggleServiceSection}
                  updateService={updateService}
                  addService={addService}
                  removeService={removeService}
                  addServicePoint={(id) => addServicePoint(id)}
                  removeServicePoint={(id, index) => removeServicePoint(id, index)}
                  setServicePointText={(id, index, text) => setServicePointText(id, index, text)}
                  addServiceSubPoint={(id, index) => addServiceSubPoint(id, index)}
                  setServiceSubPoint={(id, index, subIndex, value) => setServiceSubPoint(id, index, subIndex, value)}
                  removeServiceSubPoint={(id, index, subIndex) => removeServiceSubPoint(id, index, subIndex)}
                  addServiceListItem={addServiceListItem}
                  setServiceListItem={setServiceListItem}
                  removeServiceListItem={removeServiceListItem}
                  setServiceImages={setServiceImages}
                />
              </div>

              <div className="flex gap-4 mt-8">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting || !canSubmit}
                  className="flex-1"
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Activity'
                  )}
                </Button>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
