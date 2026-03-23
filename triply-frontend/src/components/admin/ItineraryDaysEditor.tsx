'use client';

import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { ItineraryDay, ItineraryPointGroup } from '@/lib/api/destinations';

function emptyPointGroup(): ItineraryPointGroup {
  return { text: '', subPoints: [] };
}

export const emptyItineraryDay = (): ItineraryDay => ({
  day: '',
  meals: [],
  highlights: [],
  subHighlights: [],
  pointGroups: [emptyPointGroup()],
});

interface ItineraryDaysEditorProps {
  days: ItineraryDay[];
  onChange: (days: ItineraryDay[]) => void;
}

/**
 * Reusable day-by-day editor (points + sub-points) — same behaviour as destination form.
 */
export function ItineraryDaysEditor({ days, onChange }: ItineraryDaysEditorProps) {
  const setItineraryDay = (
    dayIndex: number,
    field: keyof ItineraryDay,
    value: string | string[] | ItineraryPointGroup[] | undefined
  ) => {
    const next = [...days];
    const current = next[dayIndex] ?? emptyItineraryDay();
    next[dayIndex] = { ...current, [field]: value };
    onChange(next);
  };

  const setPointGroup = (
    dayIndex: number,
    groupIndex: number,
    field: 'text' | 'subPoints',
    value: string | string[]
  ) => {
    const day = days[dayIndex];
    if (!day) return;
    const groups = [...(day.pointGroups || [emptyPointGroup()])];
    if (!groups[groupIndex]) groups[groupIndex] = emptyPointGroup();
    groups[groupIndex] = { ...groups[groupIndex], [field]: value };
    setItineraryDay(dayIndex, 'pointGroups', groups);
  };

  const addPointGroupSubPoint = (dayIndex: number, groupIndex: number) => {
    const day = days[dayIndex];
    const groups = [...(day?.pointGroups || [emptyPointGroup()])];
    if (!groups[groupIndex]) groups[groupIndex] = emptyPointGroup();
    groups[groupIndex].subPoints = [...(groups[groupIndex].subPoints || []), ''];
    setItineraryDay(dayIndex, 'pointGroups', groups);
  };

  const setPointGroupSubPoint = (dayIndex: number, groupIndex: number, subIndex: number, value: string) => {
    const day = days[dayIndex];
    const groups = [...(day?.pointGroups || [emptyPointGroup()])];
    if (!groups[groupIndex]) groups[groupIndex] = emptyPointGroup();
    const sub = [...(groups[groupIndex].subPoints || [])];
    sub[subIndex] = value;
    groups[groupIndex].subPoints = sub;
    setItineraryDay(dayIndex, 'pointGroups', groups);
  };

  const removePointGroupSubPoint = (dayIndex: number, groupIndex: number, subIndex: number) => {
    const day = days[dayIndex];
    const groups = [...(day?.pointGroups || [emptyPointGroup()])];
    if (!groups[groupIndex]) return;
    groups[groupIndex].subPoints = (groups[groupIndex].subPoints || []).filter((_, i) => i !== subIndex);
    setItineraryDay(dayIndex, 'pointGroups', groups);
  };

  const addItineraryDay = () => {
    onChange([...days, { ...emptyItineraryDay(), pointGroups: [emptyPointGroup()] }]);
  };

  const addPointGroup = (dayIndex: number) => {
    const day = days[dayIndex];
    const groups = [...(day?.pointGroups || [emptyPointGroup()]), emptyPointGroup()];
    setItineraryDay(dayIndex, 'pointGroups', groups);
  };

  const removePointGroup = (dayIndex: number, groupIndex: number) => {
    const day = days[dayIndex];
    const groups = (day?.pointGroups || []).filter((_, i) => i !== groupIndex);
    setItineraryDay(dayIndex, 'pointGroups', groups.length ? groups : [emptyPointGroup()]);
  };

  const removeItineraryDay = (index: number) => {
    onChange(days.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={addItineraryDay}>
          <Plus className="mr-1 h-4 w-4" /> Add Day
        </Button>
      </div>
      {days.map((day, dayIndex) => {
        const groups = day.pointGroups?.length ? day.pointGroups : [emptyPointGroup()];
        return (
          <Card key={dayIndex} className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">Day {dayIndex + 1}</span>
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
                placeholder='e.g. Day 1: Arrival (No Meal)'
              />
            </div>
            <div className="space-y-1">
              <Label>Day meals (B / L / D)</Label>
              <div className="flex flex-wrap gap-4 items-center">
                {(['B', 'L', 'D'] as const).map((m) => {
                  const checked = (day.meals || []).includes(m);
                  return (
                    <label key={m} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(day.meals || []);
                          if (e.target.checked) next.add(m);
                          else next.delete(m);
                          setItineraryDay(dayIndex, 'meals', Array.from(next));
                        }}
                      />
                      <span className="font-medium">{m}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            {groups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2 rounded border p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Point {gIdx + 1}</Label>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => addPointGroupSubPoint(dayIndex, gIdx)}>
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
                      onChange={(e) => setPointGroupSubPoint(dayIndex, gIdx, sIdx, e.target.value)}
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
            <Button type="button" variant="outline" size="sm" onClick={() => addPointGroup(dayIndex)}>
              <Plus className="mr-1 h-4 w-4" /> Add point
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Overnight (optional)</Label>
                <Input
                  value={day.overnight || ''}
                  onChange={(e) => setItineraryDay(dayIndex, 'overnight', e.target.value)}
                  placeholder="e.g. Bangkok"
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
  );
}

/** Normalize to API payload (same rules as destination form). */
export function serializeItineraryForApi(itinerary: ItineraryDay[]): Record<string, unknown>[] | undefined {
  if (!itinerary.length) return undefined;
  return itinerary
    .map((d, index) => {
      const groups = d.pointGroups?.length ? d.pointGroups : [{ text: '', subPoints: [] as string[] }];
      const highlights = groups.map((g) => g.text).filter(Boolean);
      const subHighlights = groups.flatMap((g) => g.subPoints || []).filter(Boolean);
      const dayHeading = (d.day || '').trim() || `Day ${index + 1}`;
      const meals = Array.isArray(d.meals) ? d.meals.map((m) => String(m).trim().toUpperCase()).filter((m) => ['B', 'L', 'D'].includes(m)) : undefined;
      return {
        day: dayHeading,
        highlights,
        subHighlights: subHighlights.length ? subHighlights : undefined,
        pointGroups: groups.filter((g) => g.text || (g.subPoints?.length ?? 0) > 0).length ? groups : undefined,
        extra: d.extra,
        meals: meals && meals.length ? meals : undefined,
        checkin: d.checkin,
        overnight: d.overnight,
      };
    })
    .filter((d) => (d.day as string).length > 0);
}
