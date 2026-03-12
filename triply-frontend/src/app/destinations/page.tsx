'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, MapPin, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { destinationsApi, Destination } from '@/lib/api/destinations';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/navigation';

export default function DestinationsPage() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [duration, setDuration] = useState('all');
  const router = useRouter();

  const { data: destinationsResponse, isLoading } = useQuery({
    queryKey: ['destinations', search],
    queryFn: () => destinationsApi.getAll({ search }),
  });

  const destinations = destinationsResponse?.data || [];

  // Derive region options from available destinations (unique countries)
  const regions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Regions' }];
    const countries = Array.from(new Set(destinations.map((d) => d.country).filter(Boolean))).sort();
    countries.forEach((country) => options.push({ value: country, label: country }));
    return options;
  }, [destinations]);

  // Derive duration options from available destinations (unique "X Days / Y Nights")
  const durations = useMemo(() => {
    const options = [{ value: 'all', label: 'Any Duration' }];
    const set = new Set<string>();
    destinations.forEach((d) => {
      if (d.duration?.days != null && d.duration?.nights != null) {
        set.add(`${d.duration.days}D / ${d.duration.nights}N`);
      }
    });
    Array.from(set)
      .sort()
      .forEach((label) => {
        const value = label.replace(/\s*\/\s*/, '-').toLowerCase();
        options.push({ value, label });
      });
    return options;
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest: Destination) => {
      if (region !== 'all' && dest.country !== region) return false;
      if (duration !== 'all') {
        const destLabel = `${dest.duration?.days ?? 0}D / ${dest.duration?.nights ?? 0}N`;
        const durationValue = destLabel.replace(/\s*\/\s*/, '-').toLowerCase();
        if (durationValue !== duration) return false;
      }
      return true;
    });
  }, [destinations, region, duration]);

  return (
    <div className="min-h-screen">
    
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
                <DestinationCard
                  key={destination._id}
                  destination={destination}
                  variant="full"
                  ctaText="View"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-11 bg-brand-orange">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Contact us and we'll help you plan your perfect trip
          </p>
          <Button 
            size="lg" 
            onClick={() => router.push('/contact')}
            className="bg-white text-brand-orange hover:bg-white/90 rounded-full px-8 font-bold"
          >
            Contact Us
          </Button>
        </div>
      </section>
    </div>
  );
}
