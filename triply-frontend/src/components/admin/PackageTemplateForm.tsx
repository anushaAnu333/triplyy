'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import type { ItineraryDay } from '@/lib/api/destinations';
import type { TripPackage } from '@/lib/api/packages';
import { packagesApi } from '@/lib/api/packages';
import { ItineraryDaysEditor, emptyItineraryDay, serializeItineraryForApi } from '@/components/admin/ItineraryDaysEditor';

type MealTag = 'B' | 'L' | 'D';

type OptionKey = 'A' | 'B' | 'C';
type PaxKey = '2-4' | '5-8';

const PRICING_COLUMN_HEADERS = [
  '4D3N (2–4 Pax)',
  '4D3N (5–8 Pax)',
  '5D4N (2–4 Pax)',
  '5D4N (5–8 Pax)',
] as const;

function parseDateInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toNumberOrZero(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) && !Number.isNaN(n) ? n : 0;
}

function optionKeyFromTitle(title: string): OptionKey | undefined {
  const t = title.toUpperCase();
  if (t.includes('OPTION A') || /\bA\b/.test(t)) return 'A';
  if (t.includes('OPTION B') || /\bB\b/.test(t)) return 'B';
  if (t.includes('OPTION C') || /\bC\b/.test(t)) return 'C';
  return undefined;
}

function buildPricingTableFromTemplate(
  pricing4d3n: Record<PaxKey, Record<OptionKey, string>>,
  pricing5d4n: Record<PaxKey, Record<OptionKey, string>>
): TripPackage['pricingTable'] {
  const categories: OptionKey[] = ['A', 'B', 'C'];
  const paxOrder: PaxKey[] = ['2-4', '5-8'];

  return {
    currency: 'USD',
    columnHeaders: [...PRICING_COLUMN_HEADERS],
    rows: categories.map((cat) => ({
      category: cat,
      values: [
        pricing4d3n[paxOrder[0]][cat],
        pricing4d3n[paxOrder[1]][cat],
        pricing5d4n[paxOrder[0]][cat],
        pricing5d4n[paxOrder[1]][cat],
      ].map((v) => toNumberOrZero(v)),
    })),
  };
}

function extractPricingTemplateFromTable(pt?: TripPackage['pricingTable']) {
  const out = {
    '4d3n': {
      '2-4': { A: '', B: '', C: '' } as Record<OptionKey, string>,
      '5-8': { A: '', B: '', C: '' } as Record<OptionKey, string>,
    } as Record<PaxKey, Record<OptionKey, string>>,
    '5d4n': {
      '2-4': { A: '', B: '', C: '' } as Record<OptionKey, string>,
      '5-8': { A: '', B: '', C: '' } as Record<OptionKey, string>,
    } as Record<PaxKey, Record<OptionKey, string>>,
  };

  if (!pt?.columnHeaders?.length || !pt.rows?.length) return out;

  const idx4d3n24 = pt.columnHeaders.findIndex((h) => h.includes('4D3N') && h.includes('2'));
  const idx4d3n58 = pt.columnHeaders.findIndex((h) => h.includes('4D3N') && h.includes('5'));
  const idx5d4n24 = pt.columnHeaders.findIndex((h) => h.includes('5D4N') && h.includes('2'));
  const idx5d4n58 = pt.columnHeaders.findIndex((h) => h.includes('5D4N') && h.includes('5'));
  const idxs = [idx4d3n24, idx4d3n58, idx5d4n24, idx5d4n58];
  if (idxs.some((i) => i < 0)) return out;

  const findRow = (cat: OptionKey) => pt.rows.find((r) => r.category.toUpperCase() === cat);
  const rowA = findRow('A');
  const rowB = findRow('B');
  const rowC = findRow('C');
  const rowsByCat: Record<OptionKey, typeof rowA> = { A: rowA, B: rowB, C: rowC };

  const fill = (durationKey: '4d3n' | '5d4n', paxKey: PaxKey, cat: OptionKey, idx: number) => {
    const row = rowsByCat[cat];
    const v = row?.values?.[idx];
    out[durationKey][paxKey][cat] = typeof v === 'number' && Number.isFinite(v) ? String(v) : '';
  };

  for (const cat of ['A', 'B', 'C'] as OptionKey[]) {
    fill('4d3n', '2-4', cat, idx4d3n24);
    fill('4d3n', '5-8', cat, idx4d3n58);
    fill('5d4n', '2-4', cat, idx5d4n24);
    fill('5d4n', '5-8', cat, idx5d4n58);
  }

  return out;
}

