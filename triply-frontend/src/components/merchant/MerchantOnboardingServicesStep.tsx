'use client';

import { Plus, X, Trash2, ChevronDown, ChevronRight, Upload } from 'lucide-react';
import type { MutableRefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ServiceItem, ServicePointGroup } from '@/lib/merchant-onboarding/types';

interface ServiceSections {
  basic: boolean;
  points: boolean;
  includedExcluded: boolean;
  images: boolean;
}

interface MerchantOnboardingServicesStepProps {
  services: ServiceItem[];
  minServiceImages: number;
  serviceImageUploadRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  getServiceSections: (id: string) => ServiceSections;
  toggleServiceSection: (id: string, key: keyof ServiceSections) => void;
  updateService: (id: string, patch: Partial<ServiceItem>) => void;
  addService: () => void;
  removeService: (id: string) => void;
  addServicePoint: (id: string) => void;
  removeServicePoint: (id: string, index: number) => void;
  setServicePointText: (id: string, index: number, text: string) => void;
  addServiceSubPoint: (id: string, index: number) => void;
  setServiceSubPoint: (id: string, index: number, subIndex: number, value: string) => void;
  removeServiceSubPoint: (id: string, index: number, subIndex: number) => void;
  addServiceListItem: (id: string, key: 'includes' | 'excludes') => void;
  setServiceListItem: (id: string, key: 'includes' | 'excludes', index: number, value: string) => void;
  removeServiceListItem: (id: string, key: 'includes' | 'excludes', index: number) => void;
  setServiceImages: (id: string, files: File[]) => void;
}

