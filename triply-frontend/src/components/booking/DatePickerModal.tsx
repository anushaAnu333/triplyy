'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { bookingsApi } from '@/lib/api/bookings';
import ReusableCalendar from '@/components/common/ReusableCalendar';

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

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
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
          <ReusableCalendar
            mode="range"
            dateRange={dateRange}
            onDateRangeSelect={setDateRange}
            minDate={addDays(new Date(), 7)}
            allowPastDates={false}
            showSlots={false}
            showLegend={true}
          />

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