function normalizePointGroupsToTemplate(day: ItineraryDay): ItineraryDay {
  const pg = day.pointGroups?.length ? [...day.pointGroups] : undefined;
  if (pg?.length) return { ...day, pointGroups: pg };
  const highlights = day.highlights || [];
  const sub = day.subHighlights || [];
  if (!highlights.length) return { ...day, pointGroups: [emptyItineraryDay().pointGroups![0]] };
  return {
    ...day,
    pointGroups: highlights.map((h, i) => ({
      text: h,
      subPoints: i === 0 ? [...sub] : [],
    })),
  };
}

function stateFromPackage(pkg: TripPackage): PackageTemplateFormState {
  const primaryDays = pkg.duration?.days ?? 4;
  const primaryNights = pkg.duration?.nights ?? 3;

  const pricing = extractPricingTemplateFromTable(pkg.pricingTable);

  const hotelOptions = ['A', 'B', 'C'].map((k) => {
    const group = (pkg.hotelGroups || []).find((g) => optionKeyFromTitle(g.title) === (k as OptionKey));
    const bangkok = group?.items?.[0] ?? '';
    const pattaya = group?.items?.[1] ?? '';
    return {
      key: k as OptionKey,
      title: `Option ${k}`,
      bangkok,
      pattaya,
    };
  });

  const it1 = (pkg.itinerary || []).map((d) => ({
    ...d,
    meals: (d as unknown as { meals?: string[] }).meals || [],
    pointGroups: undefined,
  }));

  const it2 = (pkg.secondaryItinerary || []).map((d) => ({
    ...d,
    meals: (d as unknown as { meals?: string[] }).meals || [],
    pointGroups: undefined,
  }));

  return {
    name: pkg.name || '',
    slug: pkg.slug || '',
    location: pkg.location || '',
    description: pkg.description || '',
    validUntil: parseDateInput(pkg.promotionEndDate),
    primaryDays,
    primaryNights,
    secondaryTitle: pkg.secondaryItineraryTitle || '5D4N — 2N Bangkok + 2N Pattaya',
    itinerary: (pkg.itinerary || []).map((d) => normalizePointGroupsToTemplate(d as ItineraryDay)),
    secondaryItinerary: (pkg.secondaryItinerary || []).map((d) =>
      normalizePointGroupsToTemplate(d as ItineraryDay)
    ),
    hotelOptions,
    pricing4d3n: pricing['4d3n'],
    pricing5d4n: pricing['5d4n'],
    blackoutDates: pkg.blackoutDates || [],
    inclusions: pkg.inclusions || [],
    exclusions: pkg.exclusions || [],
    importantNotes: pkg.importantNotes || [],
    contactPhone: pkg.contactPhone || '',
    contactEmail: pkg.contactEmail || '',
    contactInstagram: pkg.contactInstagram || '',
    isActive: pkg.isActive !== false,
  };
}

interface PackageTemplateFormState {
  name: string;
  slug: string;
  location: string;
  description: string;
  validUntil: string;

  primaryDays: number;
  primaryNights: number;
  secondaryTitle: string;

  itinerary: ItineraryDay[];
  secondaryItinerary: ItineraryDay[];

  hotelOptions: Array<{ key: OptionKey; title: string; bangkok: string; pattaya: string }>;

  pricing4d3n: Record<PaxKey, Record<OptionKey, string>>;
  pricing5d4n: Record<PaxKey, Record<OptionKey, string>>;

  blackoutDates: string[];
  inclusions: string[];
  exclusions: string[];
  importantNotes: string[];

  contactPhone: string;
  contactEmail: string;
  contactInstagram: string;

  isActive: boolean;
}

function createEmptyDay(index: number): ItineraryDay {
  const day = emptyItineraryDay();
  return {
    ...day,
    day: `Day ${String(index + 1).padStart(2, '0')}`,
    meals: [],
    highlights: [],
    subHighlights: [],
    pointGroups: day.pointGroups,
  };
}

