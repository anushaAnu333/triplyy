'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import type { ItineraryDay } from '@/lib/api/destinations';
import type { PackageAdminAttachment, TripPackage } from '@/lib/api/packages';
import { packagesApi } from '@/lib/api/packages';
import { ItineraryDaysEditor, emptyItineraryDay, serializeItineraryForApi } from '@/components/admin/ItineraryDaysEditor';

type PricingRowForm = { category: string; values: string[] };
type HotelGroupForm = { title: string; items: string[] };
const MAX_IMAGES = 5;
const MAX_ADMIN_ATTACHMENTS = 15;

interface PackageGenericFormState {
  name: string;
  slug: string;
  location: string;
  description: string;
  thumbnailImage: string;
  images: string[];
  validUntil: string;
  durationDays: string;
  durationNights: string;
  isActive: boolean;
  useSecondaryItinerary: boolean;
  secondaryTitle: string;
  itinerary: ItineraryDay[];
  secondaryItinerary: ItineraryDay[];
  pricingCurrency: string;
  pricingColumns: string[];
  pricingRows: PricingRowForm[];
  hotelGroups: HotelGroupForm[];
  blackoutDates: string[];
  inclusions: string[];
  exclusions: string[];
  importantNotes: string[];
  adminOnlyAttachments: PackageAdminAttachment[];
}

function createEmptyDay(index: number): ItineraryDay {
  return {
    ...emptyItineraryDay(),
    day: `Day ${String(index + 1).padStart(2, '0')}`,
    meals: [],
  };
}

function isoToDateInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function stateFromPackage(pkg: TripPackage): PackageGenericFormState {
  const pricingColumns = pkg.pricingTable?.columnHeaders?.length ? [...pkg.pricingTable.columnHeaders] : [];
  const pricingRows = (pkg.pricingTable?.rows || []).map((r) => ({
    category: r.category,
    values: (r.values || []).map((v) => String(v)),
  }));
  const hotelGroups = (pkg.hotelGroups || []).map((g) => ({ title: g.title, items: [...(g.items || [])] }));

  return {
    name: pkg.name || '',
    slug: pkg.slug || '',
    location: pkg.location || '',
    description: pkg.description || '',
    thumbnailImage: pkg.thumbnailImage || '',
    images: Array.isArray(pkg.images) ? pkg.images.slice(0, MAX_IMAGES) : [],
    validUntil: isoToDateInput(pkg.promotionEndDate),
    durationDays: pkg.duration?.days ? String(pkg.duration.days) : '',
    durationNights: pkg.duration?.nights ? String(pkg.duration.nights) : '',
    isActive: pkg.isActive !== false,
    useSecondaryItinerary: (pkg.secondaryItinerary?.length || 0) > 0,
    secondaryTitle: pkg.secondaryItineraryTitle || '',
    itinerary: (pkg.itinerary || []).map((d) => ({ ...d, meals: d.meals || [] })),
    secondaryItinerary: (pkg.secondaryItinerary || []).map((d) => ({ ...d, meals: d.meals || [] })),
    pricingCurrency: pkg.pricingTable?.currency || pkg.priceCurrency || 'USD',
    pricingColumns,
    pricingRows,
    hotelGroups,
    blackoutDates: pkg.blackoutDates || [],
    inclusions: pkg.inclusions || [],
    exclusions: pkg.exclusions || [],
    importantNotes: pkg.importantNotes || [],
    adminOnlyAttachments: Array.isArray(pkg.adminOnlyAttachments)
      ? pkg.adminOnlyAttachments.map((a) => ({
          url: a.url,
          originalName: a.originalName,
          mimeType: a.mimeType,
        }))
      : [],
  };
}

function initialCreateState(): PackageGenericFormState {
  return {
    name: '',
    slug: '',
    location: '',
    description: '',
    thumbnailImage: '',
    images: [],
    validUntil: '',
    durationDays: '',
    durationNights: '',
    isActive: true,
    useSecondaryItinerary: false,
    secondaryTitle: '',
    itinerary: [createEmptyDay(0)],
    secondaryItinerary: [],
    pricingCurrency: 'USD',
    pricingColumns: [],
    pricingRows: [],
    hotelGroups: [],
    blackoutDates: [],
    inclusions: [],
    exclusions: [],
    importantNotes: [],
    adminOnlyAttachments: [],
  };
}

