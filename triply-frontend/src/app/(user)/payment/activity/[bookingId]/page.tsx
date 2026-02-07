'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Loader2, CreditCard, Check, ArrowLeft, 
  Lock, Calendar, MapPin, Users, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { paymentsApi } from '@/lib/api/payments';
import { activitiesApi } from '@/lib/api/activities';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

type PaymentMethod = 'card' | 'debit' | 'credit';

interface PaymentFormData {
  paymentMethod: PaymentMethod;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export default function ActivityPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bookingId = params.bookingId as string;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [formData, setFormData] = useState<PaymentFormData>({
    paymentMethod: 'card',
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch booking details
  const { data: booking, isLoading: isLoadingBooking, error: bookingError } = useQuery({
    queryKey: ['activityBooking', bookingId],
    queryFn: () => activitiesApi.getBookingById(bookingId),
    enabled: !!bookingId,
  });

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    handleInputChange('cardNumber', formatted);
  };

  const paymentMutation = useMutation({
    mutationFn: async () => {
      // Create payment intent
      const paymentIntent = await paymentsApi.createActivityBookingIntent(bookingId);
      
      // Simulate payment processing (dummy payment)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Confirm payment
      return await paymentsApi.confirmActivityBookingPayment({
        paymentIntentId: paymentIntent.paymentIntentId,
        bookingId: bookingId,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Payment Successful!',
        description: `Your booking reference is ${data.bookingReference}`,
      });
      router.push(`/bookings/activity/${bookingId}/success`);
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Failed',
        description: error.response?.data?.message || 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
      toast({
        title: 'Invalid Card Number',
        description: 'Please enter a valid 16-digit card number',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.cardHolderName) {
      toast({
        title: 'Card Holder Name Required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.expiryMonth || !formData.expiryYear) {
      toast({
        title: 'Expiry Date Required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.cvv || formData.cvv.length < 3) {
      toast({
        title: 'CVV Required',
        description: 'Please enter a valid CVV',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    paymentMutation.mutate();
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month.toString().padStart(2, '0'), label: month.toString().padStart(2, '0') };
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => {
    const year = currentYear + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Show loading state
  if (isLoadingBooking) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (bookingError || !booking) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Activity booking not found</p>
            <Button onClick={() => router.push('/activities')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Activities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if payment is already completed
  if (booking.status === 'payment_completed' || booking.status === 'confirmed') {
    router.push(`/bookings/activity/${bookingId}/success`);
    return null;
  }

  const activity = booking.activityId as any;
  const totalAmount = booking.payment.amount;
  const currency = booking.payment.currency || 'AED';

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/activities">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activities
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Complete your booking by entering your payment information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Payment Method */}
                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="credit">Credit Card</SelectItem>
                        <SelectItem value="debit">Debit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Card Number */}
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      className="mt-1"
                    />
                  </div>

                  {/* Card Holder Name */}
                  <div>
                    <Label htmlFor="cardHolderName">Card Holder Name</Label>
                    <Input
                      id="cardHolderName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.cardHolderName}
                      onChange={(e) => handleInputChange('cardHolderName', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Expiry Date</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Select
                          value={formData.expiryMonth}
                          onValueChange={(value) => handleInputChange('expiryMonth', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={formData.expiryYear}
                          onValueChange={(value) => handleInputChange('expiryYear', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="YYYY" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year.value} value={year.value}>
                                {year.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
                    <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-semibold mb-1">Secure Payment</p>
                      <p>Your payment information is encrypted and secure. This is a dummy payment page for testing purposes.</p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isProcessing || paymentMutation.isPending}
                  >
                    {isProcessing || paymentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Pay Now
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Booking Reference: {booking.bookingReference}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{activity?.title || 'Activity Booking'}</span>
                  </div>
                  {booking.selectedDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(booking.selectedDate), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  {booking.numberOfParticipants && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{booking.numberOfParticipants} {booking.numberOfParticipants === 1 ? 'Participant' : 'Participants'}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(totalAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Fee</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount, currency)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    By completing this payment, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
