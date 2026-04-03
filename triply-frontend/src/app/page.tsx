'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowRight, MapPin, Calendar, Shield, Users, Star, 
  Plane, Globe, Heart, CheckCircle2, Play, Sparkles,
  Award, Clock, Headphones, CreditCard, Palmtree, Mountain, Building2,
  ChevronLeft, ChevronRight, Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { destinationsApi, Destination } from '@/lib/api/destinations';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// Hook for intersection observer animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Animated counter hook
function useCounter(end: number, duration: number = 2000, isInView: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, isInView]);

  return count;
}

const testimonials = [
  {
    name: 'Sarah Mitchell',
    location: 'Dubai, UAE',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    text: 'TR✨PLY made booking our Maldives trip so easy! The deposit system gave us flexibility to choose dates that worked for everyone.',
    rating: 5,
  },
  {
    name: 'Ahmed Al-Rashid',
    location: 'Abu Dhabi, UAE',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    text: 'The best travel platform I have used. Customer service is exceptional and the destinations are absolutely stunning.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    location: 'Mumbai, India',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    text: 'I referred 5 friends and earned great commissions! Plus, our Bali trip was unforgettable. Highly recommend!',
    rating: 5,
  },
];

type GooglePlaceReview = {
  authorName: string;
  profilePhotoUrl?: string;
  rating: number;
  text: string;
  relativeTimeDescription?: string;
};

type GooglePlaceReviewsPayload = {
  placeId: string;
  mapsUrl: string;
  averageRating: number;
  ratingCount: number;
  reviews: GooglePlaceReview[];
};

