'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { packagesApi } from '@/lib/api/packages';
import { PackageCard } from '@/components/packages/PackageCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/navigation';

export default function PackagesPage() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['packages', search],
    queryFn: () => packagesApi.getAll({ search: search || undefined, limit: 50 }),
  });

  const packages = data?.data ?? [];

  return (
    <div className="min-h-screen">
      {/* Search */}
      <section className="bg-white sticky top-20 z-40 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search packages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-lg rounded-full border-slate-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold">
                {isLoading ? 'Loading...' : `${packages.length} Packages`}
              </h2>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No packages found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search</p>
              <Button onClick={() => setSearch('')}>Clear Search</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg._id}
                  pkg={pkg}
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
            Contact us and we'll help you plan your perfect package
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