function initialStateCreate(): PackageTemplateFormState {
  const it1 = Array.from({ length: 4 }, (_, i) => createEmptyDay(i));
  const it2 = Array.from({ length: 5 }, (_, i) => createEmptyDay(i));
  return {
    name: '',
    slug: '',
    location: '',
    description: '',
    validUntil: '',
    primaryDays: 4,
    primaryNights: 3,
    secondaryTitle: '5D4N — 2N Bangkok + 2N Pattaya',
    itinerary: it1,
    secondaryItinerary: it2,
    hotelOptions: ['A', 'B', 'C'].map((k) => ({
      key: k as OptionKey,
      title: `Option ${k}`,
      bangkok: '',
      pattaya: '',
    })),
    pricing4d3n: {
      '2-4': { A: '', B: '', C: '' },
      '5-8': { A: '', B: '', C: '' },
    },
    pricing5d4n: {
      '2-4': { A: '', B: '', C: '' },
      '5-8': { A: '', B: '', C: '' },
    },
    blackoutDates: [],
    inclusions: [],
    exclusions: [],
    importantNotes: [],
    contactPhone: '',
    contactEmail: '',
    contactInstagram: '',
    isActive: true,
  };
}

export interface PackageTemplateFormProps {
  mode: 'create' | 'edit';
  initialData?: TripPackage | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PackageTemplateForm({ mode, initialData, onSuccess, onCancel }: PackageTemplateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState<PackageTemplateFormState>(() => initialStateCreate());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormState(stateFromPackage(initialData));
    }
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
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      packagesApi.update(id, body as any),
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

  const computedPriceLabel = useMemo(() => {
    const vals: number[] = [];
    const add = (v: string) => {
      const n = Number(v);
      if (Number.isFinite(n) && !Number.isNaN(n) && n > 0) vals.push(n);
    };
    for (const pax of ['2-4', '5-8'] as PaxKey[]) {
      for (const cat of ['A', 'B', 'C'] as OptionKey[]) {
        add(formState.pricing4d3n[pax][cat]);
        add(formState.pricing5d4n[pax][cat]);
      }
    }
    if (!vals.length) return '';
    const min = Math.min(...vals);
    return `From USD ${Math.round(min)} / person`;
  }, [formState.pricing4d3n, formState.pricing5d4n]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: formState.name.trim(),
      description: formState.description.trim(),
      location: formState.location.trim(),
      slug: formState.slug.trim() || undefined,
      duration: { days: formState.primaryDays || 4, nights: formState.primaryNights || 3 },
      priceCurrency: 'USD',
      priceLabel: computedPriceLabel || undefined,
      pricingTable: buildPricingTableFromTemplate(formState.pricing4d3n, formState.pricing5d4n),
      hotelGroups: formState.hotelOptions.map((o) => ({
        title: o.title,
        items: [o.bangkok, o.pattaya],
      })),
      blackoutDates: formState.blackoutDates.map((s) => s.trim()).filter(Boolean),
      inclusions: formState.inclusions.map((s) => s.trim()).filter(Boolean),
      exclusions: formState.exclusions.map((s) => s.trim()).filter(Boolean),
      importantNotes: formState.importantNotes.map((s) => s.trim()).filter(Boolean),
      itinerary: serializeItineraryForApi(formState.itinerary),
      secondaryItineraryTitle: formState.secondaryTitle.trim() || undefined,
      secondaryItinerary: serializeItineraryForApi(formState.secondaryItinerary),
      contactPhone: formState.contactPhone.trim() || undefined,
      contactEmail: formState.contactEmail.trim() || undefined,
      contactInstagram: formState.contactInstagram.trim() || undefined,
      promotionEndDate: formState.validUntil
        ? new Date(`${formState.validUntil}T00:00:00.000Z`).toISOString()
        : undefined,
      isPromotion: !!formState.validUntil.trim(),
      isActive: formState.isActive,
      // Images/thumbnail handled in future iteration; this template focuses on the textual fields.
    };