// Fallback images when no destinations are loaded
const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920';
const DEFAULT_GALLERY = [
  { src: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800', alt: 'Beach Paradise', location: 'Maldives' },
  { src: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600', alt: 'Japan Temple', location: 'Kyoto, Japan' },
  { src: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600', alt: 'Italy Coast', location: 'Amalfi, Italy' },
  { src: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600', alt: 'Santorini', location: 'Greece' },
  { src: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600', alt: 'Crystal Waters', location: 'Maldives' },
  { src: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600', alt: 'Bali Rice Fields', location: 'Bali, Indonesia' },
];

const categories = [
  { name: 'Beach', icon: Palmtree, count: 15, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400' },
  { name: 'Mountains', icon: Mountain, count: 12, image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400' },
  { name: 'Cities', icon: Building2, count: 18, image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400' },
  { name: 'Adventure', icon: Sparkles, count: 10, image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=400' },
];

const features = [
  { icon: Shield, title: 'Your money is safe with us', desc: 'Bank-level encryption on every transaction.' },
  { icon: Clock, title: 'Book now. Travel when you\'re ready.', desc: 'Pick your travel dates anytime within 12 months.' },
  { icon: Headphones, title: 'Real humans. Always here.', desc: 'Questions? We respond within 24–48 hours.' },
  { icon: CreditCard, title: 'Start with just AED 199', desc: 'No big upfront cost. Lock in your trip for AED 199.' },
];

const steps = [
  { step: '01', title: 'Pick Your Destination', desc: 'Browse trips curated for UAE travelers — beaches, cities, mountains. Find yours.', icon: Globe },
  { step: '02', title: 'Lock It In for AED 199', desc: 'Pay a small deposit today. No hidden fees, no stress. Your spot is saved.', icon: Shield },
  { step: '03', title: 'Go When You\'re Ready', desc: 'Choose your travel dates anytime in the next 12 months. Life is unpredictable — your booking doesn\'t have to be.', icon: Plane },
];

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const [googleReviews, setGoogleReviews] = useState<GooglePlaceReviewsPayload | null>(null);
  const [googleReviewsError, setGoogleReviewsError] = useState<string | null>(null);
  const [isGoogleReviewsLoading, setIsGoogleReviewsLoading] = useState<boolean>(false);
  const [googleReviewsSlide, setGoogleReviewsSlide] = useState(0);
  const [googleReviewsPerSlide, setGoogleReviewsPerSlide] = useState(3);
  
  const statsRef = useInView(0.3);
  const galleryRef = useInView(0.1);
  const categoriesRef = useInView(0.1);
  const stepsRef = useInView(0.1);
  const testimonialsRef = useInView(0.1);
  const featuredRef = useInView(0.1);

  const destinationsCount = useCounter(50, 1500, statsRef.isInView);
  const travelersCount = useCounter(10, 1500, statsRef.isInView);
  const ratingCount = useCounter(49, 1500, statsRef.isInView);
  const daysCount = useCounter(365, 1500, statsRef.isInView);

  const { data: destinations } = useQuery({
    queryKey: ['featured-destinations'],
    queryFn: () => destinationsApi.getAll({ limit: 12 }),
  });

  // Check if user is already an affiliate
  const isAffiliate = isAuthenticated && user?.role === 'affiliate';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadGoogleReviews = async () => {
      try {
        setIsGoogleReviewsLoading(true);
        setGoogleReviewsError(null);

        const res = await fetch('/api/google-place-reviews', { method: 'GET' });
        const json = (await res.json()) as {
          success: boolean;
          message?: string;
          data?: GooglePlaceReviewsPayload;
        };

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || 'Google reviews could not be loaded.');
        }

        if (!cancelled) setGoogleReviews(json.data);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Google reviews could not be loaded.';
        const friendly =
          message.toLowerCase().includes('not configured') ||
          message.toLowerCase().includes('places is not configured')
            ? 'Google reviews will appear once Places API is configured.'
            : message;
        setGoogleReviewsError(friendly);
      } finally {
        if (!cancelled) setIsGoogleReviewsLoading(false);
      }
    };

    loadGoogleReviews();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setGoogleReviewsPerSlide(mq.matches ? 1 : 3);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    setGoogleReviewsSlide(0);
  }, [googleReviews?.placeId, googleReviews?.reviews.length]);

  useEffect(() => {
    const n = googleReviews?.reviews.length ?? 0;
    if (n === 0) return;
    const totalSlides = Math.max(1, Math.ceil(n / googleReviewsPerSlide));
    const maxIdx = totalSlides - 1;
    setGoogleReviewsSlide((s) => Math.min(s, maxIdx));
  }, [googleReviewsPerSlide, googleReviews?.reviews.length]);

  const featuredDestinations = destinations?.data || [];

  // Use different destination indices per section so the same thumbnail doesn't repeat everywhere
  const heroImageUrl = featuredDestinations[0]?.thumbnailImage || DEFAULT_HERO_IMAGE;
  const floatingCardDests = featuredDestinations.slice(1, 4); // 1,2,3 – avoid reusing hero (0)
  const trendingDestinations = featuredDestinations.slice(0, 6); // First 6 for "Trending This Season"

  // Gallery "Real Trips": use destinations 4–9 when we have enough (no overlap with hero/floating/trending), else use first 6 or DEFAULT_GALLERY
  const galleryImages = useMemo(() => {
    if (featuredDestinations.length >= 10) {
      return featuredDestinations.slice(4, 10).map((d: Destination) => ({
        src: d.thumbnailImage || DEFAULT_GALLERY[0].src,
        alt: d.name || 'Destination',
        location: [d.country, d.region].filter(Boolean).join(' · ') || d.country || '',
        slug: d.slug,
      }));
    }
    if (featuredDestinations.length === 0) return DEFAULT_GALLERY.map((g) => ({ ...g, slug: undefined }));
    const fromDestinations = featuredDestinations.slice(0, 6).map((d: Destination) => ({
      src: d.thumbnailImage || DEFAULT_GALLERY[0].src,
      alt: d.name || 'Destination',
      location: [d.country, d.region].filter(Boolean).join(' · ') || d.country || '',
      slug: d.slug,
    }));
    const filled = fromDestinations.length >= 6 ? fromDestinations : [...fromDestinations, ...DEFAULT_GALLERY.slice(fromDestinations.length, 6).map((g) => ({ ...g, slug: undefined }))];
    return filled;
  }, [featuredDestinations]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
        {/* Background Image with Parallax Effect */}
        <div className="absolute inset-0">
          <Image
            src={heroImageUrl}
            alt="Travel Adventure"
            fill
            className={`object-cover transition-all duration-1000 ${heroImageLoaded ? 'scale-100 opacity-60' : 'scale-110 opacity-0'}`}
            priority
            onLoad={() => setHeroImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-brand-orange/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-20 w-48 h-48 bg-brand-orange/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto px-4 relative z-10 pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-2xl">
              <div 
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-orange/20 backdrop-blur-sm border border-brand-orange/30 text-brand-orange text-sm font-semibold mb-8 transition-all duration-700 ${heroImageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>500+ Happy Travelers from the UAE</span>
              </div>

              <h1 
                className={`text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] transition-all duration-700 delay-100 ${heroImageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              >
                Your next adventure starts with{' '}
                <span className="tabular-nums">
                  <span className="text-4xl">AED</span>{' '}
                  <span className="align-baseline">199</span>
                </span>
                .
              </h1>

              <p 
                className={`text-xl md:text-2xl text-white/70 max-w-lg mb-10 leading-relaxed transition-all duration-700 delay-200 ${heroImageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              >
                Reserve your dream trip today with a small deposit. Pick your dates anytime within the next year — no rush, no pressure. Just you and your squad, ready when you are.
              </p>

              <div 
                className={`flex flex-col sm:flex-row gap-4 mb-12 transition-all duration-700 delay-300 ${heroImageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              >
                <Button 
                  asChild 
                  size="lg" 
                  className="group text-lg px-8 py-7 rounded-full bg-brand-orange hover:bg-brand-orange/90 text-white border-0 shadow-xl shadow-brand-orange/30 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-brand-orange/40"
                >
                  <Link href="/destinations">
                    Reserve My Spot
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="group text-lg px-8 py-7 rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 font-medium transition-all duration-300 hover:scale-105"
                >
                  <Link href="#how-it-works">
                    <Play className="mr-2 h-5 w-5 text-brand-orange group-hover:scale-110 transition-transform" />
                    See How It Works
                  </Link>
                </Button>
              </div>

            </div>

            {/* Right - Floating Cards */}
            <div className="hidden lg:block relative h-[600px]">
              {/* Main Card - first destination */}
              {floatingCardDests[0] && (
                <Link
                  href={`/destinations/${floatingCardDests[0].slug}`}
                  className={`absolute top-10 right-0 w-80 transition-all duration-1000 delay-300 ${heroImageLoaded ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}
                >
                  <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl group">
                    <Image
                      src={floatingCardDests[0].thumbnailImage}
                      alt={floatingCardDests[0].name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </Link>
              )}

              {/* Second Card */}
              {floatingCardDests[1] && (
                <Link
                  href={`/destinations/${floatingCardDests[1].slug}`}
                  className={`absolute top-40 -left-10 w-64 transition-all duration-1000 delay-500 ${heroImageLoaded ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}
                >
                  <div className="relative h-72 rounded-2xl overflow-hidden shadow-xl group">
                    <Image
                      src={floatingCardDests[1].thumbnailImage}
                      alt={floatingCardDests[1].name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </Link>
              )}

              {/* Third Card */}
              {floatingCardDests[2] && (
                <Link
                  href={`/destinations/${floatingCardDests[2].slug}`}
                  className={`absolute bottom-10 right-20 w-56 transition-all duration-1000 delay-700 ${heroImageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
                >
                  <div className="relative h-64 rounded-2xl overflow-hidden shadow-xl group">
                    <Image
                      src={floatingCardDests[2].thumbnailImage}
                      alt={floatingCardDests[2].name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </Link>
              )}

              {/* Floating Badge */}
              <div 
                className={`absolute top-0 left-20 bg-white rounded-2xl p-4 shadow-xl transition-all duration-1000 delay-600 ${heroImageLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm">365 Days</p>
                    <p className="text-xs text-gray-500">Flexibility</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1 h-3 rounded-full bg-white/50 animate-scroll" />
          </div>
        </div>
      </section>

      

   

      {/* Image Grid Gallery */}
      <section ref={galleryRef.ref} className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${galleryRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Real Trips. Real People. Real Fun.
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              This is what your squad&apos;s next adventure looks like.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {galleryImages.map((img, index) => (
              <Link
                key={index}
                href={'slug' in img && img.slug ? `/destinations/${img.slug}` : '/destinations'}
                className={`relative overflow-hidden rounded-2xl md:rounded-3xl group cursor-pointer transition-all duration-700 ${galleryRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                  height: index === 0 ? '400px' : '190px'
                }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                    <MapPin className="w-4 h-4" />
                    {img.location}
                  </div>
                  <p className="font-bold text-white text-lg">{img.alt}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className={`text-center mt-12 transition-all duration-700 delay-500 ${galleryRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Button asChild size="lg" className="group rounded-full bg-black hover:bg-gray-900 text-white font-semibold px-8 transition-all duration-300 hover:scale-105">
              <Link href="/destinations">
                View All Destinations
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

 

      {/* Featured Destinations */}
      <section ref={featuredRef.ref} className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className={`flex flex-col md:flex-row md:items-end justify-between mb-12 transition-all duration-700 ${featuredRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div>
              <span className="inline-block text-brand-orange font-semibold text-sm uppercase tracking-wider mb-4 px-4 py-2 bg-brand-orange/10 rounded-full">
                Popular Destinations
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-black">
                Trending This Season
              </h2>
            </div>
            <Button asChild variant="ghost" className="mt-4 md:mt-0 hover:text-brand-orange font-medium group">
              <Link href="/destinations">
                View All Destinations
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingDestinations.map((destination: Destination, index: number) => (
              <div
                key={destination._id}
                className={`transition-all duration-700 ${featuredRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <DestinationCard
                  destination={destination}
                  variant="compact"
                  ctaText="Explore"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-2xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="text-center text-white group hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-orange/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-orange group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-brand-orange group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={stepsRef.ref} id="how-it-works" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${stepsRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              It&apos;s This Easy
            </h2>
            <p className="text-brand-orange font-semibold text-sm uppercase tracking-wider mb-2">
              How TR✨PLY Works
            </p>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Three steps between you and your next trip.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-brand-orange/20 via-brand-orange to-brand-orange/20" />
            
            {steps.map((item, index) => (
              <div 
                key={item.step} 
                className={`relative group transition-all duration-700 ${stepsRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="bg-gray-50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
                  {/* Step Number Background */}
                  <div className="absolute -top-4 -right-4 text-[120px] font-bold text-gray-100 leading-none select-none">
                    {item.step}
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-brand-orange flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-black">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`text-center mt-14 transition-all duration-700 delay-500 ${stepsRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Button asChild size="lg" className="group rounded-full bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold px-10 py-7 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-brand-orange/30">
              <Link href="/destinations">
                Browse Trips
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef.ref} className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-20 left-10 text-brand-orange/10">
          <Quote className="w-48 h-48" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div
            className={`text-center mb-16 transition-all duration-700 ${
              testimonialsRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <span className="inline-block text-brand-orange font-semibold text-sm uppercase tracking-wider mb-4 px-4 py-2 bg-brand-orange/10 rounded-full">
              Reviews
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-black">What people say on Google</h2>
          </div>

          <div
            className={`max-w-6xl mx-auto transition-all duration-700 delay-200 ${
              testimonialsRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="flex flex-col items-center gap-4 mb-10">
              {isGoogleReviewsLoading && (
                <p className="text-sm text-gray-500">Loading Google reviews...</p>
              )}
              {googleReviewsError && (
                <p className="text-sm text-red-600">{googleReviewsError}</p>
              )}
              {googleReviews && (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center gap-2">
                    {[...Array(Math.max(0, Math.round(googleReviews.averageRating)))].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="ml-2 text-sm font-semibold text-gray-800">
                      {googleReviews.averageRating.toFixed(1)} / 5
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {googleReviews.ratingCount} Google ratings
                  </span>

                  {googleReviews.mapsUrl && (
                    <a
                      href={googleReviews.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand-orange hover:underline"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>

            {googleReviews && googleReviews.reviews.length > 0 ? (() => {
              const reviews = googleReviews.reviews;
              const perSlide = googleReviewsPerSlide;
              const totalSlides = Math.max(1, Math.ceil(reviews.length / perSlide));
              const maxSlideIndex = totalSlides - 1;
              const clampedSlide = Math.min(googleReviewsSlide, maxSlideIndex);
              const pageReviews = reviews.slice(
                clampedSlide * perSlide,
                clampedSlide * perSlide + perSlide
              );

              return (
                <div className="relative px-10 md:px-14">
                  {totalSlides > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous reviews"
                        disabled={clampedSlide <= 0}
                        onClick={() => setGoogleReviewsSlide((s) => Math.max(0, s - 1))}
                        className="absolute left-0 top-1/2 z-20 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-brand-orange hover:text-white disabled:pointer-events-none disabled:opacity-40 text-gray-700"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next reviews"
                        disabled={clampedSlide >= maxSlideIndex}
                        onClick={() => setGoogleReviewsSlide((s) => Math.min(maxSlideIndex, s + 1))}
                        className="absolute right-0 top-1/2 z-20 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-brand-orange hover:text-white disabled:pointer-events-none disabled:opacity-40 text-gray-700"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {pageReviews.map((review, idx) => (
                      <Card
                        key={`${review.authorName}-${clampedSlide}-${idx}`}
                        className="flex h-full min-h-[280px] flex-col p-8 bg-white border-0 shadow-xl"
                      >
                        <div className="mb-4 flex shrink-0 justify-start">
                          {[...Array(Math.max(0, Math.round(review.rating)))].map((_, i) => (
                            <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        <div className="min-h-0 flex-1">
                          <p className="line-clamp-6 text-gray-700 leading-relaxed md:line-clamp-5">
                            {review.text}
                          </p>
                        </div>
                        <div className="mt-auto flex shrink-0 items-center gap-4 pt-5">
                          {review.profilePhotoUrl ? (
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-4 ring-brand-orange/20">
                              <Image
                                src={review.profilePhotoUrl}
                                alt={review.authorName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-orange/10 ring-4 ring-brand-orange/20">
                              <span className="text-sm font-semibold text-brand-orange">
                                {review.authorName.charAt(0)}
                              </span>
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-black">{review.authorName}</div>
                            {review.relativeTimeDescription && (
                              <div className="text-xs text-gray-500">{review.relativeTimeDescription}</div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })() : (
              googleReviews && (
                <p className="text-sm text-gray-500 text-center">
                  No Google reviews found for this place yet.
                </p>
              )
            )}

            <p className="mt-6 text-center text-xs text-gray-400">
              Powered by Google
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA - Only show if user is not already an affiliate */}
      {!isAffiliate && (
        <section className="py-10 relative overflow-hidden">
          <div className="absolute inset-0">
            <Image 
              src={featuredDestinations[5]?.thumbnailImage || DEFAULT_GALLERY[2].src} 
              alt="Travel" 
              fill 
              className="object-cover" 
            />
            <div className="absolute inset-0 bg-brand-orange/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-orange to-orange-600/90" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Love to Travel? Get Paid for It.
              </h2>
              <p className="text-xl md:text-xl text-white/80 mb-12 max-w-xl mx-auto">
                Share TR✨PLY with your network and earn a commission on every booking they make. Free to join. No limits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="group text-lg px-10 py-7 rounded-full bg-white text-brand-orange hover:bg-white/90 shadow-2xl font-bold transition-all duration-300 hover:scale-105">
                  <Link href="/referral-partner">
                    Join the Partner Program
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild size="lg" className="group text-lg px-10 py-7 rounded-full bg-white text-brand-orange hover:bg-white/90 shadow-2xl font-bold transition-all duration-300 hover:scale-105">
                  <Link href="/register">
                    Create Your Free Account
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