export interface PackageGenericFormProps {
  mode: 'create' | 'edit';
  initialData?: TripPackage | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PackageGenericForm({ mode, initialData, onSuccess, onCancel }: PackageGenericFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const thumbnailUploadRef = useRef<HTMLInputElement>(null);
  const imagesUploadRef = useRef<HTMLInputElement>(null);
  const adminFilesInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<PackageGenericFormState>(() => initialCreateState());
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingAdminFiles, setUploadingAdminFiles] = useState(false);
  const [downloadingAdminIdx, setDownloadingAdminIdx] = useState<number | null>(null);

  useEffect(() => {
    if (mode === 'edit' && initialData) setForm(stateFromPackage(initialData));
  }, [mode, initialData]);

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => packagesApi.create(body as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
      toast({ title: 'Package created successfully' });
      onSuccess();
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast({ title: 'Failed to create package', description: msg, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => packagesApi.update(id, body as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
      if (initialData?._id) queryClient.invalidateQueries({ queryKey: ['admin-package', initialData._id] });
      toast({ title: 'Package updated successfully' });
      onSuccess();
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast({ title: 'Failed to update package', description: msg, variant: 'destructive' });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const computedPriceLabel = useMemo(() => {
    const values = form.pricingRows.flatMap((r) => r.values).map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);
    if (!values.length) return '';
    return `From ${form.pricingCurrency || 'USD'} ${Math.round(Math.min(...values))} / person`;
  }, [form.pricingRows, form.pricingCurrency]);

  const setStringListItem = (field: 'blackoutDates' | 'inclusions' | 'exclusions' | 'importantNotes', idx: number, value: string) => {
    setForm((p) => {
      const next = [...p[field]];
      next[idx] = value;
      return { ...p, [field]: next };
    });
  };

  const addStringListItem = (field: 'blackoutDates' | 'inclusions' | 'exclusions' | 'importantNotes') => {
    setForm((p) => ({ ...p, [field]: [...p[field], ''] }));
  };

  const removeStringListItem = (field: 'blackoutDates' | 'inclusions' | 'exclusions' | 'importantNotes', idx: number) => {
    setForm((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));
  };

  const handleThumbnailUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    setUploadingThumbnail(true);
    try {
      const { urls } = await packagesApi.uploadImages([file]);
      if (urls[0]) setForm((p) => ({ ...p, thumbnailImage: urls[0] }));
      else toast({ title: 'Thumbnail upload failed', variant: 'destructive' });
    } catch {
      toast({ title: 'Thumbnail upload failed', variant: 'destructive' });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleImagesUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      toast({ title: `Maximum ${MAX_IMAGES} images allowed`, variant: 'destructive' });
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setUploadingImages(true);
    try {
      const { urls } = await packagesApi.uploadImages(selected);
      setForm((p) => ({ ...p, images: [...p.images, ...urls].slice(0, MAX_IMAGES) }));
      if (!urls.length) toast({ title: 'Image upload failed', variant: 'destructive' });
    } catch {
      toast({ title: 'Image upload failed', variant: 'destructive' });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleAdminAttachmentsUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = MAX_ADMIN_ATTACHMENTS - form.adminOnlyAttachments.length;
    if (remaining <= 0) {
      toast({ title: `Maximum ${MAX_ADMIN_ATTACHMENTS} documents allowed`, variant: 'destructive' });
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setUploadingAdminFiles(true);
    try {
      const { attachments } = await packagesApi.uploadAdminAttachments(selected);
      if (!attachments.length) {
        toast({ title: 'Upload failed', variant: 'destructive' });
        return;
      }
      setForm((p) => ({
        ...p,
        adminOnlyAttachments: [...p.adminOnlyAttachments, ...attachments].slice(0, MAX_ADMIN_ATTACHMENTS),
      }));
    } catch {
      toast({ title: 'Document upload failed', variant: 'destructive' });
    } finally {
      setUploadingAdminFiles(false);
      if (adminFilesInputRef.current) adminFilesInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedDays = Number(form.durationDays);
    const parsedNights = Number(form.durationNights);
    const hasDuration = Number.isFinite(parsedDays) && Number.isFinite(parsedNights) && parsedDays > 0 && parsedNights >= 0;

    const pricingColumns = form.pricingColumns.map((c) => c.trim()).filter(Boolean);
    const pricingRowsClean = form.pricingRows
      .map((r) => ({
        category: r.category.trim(),
        values: r.values.map((v) => Number(v)),
      }))
      .filter((r) => r.category || r.values.some((v) => Number.isFinite(v)));

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      location: form.location.trim(),
      description: form.description.trim(),
      thumbnailImage: form.thumbnailImage.trim() || undefined,
      images: form.images,
      duration: hasDuration ? { days: parsedDays, nights: parsedNights } : undefined,
      priceCurrency: (form.pricingCurrency || 'USD').trim().toUpperCase(),
      priceLabel: computedPriceLabel || undefined,
      pricingTable: pricingColumns.length || pricingRowsClean.length
        ? {
            currency: (form.pricingCurrency || 'USD').trim().toUpperCase(),
            columnHeaders: pricingColumns,
            rows: pricingRowsClean.map((r) => ({
              category: r.category,
              values: r.values.map((v) => (Number.isFinite(v) ? v : 0)),
            })),
          }
        : undefined,
      hotelGroups: form.hotelGroups
        .map((g) => ({
          title: g.title.trim(),
          items: g.items.map((x) => x.trim()).filter(Boolean),
        }))
        .filter((g) => g.title || g.items.length),
      blackoutDates: form.blackoutDates.map((x) => x.trim()).filter(Boolean),
      inclusions: form.inclusions.map((x) => x.trim()).filter(Boolean),
      exclusions: form.exclusions.map((x) => x.trim()).filter(Boolean),
      importantNotes: form.importantNotes.map((x) => x.trim()).filter(Boolean),
      itinerary: serializeItineraryForApi(form.itinerary),
      secondaryItineraryTitle: form.useSecondaryItinerary ? form.secondaryTitle.trim() || undefined : undefined,
      secondaryItinerary: form.useSecondaryItinerary ? serializeItineraryForApi(form.secondaryItinerary) : [],
      promotionEndDate: form.validUntil ? new Date(`${form.validUntil}T00:00:00.000Z`).toISOString() : undefined,
      isPromotion: !!form.validUntil.trim(),
      isActive: form.isActive,
      adminOnlyAttachments: form.adminOnlyAttachments,
    };

    if (!payload.name || !payload.location || !payload.description) {
      toast({
        title: 'Missing required fields',
        description: 'Name, location, and description are required.',
        variant: 'destructive',
      });
      return;
    }

    if (mode === 'create') createMutation.mutate(payload);
    else if (initialData?._id) updateMutation.mutate({ id: initialData._id, body: payload });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Package basics</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Slug (optional)</Label><Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Location *</Label><Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Valid until</Label><Input type="date" value={form.validUntil} onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Days (optional)</Label><Input type="number" min={1} value={form.durationDays} onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Nights (optional)</Label><Input type="number" min={0} value={form.durationNights} onChange={(e) => setForm((p) => ({ ...p, durationNights: e.target.value }))} /></div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description *</Label>
            <textarea className="w-full min-h-[100px] rounded-md border p-3" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <Checkbox checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
            Active on site
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Images</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Thumbnail image</Label>
            <input
              ref={thumbnailUploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleThumbnailUpload(e.target.files)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => thumbnailUploadRef.current?.click()}
                disabled={uploadingThumbnail}
              >
                {uploadingThumbnail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload thumbnail
              </Button>
              {form.thumbnailImage ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => setForm((p) => ({ ...p, thumbnailImage: '' }))}
                >
                  <X className="mr-1 h-4 w-4" /> Remove
                </Button>
              ) : null}
            </div>
            {form.thumbnailImage ? (
              <img
                src={form.thumbnailImage}
                alt="Thumbnail preview"
                className="h-24 w-40 rounded-md border object-cover"
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Gallery images (max {MAX_IMAGES})</Label>
            <input
              ref={imagesUploadRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImagesUpload(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => imagesUploadRef.current?.click()}
              disabled={uploadingImages || form.images.length >= MAX_IMAGES}
            >
              {uploadingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload images
            </Button>
            <p className="text-xs text-muted-foreground">{form.images.length}/{MAX_IMAGES} uploaded</p>
            {form.images.length ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {form.images.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative">
                    <img src={url} alt={`Package image ${idx + 1}`} className="h-20 w-full rounded-md border object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-1 top-1 h-6 w-6"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          images: p.images.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Internal documents (admin only)</Label>
            <p className="text-xs text-muted-foreground">
              Upload PDFs or images for your team. These are not shown on the public package page.
            </p>
            <input
              ref={adminFilesInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleAdminAttachmentsUpload(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadingAdminFiles || form.adminOnlyAttachments.length >= MAX_ADMIN_ATTACHMENTS}
              onClick={() => adminFilesInputRef.current?.click()}
            >
              {uploadingAdminFiles ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload PDF or document
            </Button>
            <p className="text-xs text-muted-foreground">
              {form.adminOnlyAttachments.length}/{MAX_ADMIN_ATTACHMENTS} files
            </p>
            {form.adminOnlyAttachments.length > 0 ? (
              <ul className="space-y-2">
                {form.adminOnlyAttachments.map((att, i) => (
                  <li
                    key={`${att.url}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate text-sm font-medium" title={att.originalName}>
                        {att.originalName}
                      </span>
                      {att.mimeType ? (
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          ({att.mimeType === 'application/pdf' ? 'PDF' : 'Image'})
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={downloadingAdminIdx === i}
                        onClick={async () => {
                          setDownloadingAdminIdx(i);
                          try {
                            await packagesApi.downloadAdminAttachment(att);
                          } catch {
                            toast({
                              title: 'Download failed',
                              description: 'Check your connection and try again.',
                              variant: 'destructive',
                            });
                          } finally {
                            setDownloadingAdminIdx(null);
                          }
                        }}
                      >
                        {downloadingAdminIdx === i ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="mr-1 h-3.5 w-3.5" />
                        )}
                        Download
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            adminOnlyAttachments: p.adminOnlyAttachments.filter((_, j) => j !== i),
                          }))
                        }
                        aria-label={`Remove ${att.originalName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pricing table (fully custom)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2"><Label>Currency</Label><Input value={form.pricingCurrency} onChange={(e) => setForm((p) => ({ ...p, pricingCurrency: e.target.value }))} /></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label>Columns</Label><Button type="button" variant="outline" size="sm" onClick={() => setForm((p) => ({ ...p, pricingColumns: [...p.pricingColumns, ''], pricingRows: p.pricingRows.map((r) => ({ ...r, values: [...r.values, ''] })) }))}><Plus className="mr-1 h-3 w-3" />Add column</Button></div>
            {form.pricingColumns.map((c, ci) => (
              <div key={ci} className="flex gap-2">
                <Input value={c} onChange={(e) => setForm((p) => ({ ...p, pricingColumns: p.pricingColumns.map((x, i) => i === ci ? e.target.value : x) }))} placeholder="e.g. 4-Star" />
                <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => setForm((p) => ({ ...p, pricingColumns: p.pricingColumns.filter((_, i) => i !== ci), pricingRows: p.pricingRows.map((r) => ({ ...r, values: r.values.filter((_, i) => i !== ci) })) }))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label>Rows</Label><Button type="button" variant="outline" size="sm" onClick={() => setForm((p) => ({ ...p, pricingRows: [...p.pricingRows, { category: '', values: p.pricingColumns.map(() => '') }] }))}><Plus className="mr-1 h-3 w-3" />Add row</Button></div>
            {form.pricingRows.map((row, ri) => (
              <div key={ri} className="rounded-md border p-3 space-y-2">
                <div className="flex gap-2">
                  <Input value={row.category} onChange={(e) => setForm((p) => ({ ...p, pricingRows: p.pricingRows.map((r, i) => i === ri ? { ...r, category: e.target.value } : r) }))} placeholder="Row label, e.g. 10-15 Pax + 1 FOC" />
                  <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => setForm((p) => ({ ...p, pricingRows: p.pricingRows.filter((_, i) => i !== ri) }))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {row.values.map((v, vi) => (
                    <Input key={vi} type="number" value={v} onChange={(e) => setForm((p) => ({ ...p, pricingRows: p.pricingRows.map((r, i) => i === ri ? { ...r, values: r.values.map((x, j) => j === vi ? e.target.value : x) } : r) }))} placeholder={form.pricingColumns[vi] || `Value ${vi + 1}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hotels (fully custom groups)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={() => setForm((p) => ({ ...p, hotelGroups: [...p.hotelGroups, { title: '', items: [] }] }))}><Plus className="mr-1 h-3 w-3" />Add hotel group</Button></div>
          {form.hotelGroups.map((g, gi) => (
            <div key={gi} className="rounded-md border p-3 space-y-2">
              <div className="flex gap-2">
                <Input value={g.title} onChange={(e) => setForm((p) => ({ ...p, hotelGroups: p.hotelGroups.map((x, i) => i === gi ? { ...x, title: e.target.value } : x) }))} placeholder="Group title, e.g. Mumbai / Option A / 4-Star" />
                <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => setForm((p) => ({ ...p, hotelGroups: p.hotelGroups.filter((_, i) => i !== gi) }))}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={() => setForm((p) => ({ ...p, hotelGroups: p.hotelGroups.map((x, i) => i === gi ? { ...x, items: [...x.items, ''] } : x) }))}><Plus className="mr-1 h-3 w-3" />Add item</Button></div>
                {g.items.map((item, ii) => (
                  <div key={ii} className="flex gap-2">
                    <Input value={item} onChange={(e) => setForm((p) => ({ ...p, hotelGroups: p.hotelGroups.map((x, i) => i === gi ? { ...x, items: x.items.map((y, j) => j === ii ? e.target.value : y) } : x) }))} placeholder="Hotel line" />
                    <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => setForm((p) => ({ ...p, hotelGroups: p.hotelGroups.map((x, i) => i === gi ? { ...x, items: x.items.filter((_, j) => j !== ii) } : x) }))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lists</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {(['blackoutDates', 'inclusions', 'exclusions', 'importantNotes'] as const).map((field) => (
            <div key={field} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{field}</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addStringListItem(field)}><Plus className="mr-1 h-3 w-3" />Add</Button>
              </div>
              {form[field].map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={item} onChange={(e) => setStringListItem(field, i, e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => removeStringListItem(field, i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Itinerary</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ItineraryDaysEditor days={form.itinerary} onChange={(next) => setForm((p) => ({ ...p, itinerary: next }))} />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.useSecondaryItinerary} onChange={(e) => setForm((p) => ({ ...p, useSecondaryItinerary: e.target.checked, secondaryItinerary: e.target.checked && p.secondaryItinerary.length === 0 ? [createEmptyDay(0)] : p.secondaryItinerary }))} />
            Add secondary itinerary tab
          </label>
          {form.useSecondaryItinerary ? (
            <div className="space-y-3">
              <div className="space-y-2"><Label>Secondary title</Label><Input value={form.secondaryTitle} onChange={(e) => setForm((p) => ({ ...p, secondaryTitle: e.target.value }))} /></div>
              <ItineraryDaysEditor days={form.secondaryItinerary} onChange={(next) => setForm((p) => ({ ...p, secondaryItinerary: next }))} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === 'edit' ? 'Save package' : 'Create package'}
        </Button>
      </div>
    </form>
  );
}

