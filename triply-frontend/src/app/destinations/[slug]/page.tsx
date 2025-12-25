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
import { formatCurrency } from '@/lib/utils';
import { BookingModal } from '@/components/booking/BookingModal';

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

  const { data: destination, isLoading, error } = useQuery({
    queryKey: ['destination', slug],
    queryFn: () => destinationsApi.getBySlug(slug),
    enabled: !!slug,
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

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        destination={destination}
        affiliateCode={validatedAffiliate ? affiliateCode : undefined}
      />
    </div>
  );
}

