'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatCurrency } from '@/lib/utils';
import { Destination } from '@/lib/api/destinations';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: Destination;
  affiliateCode?: string;
}

type Step = 'details' | 'payment' | 'success';

export function BookingModal({ 
  isOpen, 
  onClose, 
  destination, 
  affiliateCode 
}: BookingModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [numberOfTravellers, setNumberOfTravellers] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingReference, setBookingReference] = useState('');

  const handleCreateBooking = async () => {
    setIsLoading(true);
    try {
      const result = await bookingsApi.create({
        destinationId: destination._id,
        numberOfTravellers,
        specialRequests: specialRequests || undefined,
        affiliateCode,
      });

      setBookingReference(result.booking.bookingReference);
      
      // In production, integrate with Stripe here using result.payment.clientSecret
      // For now, simulate successful payment
      setStep('payment');
      
      // Simulate payment processing
      setTimeout(() => {
        setStep('success');
      }, 2000);

    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.response?.data?.message || 'Unable to create booking',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      router.push('/dashboard');
    }
    onClose();
    // Reset state
    setStep('details');
    setNumberOfTravellers(1);
    setSpecialRequests('');
    setBookingReference('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                Book {destination.name.en}
              </DialogTitle>
              <DialogDescription>
                Secure your spot with a deposit of {formatCurrency(destination.depositAmount, destination.currency)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="travellers">Number of Travellers</Label>
                <Input
                  id="travellers"
                  type="number"
                  min={1}
                  max={50}
                  value={numberOfTravellers}
                  onChange={(e) => setNumberOfTravellers(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requests">Special Requests (Optional)</Label>
                <textarea
                  id="requests"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Any dietary requirements, accessibility needs, etc."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>

              {affiliateCode && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  <Check className="w-4 h-4" />
                  <span>Referral code applied: {affiliateCode}</span>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Deposit Amount</span>
                  <span>{formatCurrency(destination.depositAmount, destination.currency)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateBooking} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Proceed to Payment
              </Button>
            </div>
          </>
        )}

        {step === 'payment' && (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">
              Please wait while we process your payment...
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Booking Confirmed!</h3>
            <p className="text-muted-foreground mb-4">
              Your booking reference is:
            </p>
            <p className="text-xl font-mono font-bold text-primary mb-6">
              {bookingReference}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Your calendar is now unlocked for 1 year. You can select your travel dates anytime.
            </p>
            <Button onClick={handleClose} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

