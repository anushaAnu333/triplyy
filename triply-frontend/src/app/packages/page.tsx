'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { packagesApi } from '@/lib/api/packages';
import { PackageCard } from '@/components/packages/PackageCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/navigation';
import {
  SearchFiltersModal,
  SearchFiltersStickyBar,
  countActiveFilters,
} from '@/components/filters';

export default function PackagesPage() {
  const [search, setSearch] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['packages', search],
    queryFn: () => packagesApi.getAll({ search: search.trim() || undefined, limit: 50 }),
  });

  const packages = data?.data ?? [];

  const activeFilterCount = useMemo(
    () => countActiveFilters([Boolean(search.trim())]),
    [search]
  );

  const clearAll = () => setSearch('');

  return (
    <div className="min-h-screen">
      <SearchFiltersModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        title="Search packages"
        description="Find packages by name or keyword."
        fields={[
          {
            id: 'pkg-search',
            label: 'Search',
            value: search,
            onChange: setSearch,
            placeholder: 'Search packages…',
          },
        ]}
        onClearAll={clearAll}
      />

      <SearchFiltersStickyBar
        title="Packages"
        onOpenFilters={() => setFilterModalOpen(true)}
        activeCount={activeFilterCount}
      />

      <section className="bg-slate-50 py-10 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-2xl font-bold">
              {isLoading ? 'Loading…' : `${packages.length} packages`}
            </h2>
            {!isLoading && activeFilterCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setFilterModalOpen(true)}
                >
                  Edit search
                </button>
              </p>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : packages.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                <MapPin className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold">No packages found</h3>
              <p className="mb-6 text-muted-foreground">Try adjusting your search</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={clearAll}>
                  Clear search
                </Button>
                <Button onClick={() => setFilterModalOpen(true)}>Open search</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard key={pkg._id} pkg={pkg} variant="full" ctaText="View" />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-brand-orange py-11">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Can&apos;t find what you&apos;re looking for?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-white/80">
            Contact us and we&apos;ll help you plan your perfect package
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