export function MerchantOnboardingServicesStep({
  services,
  minServiceImages,
  serviceImageUploadRefs,
  getServiceSections,
  toggleServiceSection,
  updateService,
  addService,
  removeService,
  addServicePoint,
  removeServicePoint,
  setServicePointText,
  addServiceSubPoint,
  setServiceSubPoint,
  removeServiceSubPoint,
  addServiceListItem,
  setServiceListItem,
  removeServiceListItem,
  setServiceImages,
}: MerchantOnboardingServicesStepProps) {
  return (
    <>
      <p className="text-sm font-medium text-foreground border-b border-border pb-2">Services</p>
      <p className="text-xs text-muted-foreground">Add at least one service. Min {minServiceImages} image(s) per service.</p>
      {services.map((svc) => (
        <div key={svc.id} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {svc.title?.trim() ? svc.title : 'New service'}
              </p>
              <p className="text-xs text-muted-foreground">Add details, points & inclusions, then upload images.</p>
            </div>
            {services.length > 1 && (
              <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-600" onClick={() => removeService(svc.id)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="border-t border-border">
            <button type="button" className="flex w-full items-center justify-between p-4 text-left font-medium" onClick={() => toggleServiceSection(svc.id, 'basic')}>
              Basic info
              {getServiceSections(svc.id).basic ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {getServiceSections(svc.id).basic && (
              <div className="space-y-4 border-t border-border px-4 pb-4 pt-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm text-foreground">Title *</Label>
                  <Input value={svc.title} onChange={(e) => updateService(svc.id, { title: e.target.value })} placeholder="e.g. Premium Dubai Desert Safari" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm text-foreground">Price (AED) *</Label>
                    <Input type="number" value={svc.price} onChange={(e) => updateService(svc.id, { price: e.target.value })} placeholder="250" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Duration</Label>
                    <Input value={svc.duration} onChange={(e) => updateService(svc.id, { duration: e.target.value })} placeholder="e.g. 6 hours" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Max group size</Label>
                    <Input type="number" value={svc.groupSize} onChange={(e) => updateService(svc.id, { groupSize: e.target.value })} placeholder="20" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Languages</Label>
                    <Input value={svc.languages} onChange={(e) => updateService(svc.id, { languages: e.target.value })} placeholder="English, Arabic" />
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm text-foreground">Description *</Label>
                  <Textarea value={svc.description} onChange={(e) => updateService(svc.id, { description: e.target.value })} placeholder="Describe your service..." rows={4} className="resize-y" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border">
            <button type="button" className="flex w-full items-center justify-between p-4 text-left font-medium" onClick={() => toggleServiceSection(svc.id, 'points')}>
              Points & sub-points
              {getServiceSections(svc.id).points ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {getServiceSections(svc.id).points && (
              <div className="space-y-4 border-t border-border px-4 pb-4 pt-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Heading (optional)</Label>
                  <Input value={svc.pointsHeading ?? ''} onChange={(e) => updateService(svc.id, { pointsHeading: e.target.value })} placeholder="e.g. Highlights" />
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => addServicePoint(svc.id)}>
                    <Plus className="mr-1 h-4 w-4" /> Add point
                  </Button>
                </div>
                {(svc.pointGroups?.length ? svc.pointGroups : [{ text: '', subPoints: [] }]).map((g: ServicePointGroup, gIdx: number) => (
                  <Card key={gIdx} className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-sm">Point {gIdx + 1}</Label>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => addServiceSubPoint(svc.id, gIdx)}>
                          <Plus className="mr-1 h-3 w-3" /> Sub-point
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => removeServicePoint(svc.id, gIdx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Input value={g.text} onChange={(e) => setServicePointText(svc.id, gIdx, e.target.value)} placeholder="Main point text" />
                    {(g.subPoints || []).map((sp, sIdx) => (
                      <div key={sIdx} className="flex gap-2 pl-4">
                        <Input value={sp} onChange={(e) => setServiceSubPoint(svc.id, gIdx, sIdx, e.target.value)} placeholder="Sub-point" className="text-sm" />
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-red-600" onClick={() => removeServiceSubPoint(svc.id, gIdx, sIdx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border">
            <button type="button" className="flex w-full items-center justify-between p-4 text-left font-medium" onClick={() => toggleServiceSection(svc.id, 'includedExcluded')}>
              Includes & excludes
              {getServiceSections(svc.id).includedExcluded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {getServiceSections(svc.id).includedExcluded && (
              <div className="space-y-6 border-t border-border px-4 pb-4 pt-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-base font-semibold">What&apos;s Included</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addServiceListItem(svc.id, 'includes')}>
                      <Plus className="mr-1 h-3 w-3" /> Add
                    </Button>
                  </div>
                  {(svc.includes?.length ? svc.includes : ['']).map((item, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <Input value={item} onChange={(e) => setServiceListItem(svc.id, 'includes', i, e.target.value)} placeholder="e.g. Transport" />
                      <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => removeServiceListItem(svc.id, 'includes', i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-base font-semibold">What&apos;s Excluded</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addServiceListItem(svc.id, 'excludes')}>
                      <Plus className="mr-1 h-3 w-3" /> Add
                    </Button>
                  </div>
                  {(svc.excludes?.length ? svc.excludes : ['']).map((item, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <Input value={item} onChange={(e) => setServiceListItem(svc.id, 'excludes', i, e.target.value)} placeholder="e.g. Personal expenses" />
                      <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => removeServiceListItem(svc.id, 'excludes', i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border">
            <button type="button" className="flex w-full items-center justify-between p-4 text-left font-medium" onClick={() => toggleServiceSection(svc.id, 'images')}>
              Images (min {minServiceImages})
              {getServiceSections(svc.id).images ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {getServiceSections(svc.id).images && (
              <div className="space-y-4 border-t border-border px-4 pb-4 pt-2">
                <input
                  ref={(el) => {
                    serviceImageUploadRefs.current[svc.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setServiceImages(svc.id, [...svc.images, ...files].slice(0, 5));
                  }}
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
                    const files = Array.from(e.dataTransfer.files ?? []);
                    setServiceImages(svc.id, [...svc.images, ...files].slice(0, 5));
                  }}
                  onClick={() => serviceImageUploadRefs.current[svc.id]?.click()}
                >
                  <Upload className="mx-auto mb-2 h-6 w-6" />
                  Drag & drop or click to upload (max {Math.max(0, 5 - svc.images.length)} more)
                </div>
                {svc.images.length > 0 && <p className="text-xs text-muted-foreground">{svc.images.length} file(s) selected</p>}
              </div>
            )}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addService} className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add another service
      </Button>
    </>
  );
}
