'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Check } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { bookingsApi } from '@/lib/api/bookings';
import { cn } from '@/lib/utils';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  destinationId?: string;
}

export function DatePickerModal({ 
  isOpen, 
  onClose, 
  bookingId,
  destinationId 
}: DatePickerModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isFlexible, setIsFlexible] = useState(false);

  const selectDatesMutation = useMutation({
    mutationFn: () => {
      if (!dateRange?.from || !dateRange?.to) {
        throw new Error('Please select both start and end dates');
      }
      return bookingsApi.selectDates(
        bookingId,
        dateRange.from.toISOString(),
        dateRange.to.toISOString(),
        isFlexible
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      toast({
        title: 'Dates Selected!',
        description: 'Your travel dates have been submitted for confirmation.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to select dates',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: 'Select Dates',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }
    selectDatesMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Select Travel Dates
          </DialogTitle>
          <DialogDescription>
            Choose your preferred travel dates. Admin will confirm availability.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-center">
            <DayPicker
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              disabled={{ before: addDays(new Date(), 7) }}
              numberOfMonths={1}
              className="rounded-md border"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative",
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
                ),
                day_range_start: "day-range-start",
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>

          {dateRange?.from && dateRange?.to && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Selected dates:</p>
              <p className="font-semibold">
                {format(dateRange.from, 'PPP')} - {format(dateRange.to, 'PPP')}
              </p>
            </div>
          )}

          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFlexible}
                onChange={(e) => setIsFlexible(e.target.checked)}
                className="rounded border-input"
              />
              <span className="text-sm">I'm flexible with these dates (±2 days)</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!dateRange?.from || !dateRange?.to || selectDatesMutation.isPending}
            className="flex-1"
          >
            {selectDatesMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Confirm Dates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

