'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Lock, Unlock, Calendar, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { destinationsApi } from '@/lib/api/destinations';
import api from '@/lib/api/axios';

interface AvailabilityData {
  date: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  isBlocked: boolean;
}

export default function AdminAvailabilityPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const { data: destinations } = useQuery({
    queryKey: ['destinations-list'],
    queryFn: () => destinationsApi.getAll({}),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: availability, isLoading: loadingAvailability } = useQuery({
    queryKey: ['availability', selectedDestination, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const response = await api.get(`/availability/${selectedDestination}?startDate=${start}&endDate=${end}`);
      return response.data.data as AvailabilityData[];
    },
    enabled: !!selectedDestination,
  });

  const updateSlotsMutation = useMutation({
    mutationFn: async ({ slots }: { slots: number }) => {
      const dates = selectedDates.map(d => format(d, 'yyyy-MM-dd'));
      return api.put(`/availability/${selectedDestination}/bulk`, {
        dates,
        totalSlots: slots,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast({ title: 'Slots updated successfully' });
      setSelectedDates([]);
    },
    onError: () => {
      toast({ title: 'Failed to update slots', variant: 'destructive' });
    },
  });

  const blockDatesMutation = useMutation({
    mutationFn: async ({ block }: { block: boolean }) => {
      const dates = selectedDates.map(d => format(d, 'yyyy-MM-dd'));
      return api.put(`/availability/${selectedDestination}/block`, {
        dates,
        isBlocked: block,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast({ title: 'Dates updated successfully' });
      setSelectedDates([]);
    },
    onError: () => {
      toast({ title: 'Failed to update dates', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfWeek = startOfMonth(currentMonth).getDay();

  const toggleDateSelection = (date: Date) => {
    setSelectedDates(prev => {
      const isSelected = prev.some(d => isSameDay(d, date));
      if (isSelected) {
        return prev.filter(d => !isSameDay(d, date));
      }
      return [...prev, date];
    });
  };

  const getDateAvailability = (date: Date): AvailabilityData | undefined => {
    return availability?.find(a => 
      isSameDay(new Date(a.date), date)
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Availability Calendar</h1>
            <p className="text-muted-foreground">Manage destination availability and slots</p>
          </div>
          
          <Select value={selectedDestination} onValueChange={setSelectedDestination}>
            <SelectTrigger className="w-64">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select a destination" />
            </SelectTrigger>
            <SelectContent>
              {destinations?.data?.map((dest: any) => (
                <SelectItem key={dest._id} value={dest._id}>
                  {dest.name.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedDestination ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a Destination</h3>
              <p className="text-muted-foreground">
                Choose a destination to manage its availability calendar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAvailability ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <>
                    {/* Week days header */}
                    <div className="grid grid-cols-7 mb-2">
                      {weekDays.map(day => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for days before first day of month */}
                      {[...Array(firstDayOfWeek)].map((_, i) => (
                        <div key={`empty-${i}`} className="h-20" />
                      ))}

                      {/* Days */}
                      {days.map(day => {
                        const avail = getDateAvailability(day);
                        const isSelected = selectedDates.some(d => isSameDay(d, day));
                        const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => !isPast && toggleDateSelection(day)}
                            disabled={isPast}
                            className={`
                              h-20 p-2 rounded-lg border text-left transition-colors
                              ${isPast ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
                              ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent'}
                              ${avail?.isBlocked ? 'bg-red-50' : 'bg-white'}
                            `}
                          >
                            <div className="text-sm font-medium">{format(day, 'd')}</div>
                            {avail && (
                              <div className="mt-1 space-y-1">
                                {avail.isBlocked ? (
                                  <span className="text-xs text-red-600 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Blocked
                                  </span>
                                ) : (
                                  <>
                                    <div className="text-xs text-muted-foreground">
                                      {avail.availableSlots}/{avail.totalSlots} slots
                                    </div>
                                    {avail.bookedSlots > 0 && (
                                      <div className="text-xs text-primary">
                                        {avail.bookedSlots} booked
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Select dates on the calendar to perform actions
                  </p>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      {selectedDates.length} date(s) selected
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Set Total Slots</label>
                      <div className="flex gap-2">
                        {[5, 10, 20, 50].map(num => (
                          <Button
                            key={num}
                            variant="outline"
                            size="sm"
                            onClick={() => updateSlotsMutation.mutate({ slots: num })}
                            disabled={updateSlotsMutation.isPending}
                          >
                            {num}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => blockDatesMutation.mutate({ block: true })}
                        disabled={blockDatesMutation.isPending}
                      >
                        {blockDatesMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Lock className="w-4 h-4 mr-2" />
                        )}
                        Block Dates
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => blockDatesMutation.mutate({ block: false })}
                        disabled={blockDatesMutation.isPending}
                      >
                        <Unlock className="w-4 h-4 mr-2" />
                        Unblock Dates
                      </Button>
                    </div>

                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={() => setSelectedDates([])}
                    >
                      Clear Selection
                    </Button>
                  </>
                )}

                {/* Legend */}
                <div className="border-t pt-4 space-y-2 text-sm">
                  <p className="font-medium">Legend</p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white border" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
                    <span>Blocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary/10 border border-primary" />
                    <span>Selected</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

