'use client';

import { useState, useEffect } from 'react';
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

export function BookingModal({ 
  isOpen, 
  onClose, 
  destination, 
  affiliateCode 
}: BookingModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [numberOfTravellers, setNumberOfTravellers] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setNumberOfTravellers(1);
      setSpecialRequests('');
    }
  }, [isOpen]);

  // Handle booking creation and navigate to payment page
  const handleCreateBooking = async () => {
    setIsLoading(true);
    try {
      const result = await bookingsApi.create({
        destinationId: destination._id,
        numberOfTravellers,
        specialRequests: specialRequests || undefined,
        affiliateCode,
      });

      // Get booking ID
      const bookingId = typeof result.booking.id === 'string' 
        ? result.booking.id 
        : String(result.booking.id);
      
      // Store payment data in localStorage for the payment page
      localStorage.setItem(`payment_${bookingId}`, JSON.stringify({
        paymentIntentId: result.payment.paymentIntentId,
        depositAmount: result.booking.depositAmount,
        currency: result.booking.currency,
      }));
      
      // Close modal and navigate to payment page
      onClose();
      router.push(`/payment/${bookingId}`);
      
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: 'Booking Failed',
        description: error.response?.data?.message || 'Unable to create booking',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
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
              disabled={isLoading}
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
              disabled={isLoading}
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
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateBooking} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