    if (mode === 'create') {
      if (!payload.name || !payload.description || !payload.location) {
        toast({ title: 'Missing required fields', description: 'Name, description, and location are required.', variant: 'destructive' });
        return;
      }
      createMutation.mutate(payload);
    } else if (initialData?._id) {
      setIsSaving(true);
      updateMutation.mutate({
        id: initialData._id,
        body: payload,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSaving;

  const addListItem = (field: 'blackoutDates' | 'inclusions' | 'exclusions' | 'importantNotes') => {
    setFormState((p) => ({ ...p, [field]: [...p[field], ''] }));
  };

  const setListItem = (
    field: 'blackoutDates' | 'inclusions' | 'exclusions' | 'importantNotes',
    index: number,
    value: string
  ) => {
    setFormState((p) => {
      const next = [...p[field]];
      next[index] = value;
      return { ...p, [field]: next };
    });
  };

  const removeListItem = (
    field: 'blackoutDates' | 'inclusions' | 'exclusions' | 'importantNotes',
    index: number
  ) => {
    setFormState((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== index) }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-4 items-start flex-wrap">
        <div className="flex-1 min-w-[280px] space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="font-display">Package basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formState.name} onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>URL slug (optional)</Label>
                <Input value={formState.slug} onChange={(e) => setFormState((p) => ({ ...p, slug: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Location / City *</Label>
                <Input value={formState.location} onChange={(e) => setFormState((p) => ({ ...p, location: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <textarea
                  className="min-h-[110px] w-full rounded-lg border p-3"
                  value={formState.description}
                  onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Valid until (offer end)</Label>
                <Input type="date" value={formState.validUntil} onChange={(e) => setFormState((p) => ({ ...p, validUntil: e.target.value }))} />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={formState.isActive} onChange={(e) => setFormState((p) => ({ ...p, isActive: e.target.checked }))} />
                  Active on site
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 min-w-[280px] space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="font-display">Hotel options (A/B/C)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formState.hotelOptions.map((o) => (
                <div key={o.key} className="space-y-2 rounded-lg border p-4">
                  <div className="font-semibold">{o.title}</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Bangkok</Label>
                      <Input
                        value={o.bangkok}
                        onChange={(e) =>
                          setFormState((p) => ({
                            ...p,
                            hotelOptions: p.hotelOptions.map((x) => (x.key === o.key ? { ...x, bangkok: e.target.value } : x)),
                          }))
                        }
                        placeholder="e.g. PJ Water Gate / My Hotel Pratunam"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pattaya</Label>
                      <Input
                        value={o.pattaya}
                        onChange={(e) =>
                          setFormState((p) => ({
                            ...p,
                            hotelOptions: p.hotelOptions.map((x) => (x.key === o.key ? { ...x, pattaya: e.target.value } : x)),
                          }))
                        }
                        placeholder="e.g. Mike Beach / Embryo / Baron Beach"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-xs text-muted-foreground">
                In the public UI we show “or Similar” automatically.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-display">Package pricing tables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="font-semibold text-brand-orange">4D3N (per person USD)</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 pr-2">Group</th>
                    <th className="pb-2 pr-2">Option A</th>
                    <th className="pb-2 pr-2">Option B</th>
                    <th className="pb-2 pr-2">Option C</th>
                  </tr>
                </thead>
                <tbody>
                  {(['2-4', '5-8'] as PaxKey[]).map((pax) => (
                    <tr key={pax}>
                      <td className="py-2 pr-2 text-muted-foreground">{pax === '2-4' ? '2–4 Pax' : '5–8 Pax'}</td>
                      {(['A', 'B', 'C'] as OptionKey[]).map((opt) => (
                        <td key={opt} className="py-2 pr-2">
                          <Input
                            type="number"
                            min={0}
                            value={formState.pricing4d3n[pax][opt]}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                pricing4d3n: {
                                  ...prev.pricing4d3n,
                                  [pax]: { ...prev.pricing4d3n[pax], [opt]: e.target.value },
                                },
                              }))
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="font-semibold text-brand-orange">5D4N (per person USD)</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 pr-2">Group</th>
                    <th className="pb-2 pr-2">Option A</th>
                    <th className="pb-2 pr-2">Option B</th>
                    <th className="pb-2 pr-2">Option C</th>
                  </tr>
                </thead>
                <tbody>
                  {(['2-4', '5-8'] as PaxKey[]).map((pax) => (
                    <tr key={pax}>
                      <td className="py-2 pr-2 text-muted-foreground">{pax === '2-4' ? '2–4 Pax' : '5–8 Pax'}</td>
                      {(['A', 'B', 'C'] as OptionKey[]).map((opt) => (
                        <td key={opt} className="py-2 pr-2">
                          <Input
                            type="number"
                            min={0}
                            value={formState.pricing5d4n[pax][opt]}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                pricing5d4n: {
                                  ...prev.pricing5d4n,
                                  [pax]: { ...prev.pricing5d4n[pax], [opt]: e.target.value },
                                },
                              }))
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary duration — Days</Label>
              <Input
                type="number"
                min={1}
                value={formState.primaryDays}
                onChange={(e) => {
                  const nextDays = Math.max(1, Number(e.target.value) || 4);
                  setFormState((p) => {
                    if (nextDays === p.primaryDays) return p;
                    const currentLen = p.itinerary.length;
                    let nextItinerary = p.itinerary;
                    if (nextDays > currentLen) {
                      const toAdd = nextDays - currentLen;
                      nextItinerary = [
                        ...p.itinerary,
                        ...Array.from({ length: toAdd }, (_, i) => createEmptyDay(currentLen + i)),
                      ];
                    } else {
                      nextItinerary = p.itinerary.slice(0, nextDays);
                    }
                    return { ...p, primaryDays: nextDays, itinerary: nextItinerary };
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Primary duration — Nights</Label>
              <Input type="number" min={0} value={formState.primaryNights} onChange={(e) => setFormState((p) => ({ ...p, primaryNights: Number(e.target.value) || 3 }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secondary tab title (shown as section title)</Label>
            <Input value={formState.secondaryTitle} onChange={(e) => setFormState((p) => ({ ...p, secondaryTitle: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-display">Blackout dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => addListItem('blackoutDates')}>
              <Plus className="mr-1 h-3 w-3" /> Add blackout line
            </Button>
          </div>
          {formState.blackoutDates.map((d, i) => (
            <div key={`${d}-${i}`} className="flex gap-2">
              <Input value={d} onChange={(e) => setListItem('blackoutDates', i, e.target.value)} placeholder="e.g. 14 – 22 Feb 2026" />
              <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => removeListItem('blackoutDates', i)} aria-label="Remove blackout line">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-display">What's Included / Not Included</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Included</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addListItem('inclusions')}>
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
              {formState.inclusions.map((x, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={x} onChange={(e) => setListItem('inclusions', i, e.target.value)} placeholder="Included item" />
                  <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => removeListItem('inclusions', i)} aria-label="Remove inclusion">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Not included</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addListItem('exclusions')}>
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
              {formState.exclusions.map((x, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={x} onChange={(e) => setListItem('exclusions', i, e.target.value)} placeholder="Excluded item" />
                  <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => removeListItem('exclusions', i)} aria-label="Remove exclusion">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-display">Remarks & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => addListItem('importantNotes')}>
              <Plus className="mr-1 h-3 w-3" /> Add remark line
            </Button>
          </div>
          {formState.importantNotes.map((x, i) => (
            <div key={i} className="flex gap-2">
              <Input value={x} onChange={(e) => setListItem('importantNotes', i, e.target.value)} placeholder="Remark line" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-600"
                onClick={() => removeListItem('importantNotes', i)}
                aria-label="Remove remark line"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="text-xs text-muted-foreground">
            If one of your lines contains “TDAC” or “Digital Arrival Card”, the public page will show a separate TDAC card.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-display">Primary itinerary (4D3N)</CardTitle>
        </CardHeader>
        <CardContent>
          <ItineraryDaysEditor days={formState.itinerary} onChange={(next) => setFormState((p) => ({ ...p, itinerary: next }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-display">Secondary itinerary (5D4N)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Secondary tab title</Label>
            <Input value={formState.secondaryTitle} onChange={(e) => setFormState((p) => ({ ...p, secondaryTitle: e.target.value }))} />
          </div>
          <ItineraryDaysEditor
            days={formState.secondaryItinerary}
            onChange={(next) => setFormState((p) => ({ ...p, secondaryItinerary: next }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-display">Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formState.contactPhone} onChange={(e) => setFormState((p) => ({ ...p, contactPhone: e.target.value }))} placeholder="+971 52 516 3595" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formState.contactEmail} onChange={(e) => setFormState((p) => ({ ...p, contactEmail: e.target.value }))} placeholder="mohameedmusthafa9131@gmail.com" />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={formState.contactInstagram} onChange={(e) => setFormState((p) => ({ ...p, contactInstagram: e.target.value }))} placeholder="@triply.squad" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 border-t pt-6">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-brand-orange hover:bg-brand-orange/90" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === 'edit' ? 'Save package' : 'Create package'}
        </Button>
      </div>
    </form>
  );
}

