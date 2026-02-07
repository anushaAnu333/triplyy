'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Calendar as CalendarIcon, Users, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { activitiesApi, Activity, ActivityBooking } from '@/lib/api/activities';
import { formatCurrency } from '@/lib/utils';
import ReusableCalendar from '@/components/common/ReusableCalendar';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const createBookingSchema = (requireCustomerDetails: boolean) => {
  if (requireCustomerDetails) {
    return z.object({
      customerName: z.string().min(1, 'Name is required'),
      customerEmail: z.string().email('Please enter a valid email'),
      customerPhone: z.string().optional(),
      numberOfParticipants: z.number().min(1, 'At least 1 participant is required').max(50, 'Maximum 50 participants'),
      specialRequests: z.string().optional(),
    });
  } else {
    return z.object({
      numberOfParticipants: z.number().min(1, 'At least 1 participant is required').max(50, 'Maximum 50 participants'),
    });
  }
};

interface ActivityBookingModalProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete?: (date: Date, participants: number) => void; // Optional callback for add-to-cart mode
}

export default function ActivityBookingModal({
  activity,
  isOpen,
  onClose,
  onBookingComplete,
}: ActivityBookingModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [step, setStep] = useState<'calendar' | 'details'>('calendar');

  // Fetch availability
  const { data: availabilityData, isLoading: loadingAvailability } = useQuery({
    queryKey: ['activity-availability', activity._id],
    queryFn: () => activitiesApi.getAvailability(activity._id),
    enabled: isOpen,
  });

  const requireCustomerDetails = !onBookingComplete;
  const schema = createBookingSchema(requireCustomerDetails);
  type BookingFormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      numberOfParticipants: 1,
      ...(requireCustomerDetails ? {} : {}),
    },
  });

  const numberOfParticipants = watch('numberOfParticipants') || 1;

  // Create booking mutation - now handles multiple dates
  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      // Create bookings for each selected date
      const bookings = await Promise.all(
        selectedDates.map(date =>
          activitiesApi.createBooking(activity._id, {
            selectedDate: date.toISOString(),
            numberOfParticipants: data.numberOfParticipants,
            ...(requireCustomerDetails ? {
              customerName: (data as any).customerName || '',
              customerEmail: (data as any).customerEmail || '',
              customerPhone: (data as any).customerPhone,
              specialRequests: (data as any).specialRequests,
            } : {
              customerName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User',
              customerEmail: user?.email || '',
            }),
          } as any)
        )
      );
      return bookings;
    },
    onSuccess: (bookingsData) => {
      // If onBookingComplete callback is provided, use add-to-cart mode
      if (onBookingComplete && selectedDates.length > 0) {
        // For add-to-cart, just use the first date (or we could handle multiple)
        onBookingComplete(selectedDates[0], bookingsData[0]?.numberOfParticipants || 1);
        reset();
        setSelectedDates([]);
        setStep('calendar');
      } else {
        // Standalone mode: redirect to payment page for first booking
        if (bookingsData.length > 0) {
          router.push(`/payment/activity/${bookingsData[0]._id}`);
        }
        onClose();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDates(prev => {
      const isSelected = prev.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
      if (isSelected) {
        return prev.filter(d => format(d, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd'));
      }
      return [...prev, date];
    });
  };

  const handleContinue = () => {
    if (selectedDates.length === 0) {
      toast({
        title: 'Please select at least one date',
        variant: 'destructive',
      });
      return;
    }
    setStep('details');
  };

  const onSubmitDetails = (data: BookingFormData) => {
    if (selectedDates.length === 0) {
      toast({
        title: 'Please select at least one date',
        variant: 'destructive',
      });
      return;
    }
    
    // If onBookingComplete callback is provided, use simplified add-to-cart mode
    if (onBookingComplete) {
      onBookingComplete(selectedDates[0], data.numberOfParticipants);
      reset();
      setSelectedDates([]);
      setStep('calendar');
      onClose();
      toast({
        title: 'Activity Added',
        description: `${activity.title} has been added to your booking`,
      });
      return;
    }
    
    // Otherwise, create full booking (standalone mode) for all selected dates
    createBookingMutation.mutate(data);
  };

  const totalPrice = selectedDates.reduce((total, date) => {
    const datePrice = availabilityData?.availability.find(
      (avail) => format(new Date(avail.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )?.price || activity.price;
    return total + (datePrice * numberOfParticipants);
  }, 0);

  const handleClose = () => {
    reset();
    setSelectedDates([]);
    setStep('calendar');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{activity.title}</DialogTitle>
          <DialogDescription>{activity.location}</DialogDescription>
        </DialogHeader>

        {step === 'calendar' && (
          <div className="py-4">
            {loadingAvailability ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <ReusableCalendar
                  mode="multiple"
                  availability={availabilityData?.availability.map(avail => ({
                    date: avail.date,
                    availableSlots: avail.availableSlots,
                    bookedSlots: avail.bookedSlots,
                    isAvailable: avail.isAvailable,
                    remainingSlots: avail.remainingSlots,
                    price: avail.price,
                  })) || []}
                  defaultPrice={activity.price}
                  selectedDates={selectedDates}
                  onDateSelect={handleDateSelect}
                  allowPastDates={false}
                  showSlots={false}
                  showLegend={true}
                />

                {selectedDates.length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Selected dates:</p>
                    <div className="mt-1 space-y-1">
                      {selectedDates.map((date, idx) => (
                        <p key={idx} className="font-semibold text-sm">
                          {format(date, 'PPP')}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={() => setSelectedDates([])} className="flex-1">
                    Clear
                  </Button>
                  <Button 
                    onClick={handleContinue}
                    disabled={selectedDates.length === 0}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'details' && selectedDates.length > 0 && (
          <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-4">
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">Selected dates:</p>
                <div className="mt-1 space-y-1">
                  {selectedDates.map((date, idx) => (
                    <p key={idx} className="font-semibold">
                      {format(date, 'PPP')}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="font-semibold">Total Price</span>
                  <span className="text-lg font-bold">{formatCurrency(totalPrice, activity.currency)}</span>
                </div>
              </div>

            <div>
              <Label htmlFor="numberOfParticipants">Number of Participants *</Label>
              <Input
                id="numberOfParticipants"
                type="number"
                min="1"
                max="50"
                {...register('numberOfParticipants', { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.numberOfParticipants && (
                <p className="text-sm text-destructive mt-1">{errors.numberOfParticipants.message}</p>
              )}
            </div>

            {/* Only show customer details form if NOT in add-to-cart mode */}
            {requireCustomerDetails && (
              <>
                <div>
                  <Label htmlFor="customerName">Name *</Label>
                  <Input
                    id="customerName"
                    {...register('customerName' as any)}
                    placeholder="Your full name"
                    className="mt-1"
                  />
                  {(errors as any).customerName && (
                    <p className="text-sm text-destructive mt-1">{(errors as any).customerName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register('customerEmail' as any)}
                    placeholder="your.email@example.com"
                    className="mt-1"
                  />
                  {(errors as any).customerEmail && (
                    <p className="text-sm text-destructive mt-1">{(errors as any).customerEmail.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerPhone">Phone (Optional)</Label>
                  <Input
                    id="customerPhone"
                    {...register('customerPhone' as any)}
                    placeholder="+971 XX XXX XXXX"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                  <Textarea
                    id="specialRequests"
                    {...register('specialRequests' as any)}
                    placeholder="Any special requests or questions..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </>
            )}

            {onBookingComplete && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p>This activity will be added to your destination booking. Your account information will be used for the booking.</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('calendar')} className="flex-1">
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={createBookingMutation.isPending && !onBookingComplete}
                className="flex-1"
              >
                {onBookingComplete ? (
                  'Add to Booking'
                ) : createBookingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>
            </div>
          </form>
        )}

      </DialogContent>
    </Dialog>
  );
}
