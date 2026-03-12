'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, Clock, Calendar, Check, X, ArrowLeft, 
  Users, Shield, Loader2, Phone 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { destinationsApi } from '@/lib/api/destinations';
import { bookingsApi } from '@/lib/api/bookings';
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
    queryKey: ['activities', destination?.country, destination?.name],
    queryFn: async () => {
      if (!destination) return null;
      
      // Extract potential location terms from destination
      const destinationName = destination.name || '';
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

      {/* Hero: Image gallery + title bar below (no overlap) */}
      <section className="relative">
        <div className="container mx-auto px-4 pt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="relative h-[360px] lg:h-[420px] rounded-xl overflow-hidden">
              <Image
                src={images[selectedImage]}
                alt={destination.name}
                fill
                className="object-cover"
                priority
                quality={95}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                {images.slice(1, 5).map((img, index) => (
                  <div
                    key={index}
                    className={`relative h-[172px] lg:h-[202px] rounded-lg overflow-hidden cursor-pointer ${selectedImage === index + 1 ? 'ring-2 ring-brand-orange ring-offset-2' : ''}`}
                    onClick={() => setSelectedImage(index + 1)}
                  >
                    <Image src={img} alt={`${destination.name} ${index + 2}`} fill className="object-cover" quality={90} sizes="200px" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Title bar – solid bar below image, TRIPLY theme */}
        <div className="container mx-auto px-4 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 p-5 rounded-xl ">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-orange mb-1.5">{destination.country}</p>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                {destination.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-orange/10 text-brand-orange text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  {destination.duration.days}D / {destination.duration.nights}N
                </span>
                {destination.region && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                    <MapPin className="w-3 h-3" />
                    {destination.region}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs">Private · Breakfast incl.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content: two-column layout */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main content – itinerary + IE + pricing (reference layout) */}
          <div className="lg:col-span-2 max-w-3xl">
            {/* Day-by-Day Itinerary */}
            <div className="mt-10 mb-5">
              <span className="inline-block px-3 py-1.5 rounded-md bg-brand-orange/10 text-brand-orange text-[11px] font-semibold tracking-wider uppercase">Itinerary</span>
            </div>
            {destination.itinerary && destination.itinerary.length > 0 ? (
              <div className="space-y-3">
                {destination.itinerary.map((day, index) => {
                  const isLastDay = index === destination.itinerary!.length - 1;
                  const isAirportOrTransfer = /airport|transfer|departure/i.test(day.day);
                  const usePointGroups = day.pointGroups?.length && day.pointGroups.some((g) => g.text || (g.subPoints?.length ?? 0) > 0);
                  const isTransferDay = (isLastDay && isAirportOrTransfer) || (!day.route && !usePointGroups && (!day.highlights?.length || day.highlights.length <= 1) && !day.subHighlights?.length && !day.overnight);
                  const dayNum = String(index + 1).padStart(2, '0');
                  const dayTitle = day.day.replace(/^Day \d+[ –-]\s*/i, '').trim() || day.day;
                  if (isTransferDay) {
                    return (
                      <div key={index} className="rounded-xl border border-border bg-muted/30 p-5 flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-orange/10 flex items-center justify-center text-xl">✈️</div>
                        <div>
                          <h3 className="font-display text-lg font-semibold text-foreground">{day.day}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {day.highlights?.length ? day.highlights.join(' · ') : day.route}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex gap-4 p-5">
                        <div className="flex-shrink-0 w-12 flex flex-col items-center">
                          <span className="text-2xl font-bold text-brand-orange tabular-nums leading-none">{dayNum}</span>
                          <span className="text-[9px] font-medium tracking-widest uppercase text-muted-foreground mt-1">Day</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg font-semibold text-foreground">{dayTitle}</h3>
                        </div>
                      </div>
                      <div className="px-5 pb-5 pt-0">
                        {usePointGroups ? (
                          <ul className="space-y-3 list-none p-0 m-0">
                            {day.pointGroups!.map((group, gi) => (
                              <li key={gi}>
                                {group.text && (
                                  <div className="flex gap-3 items-start">
                                    <span className="w-1.5 h-1.5 rounded-sm bg-brand-orange flex-shrink-0 mt-2" />
                                    <span className="text-sm text-foreground">{group.text}</span>
                                  </div>
                                )}
                                {group.subPoints?.length ? (
                                  <ul className="mt-1 pl-5 space-y-0.5 text-sm text-muted-foreground list-none">
                                    {group.subPoints.map((sp, si) => (
                                      <li key={si} className="flex gap-2"><span className="text-brand-orange">·</span>{sp}</li>
                                    ))}
                                  </ul>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <>
                            <ul className="space-y-3 list-none p-0 m-0">
                              {day.highlights?.map((item, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                  <span className="w-1.5 h-1.5 rounded-sm bg-brand-orange flex-shrink-0 mt-2" />
                                  <span className="text-sm text-foreground">{item}</span>
                                </li>
                              ))}
                            </ul>
                            {day.subHighlights && day.subHighlights.length > 0 && (
                              <ul className="mt-2 pl-5 space-y-0.5 text-sm text-muted-foreground list-none">
                                {day.subHighlights.map((item, i) => (
                                  <li key={i} className="flex gap-2"><span className="text-brand-orange">·</span>{item}</li>
                                ))}
                              </ul>
                            )}
                          </>
                        )}
                        {day.extra && <p className="mt-2 text-sm text-muted-foreground">{day.extra}</p>}
                        {day.checkin && <p className="mt-1 text-sm text-muted-foreground"><strong className="text-foreground">Check-in:</strong> {day.checkin}</p>}
                        {day.overnight && (
                          <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/80 text-xs text-muted-foreground">
                            <span aria-hidden>◐</span> {day.overnight}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground leading-relaxed">{destination.description}</p>
            )}

            {/* Trip highlights */}
            {destination.highlights && destination.highlights.length > 0 && (
              <>
                <div className="mt-12 mb-4">
                  <span className="inline-block px-3 py-1.5 rounded-md bg-brand-orange/10 text-brand-orange text-[11px] font-semibold tracking-wider uppercase">Highlights</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {destination.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Inclusions & Exclusions – stacked with left accent */}
            {(destination.inclusions?.length || destination.exclusions?.length) ? (
              <>
                <div className="mt-12 mb-4">
                  <span className="inline-block px-3 py-1.5 rounded-md bg-brand-orange/10 text-brand-orange text-[11px] font-semibold tracking-wider uppercase">Included &amp; Not Included</span>
                </div>
                <div className="space-y-4">
                  {destination.inclusions && destination.inclusions.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-5 pl-5 border-l-4 border-l-green-500">
                      <h3 className="font-display text-base font-semibold text-foreground mb-3">Included</h3>
                      <ul className="space-y-1.5 list-none p-0 m-0 text-sm text-muted-foreground">
                        {destination.inclusions.map((item, i) => (
                          <li key={i} className="flex items-center gap-2"><span className="text-green-500">+</span>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {destination.exclusions && destination.exclusions.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-5 pl-5 border-l-4 border-l-red-400">
                      <h3 className="font-display text-base font-semibold text-foreground mb-3">Not included</h3>
                      <ul className="space-y-1.5 list-none p-0 m-0 text-sm text-muted-foreground">
                        {destination.exclusions.map((item, i) => (
                          <li key={i} className="flex items-center gap-2"><span className="text-red-400">−</span>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : null}

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

                {/* Book Button */}
                <Button 
                  size="lg" 
                  className="w-full text-lg py-6 bg-brand-orange hover:bg-brand-orange/90 text-white border-0"
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
              Things to Do in {destination.name}
            </h2>
            <p className="text-muted-foreground">
              Discover amazing activities and experiences in this destination
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activitiesData.data.map((activity) => (
              <Card
                key={activity._id}
                className="overflow-hidden cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={activity.photos[0] || '/placeholder-activity.jpg'}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4 drop-shadow-md">
                    <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">
                      {activity.title}
                    </h3>
                    <p className="text-white text-sm flex items-center gap-1 drop-shadow-sm">
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

