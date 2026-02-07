'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, Check, Plus, X, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi } from '@/lib/api/bookings';
import { formatCurrency } from '@/lib/utils';
import { Destination } from '@/lib/api/destinations';
import { Activity } from '@/lib/api/activities';
import ActivityBookingModal from '@/components/activities/ActivityBookingModal';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: Destination;
  affiliateCode?: string;
  activities?: Activity[]; // Optional activities to show
}

export function BookingModal({ 
  isOpen, 
  onClose, 
  destination, 
  affiliateCode,
  activities = []
}: BookingModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [numberOfTravellers, setNumberOfTravellers] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<Map<string, { activity: Activity; date: Date; participants: number }>>(new Map());
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setNumberOfTravellers(1);
      setSpecialRequests('');
      setSelectedActivities(new Map());
    }
  }, [isOpen]);

  const handleAddActivity = (activity: Activity) => {
    setCurrentActivity(activity);
    setShowActivityModal(true);
  };

  const handleActivityBooked = (activity: Activity, date: Date, participants: number) => {
    const key = activity._id;
    setSelectedActivities(prev => {
      const newMap = new Map(prev);
      newMap.set(key, { activity, date, participants });
      return newMap;
    });
    setShowActivityModal(false);
    setCurrentActivity(null);
  };

  const handleRemoveActivity = (activityId: string) => {
    setSelectedActivities(prev => {
      const newMap = new Map(prev);
      newMap.delete(activityId);
      return newMap;
    });
  };

  // Calculate totals
  const depositAmount = destination.depositAmount;
  const activitiesTotal = Array.from(selectedActivities.values()).reduce((sum, item) => {
    return sum + (item.activity.price * item.participants);
  }, 0);
  const totalAmount = depositAmount + activitiesTotal;

  // Handle booking creation and navigate to payment page
  const handleCreateBooking = async () => {
    setIsLoading(true);
    try {
      // Prepare activities array for backend
      const activitiesArray = Array.from(selectedActivities.values()).map(item => ({
        activityId: item.activity._id,
        selectedDate: item.date.toISOString(),
        numberOfParticipants: item.participants,
        customerName: user ? `${user.firstName} ${user.lastName}` : '',
        customerEmail: user?.email || '',
        customerPhone: user?.phoneNumber || '',
      }));

      const result = await bookingsApi.create({
        destinationId: destination._id,
        numberOfTravellers,
        specialRequests: specialRequests || undefined,
        affiliateCode,
        activities: activitiesArray.length > 0 ? activitiesArray : undefined,
      });

      // Get booking ID
      const bookingId = typeof result.booking.id === 'string' 
        ? result.booking.id 
        : String(result.booking.id);
      
      // Store payment data in localStorage for the payment page
      localStorage.setItem(`payment_${bookingId}`, JSON.stringify({
        paymentIntentId: result.payment.paymentIntentId,
        depositAmount: result.booking.depositAmount,
        totalAmount: result.booking.totalAmount || result.booking.depositAmount,
        activityAmount: result.booking.activityAmount || 0,
        hasActivities: result.booking.hasActivities || false,
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

          {/* Activities Section */}
          {activities && activities.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Add Activities (Optional)</Label>
                <span className="text-sm text-muted-foreground">
                  Pay together or separately
                </span>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activities.map((activity) => {
                  const isSelected = selectedActivities.has(activity._id);
                  const selectedData = selectedActivities.get(activity._id);
                  
                  return (
                    <div
                      key={activity._id}
                      className={`p-3 border rounded-lg ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Activity Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {activity.photos && activity.photos[0] ? (
                            <img
                              src={activity.photos[0]}
                              alt={activity.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm line-clamp-1">{activity.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(activity.price, activity.currency)} per person
                          </div>
                          {isSelected && selectedData && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {selectedData.participants} participant(s) • {selectedData.date.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingActivity(activity)}
                            className="h-8 w-8 p-0"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isSelected ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveActivity(activity._id)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddActivity(activity)}
                              className="h-8"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Destination Deposit</span>
              <span>{formatCurrency(depositAmount, destination.currency)}</span>
            </div>
            {selectedActivities.size > 0 && (
              <div className="flex justify-between text-sm">
                <span>Activities ({selectedActivities.size})</span>
                <span>{formatCurrency(activitiesTotal, destination.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(totalAmount, destination.currency)}</span>
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

      {/* Activity Booking Modal */}
      {currentActivity && (
        <ActivityBookingModal
          activity={currentActivity}
          isOpen={showActivityModal}
          onClose={() => {
            setShowActivityModal(false);
            setCurrentActivity(null);
          }}
          onBookingComplete={(date: Date, participants: number) => {
            handleActivityBooked(currentActivity, date, participants);
          }}
        />
      )}

      {/* Activity Details View Modal */}
      {viewingActivity && (
        <Dialog open={!!viewingActivity} onOpenChange={() => setViewingActivity(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                {viewingActivity.title}
              </DialogTitle>
              <DialogDescription>
                {viewingActivity.location}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Activity Images */}
              {viewingActivity.photos && viewingActivity.photos.length > 0 && (
                <div className="w-full h-64 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={viewingActivity.photos[0]}
                    alt={viewingActivity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Price */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-semibold">Price</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(viewingActivity.price, viewingActivity.currency)} per person
                </span>
              </div>
              
              {/* Description */}
              {viewingActivity.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {viewingActivity.description}
                  </p>
                </div>
              )}
              
              {/* Additional Images */}
              {viewingActivity.photos && viewingActivity.photos.length > 1 && (
                <div>
                  <h4 className="font-semibold mb-2">More Images</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingActivity.photos.slice(1, 4).map((photo, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo}
                          alt={`${viewingActivity.title} ${index + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setViewingActivity(null)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewingActivity(null);
                    handleAddActivity(viewingActivity);
                  }}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Booking
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

