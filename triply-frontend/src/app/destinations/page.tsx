'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  SearchFiltersModal,
  SearchFiltersStickyBar,
  countActiveFilters,
} from '@/components/filters';
import { destinationsApi, Destination } from '@/lib/api/destinations';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/navigation';

export default function DestinationsPage() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [duration, setDuration] = useState('all');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const router = useRouter();

  const { data: destinationsResponse, isLoading } = useQuery({
    queryKey: ['destinations', search],
    queryFn: () => destinationsApi.getAll({ search: search.trim() || undefined }),
  });

  const destinations = destinationsResponse?.data || [];

  const regions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Regions' }];
    const countries = Array.from(new Set(destinations.map((d) => d.country).filter(Boolean))).sort();
    countries.forEach((country) => options.push({ value: country, label: country }));
    return options;
  }, [destinations]);

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

  const activeFilterCount = countActiveFilters([
    Boolean(search.trim()),
    region !== 'all',
    duration !== 'all',
  ]);

  const clearAllFilters = () => {
    setSearch('');
    setRegion('all');
    setDuration('all');
  };

  return (
    <div className="min-h-screen">
      <SearchFiltersModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        title="Search & filters"
        description="Search by destination or country, then narrow by region and trip length."
        fields={[
          {
            id: 'dest-search',
            label: 'Search',
            value: search,
            onChange: setSearch,
            placeholder: 'Destinations, countries…',
          },
        ]}
        onClearAll={clearAllFilters}
      >
        <div className="space-y-2">
          <Label>Region</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="h-11 w-full">
              <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Duration</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="h-11 w-full">
              <Calendar className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              {durations.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SearchFiltersModal>

      <SearchFiltersStickyBar
        title="Destinations"
        onOpenFilters={() => setFilterModalOpen(true)}
        activeCount={activeFilterCount}
      />

      <section className="bg-slate-50 py-10 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-2xl font-bold">
              {isLoading ? 'Loading…' : `${filteredDestinations.length} destinations`}
            </h2>
            {!isLoading && activeFilterCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                Filters active —{' '}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setFilterModalOpen(true)}
                >
                  Edit in search & filters
                </button>
              </p>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredDestinations.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                <MapPin className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold">No destinations found</h3>
              <p className="mb-6 text-muted-foreground">Try adjusting your search or filters</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear filters
                </Button>
                <Button onClick={() => setFilterModalOpen(true)}>Open search & filters</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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

      <section className="bg-brand-orange py-11">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Can&apos;t find what you&apos;re looking for?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-white/80">
            Contact us and we&apos;ll help you plan your perfect trip
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/contact')}
            className="rounded-full bg-white px-8 font-bold text-brand-orange hover:bg-white/90"
          >
            Contact Us
          </Button>
        </div>
      </section>
    </div>
  );
}
