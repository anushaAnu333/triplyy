'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, ChevronDown, ChevronRight, Upload, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { destinationsApi, Destination, ItineraryDay, ItineraryPointGroup } from '@/lib/api/destinations';
import api from '@/lib/api/axios';

const MAX_IMAGES = 5;

function emptyPointGroup(): ItineraryPointGroup {
  return { text: '', subPoints: [] };
}

const emptyItineraryDay = (): ItineraryDay => ({
  day: '',
  highlights: [],
  subHighlights: [],
  pointGroups: [],
});

const initialFormData = {
  name: '',
  description: '',
  shortDescription: '',
  country: '',
  region: '',
  depositAmount: 199,
  durationDays: 1,
  durationNights: 1,
  thumbnailImage: '',
  images: [] as string[],
  itinerary: [] as ItineraryDay[],
  inclusions: [] as string[],
  exclusions: [] as string[],
  highlights: [] as string[],
};

export interface DestinationFormProps {
  mode: 'create' | 'edit';
  initialData?: Destination | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DestinationForm({ mode, initialData, onSuccess, onCancel }: DestinationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const thumbnailUploadRef = useRef<HTMLInputElement>(null);

  const [openSections, setOpenSections] = useState({
    basic: true,
    images: false,
    itinerary: false,
    includedExcluded: false,
  });
  const [formData, setFormData] = useState(initialFormData);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const itinerary = (initialData.itinerary || []).map((d) => {
        let pointGroups: ItineraryPointGroup[] = d.pointGroups?.length ? d.pointGroups : [];
        if (!pointGroups.length && (d.highlights?.length || d.subHighlights?.length)) {
          pointGroups = (d.highlights || []).map((h, i) => ({
            text: h,
            subPoints: i === 0 ? (d.subHighlights || []) : [],
          }));
        }
        if (!pointGroups.length) pointGroups = [emptyPointGroup()];
        return {
          day: d.day,
          highlights: d.highlights || [],
          subHighlights: d.subHighlights || [],
          pointGroups,
          extra: d.extra,
          checkin: d.checkin,
          overnight: d.overnight,
        };
      });
      setFormData({
        name: initialData.name,
        description: initialData.description,
        shortDescription: initialData.shortDescription || '',
        country: initialData.country,
        region: initialData.region || '',
        depositAmount: initialData.depositAmount,
        durationDays: initialData.duration.days,
        durationNights: initialData.duration.nights,
        thumbnailImage: initialData.thumbnailImage || '',
        images: Array.isArray(initialData.images) ? initialData.images.slice(0, MAX_IMAGES) : [],
        itinerary: itinerary.length ? itinerary : [],
        inclusions: initialData.inclusions || [],
        exclusions: initialData.exclusions || [],
        highlights: initialData.highlights || [],
      });
    }
  }, [mode, initialData]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/destinations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-destinations'] });
      toast({ title: 'Destination created successfully' });
      onSuccess();
    },
    onError: () => {
      toast({ title: 'Failed to create destination', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/destinations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-destinations'] });
      toast({ title: 'Destination updated successfully' });
      onSuccess();
    },
    onError: () => {
      toast({ title: 'Failed to update destination', variant: 'destructive' });
    },
  });

  const setItineraryDay = (
    dayIndex: number,
    field: keyof ItineraryDay,
    value: string | string[] | ItineraryPointGroup[] | undefined
  ) => {
    const next = [...formData.itinerary];
    const current = next[dayIndex] ?? emptyItineraryDay();
    next[dayIndex] = { ...current, [field]: value };
    setFormData({ ...formData, itinerary: next });
  };

  const setPointGroup = (
    dayIndex: number,
    groupIndex: number,
    field: 'text' | 'subPoints',
    value: string | string[]
  ) => {
    const day = formData.itinerary[dayIndex];
    if (!day) return;
    const groups = [...(day.pointGroups || [emptyPointGroup()])];
    if (!groups[groupIndex]) groups[groupIndex] = emptyPointGroup();
    groups[groupIndex] = { ...groups[groupIndex], [field]: value };
    setItineraryDay(dayIndex, 'pointGroups', groups);
  };

  const addPointGroupSubPoint = (dayIndex: number, groupIndex: number) => {
    const day = formData.itinerary[dayIndex];
    const groups = [...(day?.pointGroups || [emptyPointGroup()])];
    if (!groups[groupIndex]) groups[groupIndex] = emptyPointGroup();
    groups[groupIndex].subPoints = [...(groups[groupIndex].subPoints || []), ''];
    setItineraryDay(dayIndex, 'pointGroups', groups);
  };

  const setPointGroupSubPoint = (
    dayIndex: number,
    groupIndex: number,
    subIndex: number,
    value: string
  ) => {
    const day = formData.itinerary[dayIndex];
    const groups = [...(day?.pointGroups || [emptyPointGroup()])];
    if (!groups[groupIndex]) groups[groupIndex] = emptyPointGroup();
    const sub = [...(groups[groupIndex].subPoints || [])];
    sub[subIndex] = value;
    groups[groupIndex].subPoints = sub;
    setItineraryDay(dayIndex, 'pointGroups', groups);
  };

  const removePointGroupSubPoint = (dayIndex: number, groupIndex: number, subIndex: number) => {
    const day = formData.itinerary[dayIndex];
    const groups = [...(day?.pointGroups || [emptyPointGroup()])];
    if (!groups[groupIndex]) return;
    groups[groupIndex].subPoints = (groups[groupIndex].subPoints || []).filter(
      (_, i) => i !== subIndex
    );
    setItineraryDay(dayIndex, 'pointGroups', groups);
  };

  const addItineraryDay = () => {
    setFormData({
      ...formData,
      itinerary: [
        ...formData.itinerary,
        { ...emptyItineraryDay(), pointGroups: [emptyPointGroup()] },
      ],
    });
  };

  const addPointGroup = (dayIndex: number) => {
    const day = formData.itinerary[dayIndex];
    const groups = [...(day?.pointGroups || [emptyPointGroup()]), emptyPointGroup()];
    setItineraryDay(dayIndex, 'pointGroups', groups);
  };

  const removePointGroup = (dayIndex: number, groupIndex: number) => {
    const day = formData.itinerary[dayIndex];
    const groups = (day?.pointGroups || []).filter((_, i) => i !== groupIndex);
    setItineraryDay(dayIndex, 'pointGroups', groups.length ? groups : [emptyPointGroup()]);
  };

  const removeItineraryDay = (index: number) => {
    setFormData({
      ...formData,
      itinerary: formData.itinerary.filter((_, i) => i !== index),
    });
  };

  const addListItem = (field: 'inclusions' | 'exclusions' | 'highlights') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const setListItem = (
    field: 'inclusions' | 'exclusions' | 'highlights',
    index: number,
    value: string
  ) => {
    const arr = [...formData[field]];
    arr[index] = value;
    setFormData({ ...formData, [field]: arr });
  };

  const removeListItem = (field: 'inclusions' | 'exclusions' | 'highlights', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const handleThumbnailUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    setUploadingThumbnail(true);
    try {
      const { urls } = await destinationsApi.uploadImages([file]);
      if (urls[0]) setFormData((prev) => ({ ...prev, thumbnailImage: urls[0] }));
      else toast({ title: 'Thumbnail upload failed', variant: 'destructive' });
    } catch {
      toast({ title: 'Thumbnail upload failed', variant: 'destructive' });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = MAX_IMAGES - formData.images.length;
    if (remaining <= 0) {
      toast({ title: 'Maximum 5 images allowed', variant: 'destructive' });
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploadingImages(true);
    try {
      const { urls } = await destinationsApi.uploadImages(toUpload);
      setFormData({
        ...formData,
        images: [...formData.images, ...urls].slice(0, MAX_IMAGES),
      });
      if (urls.length < toUpload.length)
        toast({ title: 'Some uploads failed', variant: 'destructive' });
    } catch {
      toast({ title: 'Image upload failed', variant: 'destructive' });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: formData.name,
      description: formData.description,
      shortDescription: formData.shortDescription || undefined,
      country: formData.country,
      region: formData.region || undefined,
      depositAmount: formData.depositAmount,
      duration: { days: formData.durationDays, nights: formData.durationNights },
      thumbnailImage: formData.thumbnailImage || formData.images[0] || undefined,
      images: formData.images.length ? formData.images : undefined,
      itinerary: formData.itinerary.length
        ? formData.itinerary
            .map((d, index) => {
              const groups = d.pointGroups?.length
                ? d.pointGroups
                : [{ text: '', subPoints: [] as string[] }];
              const highlights = groups.map((g) => g.text).filter(Boolean);
              const subHighlights = groups.flatMap((g) => g.subPoints || []).filter(Boolean);
              const dayHeading = (d.day || '').trim() || `Day ${index + 1}`;
              return {
                day: dayHeading,
                highlights,
                subHighlights: subHighlights.length ? subHighlights : undefined,
                pointGroups:
                  groups.filter((g) => g.text || (g.subPoints?.length ?? 0) > 0).length
                    ? groups
                    : undefined,
                extra: d.extra,
                checkin: d.checkin,
                overnight: d.overnight,
              };
            })
            .filter((d) => d.day.length > 0)
        : undefined,
      inclusions: formData.inclusions.filter(Boolean),
      exclusions: formData.exclusions.filter(Boolean),
      highlights: formData.highlights.filter(Boolean),
    };

    if (mode === 'edit' && initialData) {
      updateMutation.mutate({ id: initialData._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <section className="rounded-xl border bg-card p-1">
        <button
          type="button"
          className="flex w-full items-center justify-between p-4 text-left font-medium"
          onClick={() => setOpenSections((s) => ({ ...s, basic: !s.basic }))}
        >
          Basic info
          {openSections.basic ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {openSections.basic && (
          <div className="space-y-4 border-t px-4 pb-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="min-h-[120px] w-full rounded-lg border p-3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Short Description (optional)</Label>
              <Input
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief summary for cards"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Deposit Amount (AED)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.depositAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, depositAmount: parseInt(e.target.value) || 0 })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Days</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.durationDays}
                  onChange={(e) =>
                    setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nights</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.durationNights}
                  onChange={(e) =>
                    setFormData({ ...formData, durationNights: parseInt(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Thumbnail Image URL (or use first gallery image)</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={formData.thumbnailImage}
                  onChange={(e) => setFormData({ ...formData, thumbnailImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                <input
                  ref={thumbnailUploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleThumbnailUpload(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingThumbnail}
                  onClick={() => thumbnailUploadRef.current?.click()}
                >
                  {uploadingThumbnail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="ml-1.5 hidden sm:inline">
                    {uploadingThumbnail ? 'Uploading…' : 'Upload'}
                  </span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste a URL or click Upload to choose an image from your device.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Images */}
      <section className="rounded-xl border bg-card p-1">
        <button
          type="button"
          className="flex w-full items-center justify-between p-4 text-left font-medium"
          onClick={() => setOpenSections((s) => ({ ...s, images: !s.images }))}
        >
          Images (up to 5)
          {openSections.images ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {openSections.images && (
          <div className="space-y-4 border-t px-4 pb-4 pt-2">
            <input
              ref={imageUploadRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />
            <div
              className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground hover:bg-muted/50"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-muted/50');
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove('bg-muted/50')}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-muted/50');
                handleImageUpload(e.dataTransfer.files);
              }}
              onClick={() => imageUploadRef.current?.click()}
            >
              {uploadingImages ? (
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
              ) : (
                <Upload className="mx-auto mb-2 h-6 w-6" />
              )}
              Drag & drop or click to upload (max {MAX_IMAGES - formData.images.length} more)
            </div>
            {formData.images.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const arr = [...formData.images];
                    arr[i] = e.target.value;
                    setFormData({ ...formData, images: arr });
                  }}
                  placeholder="Image URL"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-red-600"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      images: formData.images.filter((_, j) => j !== i),
                    })
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {formData.images.length < MAX_IMAGES && (
              <Input
                placeholder="Or paste image URL and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) {
                      setFormData({
                        ...formData,
                        images: [...formData.images, v].slice(0, MAX_IMAGES),
                      });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            )}
          </div>
        )}
      </section>

      {/* Itinerary */}
      <section className="rounded-xl border bg-card p-1">
        <button
          type="button"
          className="flex w-full items-center justify-between p-4 text-left font-medium"
          onClick={() => setOpenSections((s) => ({ ...s, itinerary: !s.itinerary }))}
        >
          Itinerary (day heading, then points with sub-points)
          {openSections.itinerary ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {openSections.itinerary && (
          <div className="space-y-4 border-t px-4 pb-4 pt-2">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={addItineraryDay}>
                <Plus className="mr-1 h-4 w-4" /> Add Day
              </Button>
            </div>
            {formData.itinerary.map((day, dayIndex) => {
              const groups = day.pointGroups?.length ? day.pointGroups : [emptyPointGroup()];
              return (
                <Card key={dayIndex} className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Day {dayIndex + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => removeItineraryDay(dayIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Day heading</Label>
                    <Input
                      value={day.day}
                      onChange={(e) => setItineraryDay(dayIndex, 'day', e.target.value)}
                      placeholder="e.g. 01 - Arrival at Baku & City tour"
                    />
                  </div>
                  {groups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-2 rounded border p-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Point {gIdx + 1}</Label>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addPointGroupSubPoint(dayIndex, gIdx)}
                          >
                            <Plus className="mr-1 h-3 w-3" /> Sub-point
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => removePointGroup(dayIndex, gIdx)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        value={group.text}
                        onChange={(e) => setPointGroup(dayIndex, gIdx, 'text', e.target.value)}
                        placeholder="Main point text"
                      />
                      {(group.subPoints || []).map((sp, sIdx) => (
                        <div key={sIdx} className="flex gap-2 pl-4">
                          <Input
                            value={sp}
                            onChange={(e) =>
                              setPointGroupSubPoint(dayIndex, gIdx, sIdx, e.target.value)
                            }
                            placeholder="Sub-point"
                            className="text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-red-600"
                            onClick={() => removePointGroupSubPoint(dayIndex, gIdx, sIdx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPointGroup(dayIndex)}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add point
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Overnight (optional)</Label>
                      <Input
                        value={day.overnight || ''}
                        onChange={(e) => setItineraryDay(dayIndex, 'overnight', e.target.value)}
                        placeholder="e.g. Baku"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Check-in (optional)</Label>
                      <Input
                        value={day.checkin || ''}
                        onChange={(e) => setItineraryDay(dayIndex, 'checkin', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Inclusions / Exclusions / Highlights */}
      <section className="rounded-xl border bg-card p-1">
        <button
          type="button"
          className="flex w-full items-center justify-between p-4 text-left font-medium"
          onClick={() =>
            setOpenSections((s) => ({ ...s, includedExcluded: !s.includedExcluded }))
          }
        >
          Inclusions, Exclusions & Trip Highlights
          {openSections.includedExcluded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {openSections.includedExcluded && (
          <div className="space-y-6 border-t px-4 pb-4 pt-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-base font-semibold">What&apos;s Included</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addListItem('inclusions')}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
              {formData.inclusions.map((item, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => setListItem('inclusions', i, e.target.value)}
                    placeholder="e.g. Return airport transfers"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    onClick={() => removeListItem('inclusions', i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-base font-semibold">What&apos;s Excluded</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addListItem('exclusions')}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
              {formData.exclusions.map((item, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => setListItem('exclusions', i, e.target.value)}
                    placeholder="e.g. Visa"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    onClick={() => removeListItem('exclusions', i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-base font-semibold">Trip Highlights</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addListItem('highlights')}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
              {formData.highlights.map((item, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => setListItem('highlights', i, e.target.value)}
                    placeholder="e.g. Shahdag Resort"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    onClick={() => removeListItem('highlights', i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="flex gap-3 border-t pt-6">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'edit' ? 'Update' : 'Create'} Destination
        </Button>
      </div>
    </form>
  );
}
