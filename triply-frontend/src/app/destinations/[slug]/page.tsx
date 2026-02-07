'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, Clock, Calendar, Check, X, ArrowLeft, 
  Users, Star, Shield, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { destinationsApi } from '@/lib/api/destinations';
import { bookingsApi } from '@/lib/api/bookings';
import { affiliatesApi } from '@/lib/api/affiliates';
import { activitiesApi, Activity } from '@/lib/api/activities';
import { formatCurrency } from '@/lib/utils';
import { BookingModal } from '@/components/booking/BookingModal';
import ActivityBookingModal from '@/components/activities/ActivityBookingModal';

export default function DestinationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [validatedAffiliate, setValidatedAffiliate] = useState<string | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const { data: destination, isLoading, error } = useQuery({
    queryKey: ['destination', slug],
    queryFn: () => destinationsApi.getBySlug(slug),
    enabled: !!slug,
  });

  // Fetch activities for this destination's location
  // Try multiple location terms to find matching activities
  const { data: activitiesData } = useQuery({
    queryKey: ['activities', destination?.country, destination?.name?.en],
    queryFn: async () => {
      if (!destination) return null;
      
      // Extract potential location terms from destination
      const destinationName = destination.name?.en || '';
      const country = destination.country || '';
      
      // Try to extract city name from destination name (e.g., "Dubai" from "Dubai Luxe Escape")
      const cityMatch = destinationName.match(/\b(Dubai|Abu Dhabi|Sharjah|Ajman|Fujairah|Ras Al Khaimah|Umm Al Quwain)\b/i);
      const cityName = cityMatch ? cityMatch[1] : null;
      
      // Try multiple search terms in order of preference
      const searchTerms = [
        cityName, // Try city name first (most specific)
        destinationName, // Then destination name
        country, // Then country
      ].filter(Boolean) as string[];

      // Try each search term and return the first one that has results
      for (const term of searchTerms) {
        if (!term) continue;
        try {
          const result = await activitiesApi.getAll({
            page: 1,
            limit: 6,
            location: term,
          });
          if (result.data && result.data.length > 0) {
            return result;
          }
        } catch (error) {
          // Continue to next search term if this one fails
          continue;
        }
      }
      
      // If no results with location filter, return empty result
      return { data: [], meta: { page: 1, limit: 6, total: 0, totalPages: 0 } };
    },
    enabled: !!destination,
  });

  const validateAffiliateCode = async () => {
    if (!affiliateCode.trim()) return;
    
    setValidatingCode(true);
    try {
      const result = await affiliatesApi.validateCode(affiliateCode);
      if (result.isValid) {
        setValidatedAffiliate(result.affiliateName);
        toast({
          title: 'Code Applied!',
          description: `Referred by ${result.affiliateName}`,
        });
      }
    } catch {
      toast({
        title: 'Invalid Code',
        description: 'The affiliate code is not valid',
        variant: 'destructive',
      });
      setValidatedAffiliate(null);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/destinations/${slug}`);
      return;
    }
    setShowBookingModal(true);
  };

  const handleActivityBookNow = (activity: Activity) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/destinations/${slug}`);
      return;
    }
    setSelectedActivity(activity);
    setBookingModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Destination not found</h2>
        <Button asChild>
          <Link href="/destinations">Browse Destinations</Link>
        </Button>
      </div>
    );
  }

  const images = destination.images?.length > 0 
    ? destination.images 
    : [destination.thumbnailImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200'];

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" asChild>
          <Link href="/destinations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Destinations
          </Link>
        </Button>
      </div>

      {/* Hero Image Gallery */}
      <section className="container mx-auto px-4 mb-8">
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            <Image
              src={images[selectedImage]}
              alt={destination.name.en}
              fill
              className="object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-2 gap-4">
              {images.slice(1, 5).map((img, index) => (
                <div 
                  key={index}
                  className="relative h-[190px] lg:h-[240px] rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(index + 1)}
                >
                  <Image
                    src={img}
                    alt={`${destination.name.en} ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span>{destination.country}</span>
                {destination.region && (
                  <>
                    <span>•</span>
                    <span>{destination.region}</span>
                  </>
                )}
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                {destination.name.en}
              </h1>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{destination.duration.days} Days / {destination.duration.nights} Nights</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>4.9 (124 reviews)</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-display text-2xl font-semibold mb-4">About This Trip</h2>
              <p className="text-muted-foreground leading-relaxed">
                {destination.description.en}
              </p>
            </div>

            {/* Highlights */}
            {destination.highlights && destination.highlights.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-semibold mb-4">Highlights</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {destination.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span>{highlight.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid md:grid-cols-2 gap-8">
              {destination.inclusions && destination.inclusions.length > 0 && (
                <div>
                  <h3 className="font-display text-xl font-semibold mb-4 text-green-600">
                    What's Included
                  </h3>
                  <ul className="space-y-2">
                    {destination.inclusions.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item.en}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {destination.exclusions && destination.exclusions.length > 0 && (
                <div>
                  <h3 className="font-display text-xl font-semibold mb-4 text-red-600">
                    Not Included
                  </h3>
                  <ul className="space-y-2">
                    {destination.exclusions.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item.en}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <CardTitle className="font-display text-3xl">
                    {formatCurrency(destination.depositAmount, destination.currency)}
                  </CardTitle>
                  <span className="text-muted-foreground">deposit</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>1-year calendar access</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-5 h-5 text-primary" />
                    <span>Flexible group sizes</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="w-5 h-5 text-primary" />
                    <span>Secure payment</span>
                  </div>
                </div>

                {/* Affiliate Code */}
                <div className="space-y-2">
                  <Label htmlFor="affiliateCode">Have a referral code?</Label>
                  <div className="flex gap-2">
                    <Input
                      id="affiliateCode"
                      placeholder="Enter code"
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                      disabled={!!validatedAffiliate}
                    />
                    <Button 
                      variant="outline" 
                      onClick={validateAffiliateCode}
                      disabled={validatingCode || !!validatedAffiliate}
                    >
                      {validatingCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : validatedAffiliate ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  {validatedAffiliate && (
                    <p className="text-sm text-green-600">
                      Referred by {validatedAffiliate}
                    </p>
                  )}
                </div>

                {/* Book Button */}
                <Button 
                  size="lg" 
                  className="w-full text-lg py-6"
                  onClick={handleBookNow}
                >
                  Book Now
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Pay only the deposit now. Select your dates later.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Things to Do Section */}
      {activitiesData && activitiesData.data.length > 0 && (
        <section className="container mx-auto px-4 pb-16">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold mb-2">
              Things to Do in {destination.name.en}
            </h2>
            <p className="text-muted-foreground">
              Discover amazing activities and experiences in this destination
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activitiesData.data.map((activity) => (
              <Card
                key={activity._id}
                className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={activity.photos[0] || '/placeholder-activity.jpg'}
                    alt={activity.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">
                      {activity.title}
                    </h3>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {activity.location}
                    </p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">
                      {formatCurrency(activity.price, activity.currency)}
                    </p>
                    <Button
                      onClick={() => handleActivityBookNow(activity)}
                      size="sm"
                      className="bg-brand-orange hover:bg-brand-orange/90"
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/activities">
                View All Activities
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        destination={destination}
        affiliateCode={validatedAffiliate ? affiliateCode : undefined}
        activities={activitiesData?.data || []}
      />

      {/* Activity Booking Modal */}
      {selectedActivity && (
        <ActivityBookingModal
          activity={selectedActivity}
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedActivity(null);
          }}
        />
      )}
    </div>
  );
}

