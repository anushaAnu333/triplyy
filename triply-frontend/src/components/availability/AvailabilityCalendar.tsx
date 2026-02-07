'use client';

import { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { Lock, Unlock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import ReusableCalendar, { DateAvailability } from '@/components/common/ReusableCalendar';

export interface AvailabilityData {
  _id?: string;
  date: string;
  availableSlots: number;
  bookedSlots: number;
  isBlocked?: boolean;
  isAvailable?: boolean;
  price?: number;
}

interface AvailabilityCalendarProps {
  // Data
  items: Array<{ _id: string; name: string; [key: string]: any }>;
  selectedItemId: string;
  onItemChange: (itemId: string) => void;
  availability?: AvailabilityData[];
  isLoadingAvailability?: boolean;
  
  // Actions
  onUpdateSlots?: (dates: string[], slots: number) => Promise<void>;
  onBlockDates?: (dates: string[], isBlocked: boolean) => Promise<void>;
  
  // UI
  title?: string;
  description?: string;
  itemLabel?: string;
  itemPlaceholder?: string;
  emptyMessage?: string;
  
  // Query invalidation
  onSuccess?: () => void;
}

export default function AvailabilityCalendar({
  items,
  selectedItemId,
  onItemChange,
  availability = [],
  isLoadingAvailability = false,
  onUpdateSlots,
  onBlockDates,
  title = 'Availability Calendar',
  description = 'Select dates to manage availability',
  itemLabel = 'Select Item',
  itemPlaceholder = 'Select an item',
  emptyMessage = 'Please select an item to manage availability',
  onSuccess,
}: AvailabilityCalendarProps) {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleDateSelection = (date: Date) => {
    setSelectedDates(prev => {
      const isSelected = prev.some(d => isSameDay(d, date));
      if (isSelected) {
        return prev.filter(d => !isSameDay(d, date));
      }
      return [...prev, date];
    });
  };

  // Transform availability data to ReusableCalendar format
  const calendarAvailability: DateAvailability[] = availability?.map(avail => ({
    date: avail.date,
    availableSlots: avail.availableSlots,
    bookedSlots: avail.bookedSlots,
    isAvailable: avail.isAvailable !== false && !avail.isBlocked,
    isBlocked: avail.isBlocked === true || avail.isAvailable === false,
    remainingSlots: avail.availableSlots - avail.bookedSlots,
  })) || [];

  const handleUpdateSlots = async () => {
    if (!selectedSlots || selectedDates.length === 0 || !onUpdateSlots) return;
    
    setIsUpdating(true);
    try {
      const dates = selectedDates.map(d => format(d, 'yyyy-MM-dd'));
      await onUpdateSlots(dates, selectedSlots);
      toast({ title: 'Slots updated successfully' });
      setSelectedDates([]);
      setSelectedSlots(null);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Failed to update slots',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBlockDates = async (block: boolean) => {
    if (selectedDates.length === 0 || !onBlockDates) return;
    
    setIsUpdating(true);
    try {
      const dates = selectedDates.map(d => format(d, 'yyyy-MM-dd'));
      await onBlockDates(dates, block);
      toast({ title: `Dates ${block ? 'blocked' : 'unblocked'} successfully` });
      setSelectedDates([]);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: `Failed to ${block ? 'block' : 'unblock'} dates`,
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
              <Select value={selectedItemId} onValueChange={onItemChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder={itemPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedItemId ? (
              <div className="text-center py-12 text-muted-foreground">
                {emptyMessage}
              </div>
            ) : isLoadingAvailability ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ReusableCalendar
                mode="multiple"
                availability={calendarAvailability}
                selectedDates={selectedDates}
                onDateSelect={toggleDateSelection}
                allowPastDates={true}
                showSlots={false}
                showLegend={true}
              />
            )}
            
          </CardContent>
        </Card>
      </div>

      {/* Actions Panel */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {selectedDates.length} date(s) selected
              </p>
            </div>

            {selectedDates.length > 0 && (
              <>
                {onUpdateSlots && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Set Total Slots</label>
                    <div className="flex gap-2">
                      {[5, 10, 20, 50].map((slots) => (
                        <Button
                          key={slots}
                          variant={selectedSlots === slots ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedSlots(slots)}
                          className="flex-1"
                        >
                          {slots}
                        </Button>
                      ))}
                    </div>
                    {selectedSlots && (
                      <Button
                        onClick={handleUpdateSlots}
                        disabled={isUpdating}
                        className="w-full mt-2"
                        size="sm"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Slots'
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {onBlockDates && (
                  <div className="space-y-2 pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={() => handleBlockDates(true)}
                      disabled={isUpdating}
                      className="w-full"
                      size="sm"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Block Dates
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleBlockDates(false)}
                      disabled={isUpdating}
                      className="w-full"
                      size="sm"
                    >
                      <Unlock className="mr-2 h-4 w-4" />
                      Unblock Dates
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedDates([]);
                    setSelectedSlots(null);
                  }}
                  className="w-full"
                  size="sm"
                >
                  Clear Selection
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
