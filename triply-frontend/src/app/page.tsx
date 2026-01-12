'use client';

import { useEffect, useState, useRef } from 'react';
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
    text: 'TRIPLY made booking our Maldives trip so easy! The deposit system gave us flexibility to choose dates that worked for everyone.',
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

const galleryImages = [
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
  { icon: Shield, title: 'Secure Payments', desc: 'Bank-level security for all transactions' },
  { icon: Clock, title: '1-Year Flexibility', desc: 'Book now, travel anytime within a year' },
  { icon: Headphones, title: '24/7 Support', desc: 'We are here to help you anytime' },
  { icon: CreditCard, title: 'Easy Deposits', desc: 'Start with just AED 199' },
];

const steps = [
  { step: '01', title: 'Choose Destination', desc: 'Browse our handpicked collection of stunning destinations worldwide.', icon: Globe },
  { step: '02', title: 'Pay Small Deposit', desc: 'Secure your spot with just AED 199. No hidden fees, no surprises.', icon: Shield },
  { step: '03', title: 'Travel When Ready', desc: 'Pick your dates anytime within a year. Ultimate flexibility!', icon: Plane },
];

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
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
    queryFn: () => destinationsApi.getAll({ limit: 6 }),
  });

  // Check if user is already an affiliate
  const isAffiliate = isAuthenticated && user?.role === 'affiliate';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const featuredDestinations = destinations?.data || [];

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
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920"
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
                <span>Trusted by 10,000+ Travelers</span>
              </div>

              <h1 
                className={`text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] transition-all duration-700 delay-100 ${heroImageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              >
                Explore.
                <br />
                <span className="text-brand-orange">Dream.</span>
                <br />
                <span className="text-white/90">Discover.</span>
              </h1>

              <p 
                className={`text-xl md:text-2xl text-white/70 max-w-lg mb-10 leading-relaxed transition-all duration-700 delay-200 ${heroImageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              >
                Book your dream vacation with just{' '}
                <span className="text-brand-orange font-bold">AED 199</span> deposit.
                Travel anytime within a year.
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
                    Explore Destinations
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
                    How It Works
                  </Link>
                </Button>
              </div>

              {/* Stats Mini */}
              <div 
                className={`grid grid-cols-3 gap-6 transition-all duration-700 delay-500 ${heroImageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              >
                {[
                  { value: '50+', label: 'Destinations' },
                  { value: '10K+', label: 'Travelers' },
                  { value: '4.9★', label: 'Rating' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-white/50">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Floating Cards */}
            <div className="hidden lg:block relative h-[600px]">
              {/* Main Card */}
              <div 
                className={`absolute top-10 right-0 w-80 transition-all duration-1000 delay-300 ${heroImageLoaded ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}
              >
                <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl group">
                  <Image
                    src="https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600"
                    alt="Maldives"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-brand-orange" />
                      <span className="text-white/80 text-sm">Maldives</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Paradise Awaits</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-orange font-bold">From AED 199</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-white text-sm">4.9</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Card */}
              <div 
                className={`absolute top-40 -left-10 w-64 transition-all duration-1000 delay-500 ${heroImageLoaded ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}
              >
                <div className="relative h-72 rounded-2xl overflow-hidden shadow-xl group">
                  <Image
                    src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500"
                    alt="Luxury Resort"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-white/80 text-sm">Bali, Indonesia</span>
                    <h3 className="text-lg font-bold text-white">Luxury Escape</h3>
                  </div>
                </div>
              </div>

              {/* Third Card */}
              <div 
                className={`absolute bottom-10 right-20 w-56 transition-all duration-1000 delay-700 ${heroImageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
              >
                <div className="relative h-64 rounded-2xl overflow-hidden shadow-xl group">
                  <Image
                    src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=400"
                    alt="Santorini"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-white/80 text-sm">Greece</span>
                    <h3 className="text-lg font-bold text-white">Santorini</h3>
                  </div>
                </div>
              </div>

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

      {/* Promo Banner */}
      <section className="bg-brand-orange py-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-orange via-orange-500 to-brand-orange" />
        <div className="flex animate-marquee whitespace-nowrap relative z-10">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-8 text-white font-medium">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Limited Time Offer: 20% Off All Bookings
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Rated #1 Travel Platform 2024
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Join 10,000+ Happy Travelers
              </span>
              <span>•</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef.ref} className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-orange/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: destinationsCount, suffix: '+', label: 'Destinations', icon: Globe },
              { value: travelersCount, suffix: 'K+', label: 'Happy Travelers', icon: Users },
              { value: ratingCount / 10, suffix: '', label: 'Rating', icon: Star, decimal: true },
              { value: daysCount, suffix: '', label: 'Days Flexibility', icon: Calendar },
            ].map((stat, index) => (
              <div 
                key={stat.label} 
                className={`text-center group transition-all duration-700 ${statsRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-orange/10 mb-4 group-hover:scale-110 group-hover:bg-brand-orange/20 transition-all duration-300">
                  <stat.icon className="w-8 h-8 text-brand-orange" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-black mb-2">
                  {stat.decimal ? (stat.value).toFixed(1) : stat.value}{stat.suffix}
                </div>
                <div className="text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Grid Gallery */}
      <section ref={galleryRef.ref} className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${galleryRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="inline-block text-brand-orange font-semibold text-sm uppercase tracking-wider mb-4 px-4 py-2 bg-brand-orange/10 rounded-full">
              Travel Inspiration
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Moments Worth Living
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Get inspired by breathtaking destinations around the world
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {galleryImages.map((img, index) => (
              <div 
                key={index}
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
              </div>
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

      {/* Categories */}
      <section ref={categoriesRef.ref} className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-700 ${categoriesRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="inline-block text-brand-orange font-semibold text-sm uppercase tracking-wider mb-4 px-4 py-2 bg-brand-orange/10 rounded-full">
              Browse By Category
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-black">
              Find Your Perfect Trip
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {categories.map((cat, index) => (
              <Link 
                key={cat.name}
                href="/destinations"
                className={`group transition-all duration-700 ${categoriesRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="relative overflow-hidden rounded-3xl aspect-[3/4] shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-brand-orange transition-all duration-300">
                      <cat.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{cat.name}</h3>
                    <p className="text-white/70 text-sm">{cat.count} Destinations</p>
                  </div>
                </div>
              </Link>
            ))}
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
            {featuredDestinations.slice(0, 6).map((destination: Destination, index: number) => (
              <Link 
                key={destination._id} 
                href={`/destinations/${destination.slug}`}
                className={`group transition-all duration-700 ${featuredRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white group-hover:-translate-y-2">
                  <div className="relative h-72 overflow-hidden">
                    <Image
                      src={destination.thumbnailImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'}
                      alt={destination.name?.en || 'Destination'}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    {destination.isFeatured && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-brand-orange text-white text-xs font-semibold rounded-full flex items-center gap-1 animate-pulse">
                        <Heart className="w-3 h-3" />
                        Featured
                      </div>
                    )}

                    <div className="absolute top-4 right-4 px-4 py-2 bg-white rounded-full shadow-lg group-hover:bg-brand-orange group-hover:text-white transition-colors duration-300">
                      <span className="text-sm font-bold">
                        From {formatCurrency(destination.depositAmount || 199, destination.currency || 'AED')}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="flex items-center gap-1 text-sm opacity-80 mb-1">
                        <MapPin className="w-4 h-4" />
                        {destination.country}
                      </div>
                      <h3 className="text-2xl font-bold">
                        {destination.name?.en || 'Destination'}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {destination.duration?.days || 0} Days
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          4.9
                        </span>
                      </div>
                      <div className="flex items-center text-brand-orange font-semibold group-hover:translate-x-1 transition-transform">
                        Explore
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
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
            <span className="inline-block text-brand-orange font-semibold text-sm uppercase tracking-wider mb-4 px-4 py-2 bg-brand-orange/10 rounded-full">
              Simple Process
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Book your dream trip in three simple steps
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
                Start Your Journey
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
          <div className={`text-center mb-16 transition-all duration-700 ${testimonialsRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className="inline-block text-brand-orange font-semibold text-sm uppercase tracking-wider mb-4 px-4 py-2 bg-brand-orange/10 rounded-full">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-black">
              Loved by Travelers
            </h2>
          </div>

          <div className={`max-w-4xl mx-auto relative transition-all duration-700 delay-200 ${testimonialsRef.isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {/* Navigation Buttons */}
            <button 
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all duration-300 z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all duration-300 z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="overflow-hidden rounded-3xl">
              <div 
                className="flex transition-transform duration-500 ease-out" 
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <Card className="p-8 md:p-12 bg-white border-0 shadow-xl text-center">
                      <div className="flex justify-center mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                      <blockquote className="text-xl md:text-2xl text-gray-700 mb-8 font-medium leading-relaxed">
                        "{testimonial.text}"
                      </blockquote>
                      <div className="flex items-center justify-center gap-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-brand-orange/20">
                          <Image 
                            src={testimonial.image} 
                            alt={testimonial.name} 
                            fill
                            className="object-cover" 
                          />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-black text-lg">{testimonial.name}</div>
                          <div className="text-gray-500">{testimonial.location}</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-3 rounded-full transition-all duration-300 ${currentTestimonial === index ? 'bg-brand-orange w-10' : 'bg-gray-300 w-3 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Only show if user is not already an affiliate */}
      {!isAffiliate && (
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0">
            <Image 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920" 
              alt="Beach" 
              fill 
              className="object-cover" 
            />
            <div className="absolute inset-0 bg-brand-orange/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-orange to-orange-600/90" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Become a Referral Partner
                <br />
                <span className="text-white/90">Earn Commissions</span>
              </h2>
              <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-xl mx-auto">
                Share your unique referral code and earn commissions on every booking. Join our affiliate program today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="group text-lg px-10 py-7 rounded-full bg-white text-brand-orange hover:bg-white/90 shadow-2xl font-bold transition-all duration-300 hover:scale-105">
                  <Link href="/referral-partner">
                    Become a Referral Partner
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-10 py-7 rounded-full border-2 border-white/40 text-white hover:bg-white/10 font-medium transition-all duration-300 hover:scale-105">
                  <Link href="/register">Create Free Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
