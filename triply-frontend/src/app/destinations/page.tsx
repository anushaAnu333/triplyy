'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, MapPin, Calendar, Star, ArrowRight, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { destinationsApi, Destination } from '@/lib/api/destinations';
import { formatCurrency } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const regions = [
  { value: 'all', label: 'All Regions' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'africa', label: 'Africa' },
  { value: 'americas', label: 'Americas' },
  { value: 'oceania', label: 'Oceania' },
];

const durations = [
  { value: 'all', label: 'Any Duration' },
  { value: 'short', label: '1-4 Days' },
  { value: 'medium', label: '5-7 Days' },
  { value: 'long', label: '8+ Days' },
];

export default function DestinationsPage() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [duration, setDuration] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: destinationsResponse, isLoading } = useQuery({
    queryKey: ['destinations', search, region, duration],
    queryFn: () => destinationsApi.getAll({ search }),
  });

  const destinations = destinationsResponse?.data || [];

  const filteredDestinations = destinations.filter((dest: Destination) => {
    // Apply additional client-side filters if needed
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920"
            alt="Destinations"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
            Explore Destinations
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Discover handpicked destinations for your next unforgettable adventure
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="bg-white sticky top-20 z-40 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search destinations, countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 text-lg rounded-full border-slate-200"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Toggles */}
            <div className="flex gap-3">
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-40 h-12 rounded-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-40 h-12 rounded-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                className="h-12 rounded-full px-6"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold">
                {isLoading ? 'Loading...' : `${filteredDestinations.length} Destinations`}
              </h2>
              <p className="text-muted-foreground">
                Find your perfect getaway
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredDestinations.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No destinations found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button onClick={() => { setSearch(''); setRegion('all'); setDuration('all'); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDestinations.map((destination: Destination) => (
                <Link 
                  key={destination._id} 
                  href={`/destinations/${destination.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white h-full">
                    <div className="relative h-72 overflow-hidden">
                      <Image
                        src={destination.thumbnailImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'}
                        alt={destination.name?.en || 'Destination'}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      {/* Favorite Button */}
                      <button 
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors group/btn"
                        onClick={(e) => { e.preventDefault(); }}
                      >
                        <Heart className="w-5 h-5 text-slate-400 group-hover/btn:text-triply-coral transition-colors" />
                      </button>

                      {/* Featured Badge */}
                      {destination.isFeatured && (
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-brand-orange text-white text-xs font-semibold rounded-full">
                          ✨ Featured
                        </div>
                      )}

                      {/* Price */}
                      <div className="absolute bottom-4 right-4">
                        <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
                          <span className="text-sm text-gray-500">From </span>
                          <span className="font-bold text-black">
                            {formatCurrency(destination.depositAmount || 199, destination.currency || 'AED')}
                          </span>
                        </div>
                      </div>

                      {/* Location Info */}
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="flex items-center gap-1 text-sm text-white/80 mb-1">
                          <MapPin className="w-4 h-4" />
                          {destination.country}
                          {destination.region && (
                            <span className="text-white/60">• {destination.region}</span>
                          )}
                        </div>
                        <h3 className="font-display text-2xl font-bold">
                          {destination.name?.en || 'Destination'}
                        </h3>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {destination.description?.en || ''}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {destination.duration?.days || 0}D / {destination.duration?.nights || 0}N
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            4.9
                          </span>
                        </div>
                        <div className="flex items-center text-brand-orange font-semibold group-hover:translate-x-1 transition-transform">
                          View
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-brand-orange">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Contact us and we'll help you plan your perfect trip
          </p>
          <Button 
            size="lg" 
            className="bg-white text-brand-orange hover:bg-white/90 rounded-full px-8 font-bold"
          >
            Contact Us
          </Button>
        </div>
      </section>
    </div>
  );
}
