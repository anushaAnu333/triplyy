'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isPast, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DateAvailability {
  date: string | Date;
  availableSlots?: number;
  bookedSlots?: number;
  isAvailable?: boolean;
  isBlocked?: boolean;
  price?: number;
  remainingSlots?: number;
}

export type CalendarSelectionMode = 'single' | 'multiple' | 'range';

interface ReusableCalendarProps {
  // Data
  availability?: DateAvailability[];
  defaultPrice?: number;
  
  // Selection
  mode?: CalendarSelectionMode;
  selectedDate?: Date | null;
  selectedDates?: Date[];
  dateRange?: { from?: Date; to?: Date };
  onDateSelect?: (date: Date) => void;
  onDateRangeSelect?: (range: { from?: Date; to?: Date }) => void;
  
  // Behavior
  allowPastDates?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  
  // UI
  className?: string;
  showLegend?: boolean;
  showSlots?: boolean;
}

export default function ReusableCalendar({
  availability = [],
  defaultPrice,
  mode = 'single',
  selectedDate,
  selectedDates = [],
  dateRange,
  onDateSelect,
  onDateRangeSelect,
  allowPastDates = false,
  minDate,
  maxDate,
  disabledDates = [],
  className,
  showLegend = true,
  showSlots = false,
}: ReusableCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a map of dates to availability
  const availabilityMap = new Map<string, DateAvailability>();
  availability.forEach((avail) => {
    const dateKey = format(new Date(avail.date), 'yyyy-MM-dd');
    availabilityMap.set(dateKey, avail);
  });

  const getAvailabilityForDate = (date: Date): DateAvailability | null => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return availabilityMap.get(dateKey) || null;
  };

  const isDateAvailable = (date: Date): boolean => {
    const avail = getAvailabilityForDate(date);
    if (!avail) return true; // Default to available if no availability record
    if (avail.isBlocked === true || avail.isAvailable === false) return false;
    if (avail.availableSlots !== undefined && avail.bookedSlots !== undefined) {
      const remaining = avail.remainingSlots ?? (avail.availableSlots - avail.bookedSlots);
      return remaining > 0;
    }
    return true;
  };

  const getRemainingSlots = (date: Date): number => {
    const avail = getAvailabilityForDate(date);
    if (!avail) return 999; // Unlimited if no record
    if (avail.remainingSlots !== undefined) return avail.remainingSlots;
    if (avail.availableSlots !== undefined && avail.bookedSlots !== undefined) {
      return avail.availableSlots - avail.bookedSlots;
    }
    return 999;
  };

  const isDateDisabled = (date: Date): boolean => {
    if (!allowPastDates && isPast(date) && !isSameDay(date, new Date())) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.some(d => isSameDay(d, date))) return true;
    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    if (mode === 'single') {
      return selectedDate ? isSameDay(date, selectedDate) : false;
    }
    if (mode === 'multiple') {
      return selectedDates.some(d => isSameDay(d, date));
    }
    if (mode === 'range' && dateRange) {
      if (dateRange.from && isSameDay(date, dateRange.from)) return true;
      if (dateRange.to && isSameDay(date, dateRange.to)) return true;
      if (dateRange.from && dateRange.to && date >= dateRange.from && date <= dateRange.to) {
        return true;
      }
    }
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date) || !isDateAvailable(date)) return;

    if (mode === 'single' && onDateSelect) {
      onDateSelect(date);
    } else if (mode === 'multiple' && onDateSelect) {
      onDateSelect(date);
    } else if (mode === 'range' && onDateRangeSelect) {
      if (!dateRange?.from || (dateRange.from && dateRange.to)) {
        // Start new range
        onDateRangeSelect({ from: date, to: undefined });
      } else if (dateRange.from && !dateRange.to) {
        // Complete range
        if (date >= dateRange.from) {
          onDateRangeSelect({ from: dateRange.from, to: date });
        } else {
          onDateRangeSelect({ from: date, to: dateRange.from });
        }
      }
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = Array(firstDayOfWeek).fill(null);

  return (
    <div className={cn('w-full', className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding for first week */}
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="aspect-square" />
        ))}

        {/* Days of the month */}
        {daysInMonth.map((date) => {
          const isPastDate = isPast(date) && !isSameDay(date, new Date());
          const available = isDateAvailable(date);
          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const remainingSlots = getRemainingSlots(date);
          const isInRange = mode === 'range' && dateRange?.from && dateRange?.to && 
            date >= dateRange.from && date <= dateRange.to && 
            !isSameDay(date, dateRange.from) && !isSameDay(date, dateRange.to);

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={disabled || !available}
              className={cn(
                'aspect-square p-2 rounded-lg border-2 text-sm transition-all relative min-h-[40px] flex flex-col items-center justify-center',
                disabled || !available
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50 border-gray-200'
                  : selected
                  ? 'bg-primary text-primary-foreground border-primary font-semibold'
                  : isInRange
                  ? 'bg-primary/20 border-primary/50'
                  : 'bg-background hover:bg-muted border-gray-200 hover:border-primary cursor-pointer',
                !available && !disabled && 'bg-red-50 text-red-600 border-red-200'
              )}
            >
              <span className="text-sm font-medium">{format(date, 'd')}</span>
              {!disabled && available && showSlots && (
                <span className="text-xs mt-0.5">
                  {remainingSlots < 10 ? `${remainingSlots} left` : '✓'}
                </span>
              )}
              {!disabled && !available && showSlots && (
                <span className="text-xs mt-0.5 text-red-600">Full</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-background" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-primary text-primary-foreground" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-red-50 border-red-200" />
            <span>Fully Booked</span>
          </div>
          {!allowPastDates && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border bg-muted opacity-50" />
              <span>Past Date</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
