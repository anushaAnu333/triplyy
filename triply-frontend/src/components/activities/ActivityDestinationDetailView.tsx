'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Activity } from '@/lib/api/activities';
import ActivityBookingModal from '@/components/activities/ActivityBookingModal';
import {
  ArrowLeft,
  Check,
  MapPin,
  Clock,
  Users,
  Shield,
} from 'lucide-react';

function getStatusText(status: Activity['status']) {
  if (status === 'approved') return { label: 'Approved', tone: 'green' as const };
  if (status === 'pending') return { label: 'Pending', tone: 'amber' as const };
  return { label: 'Rejected', tone: 'red' as const };
}

export function ActivityDestinationDetailView({
  activity,
  enableBooking,
  backHref = '/activities',
}: {
  activity: Activity;
  enableBooking: boolean;
  backHref?: string;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const canBook = enableBooking && activity.status === 'approved';
  // This page is also reused for admin/merchant detail views.
  // For end-users, we keep it simple and don't show status pills / internal labels.
  const showInternalStatus = !enableBooking;

  const images = useMemo(() => {
    const photos = activity.photos || [];
    return photos.length ? photos : ['/placeholder-activity.jpg'];
  }, [activity.photos]);

  const status = getStatusText(activity.status);

  const handleBookNow = () => {
    if (!canBook) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/activities/${activity._id}`);
      return;
    }
    // Even for non-user roles, keep booking disabled unless the caller enabled it.
    if (enableBooking && user?.role && user.role !== 'user') {
      toast({
        title: 'Booking not available',
        description: 'You must be a traveller to book activities.',
        variant: 'destructive',
      });
      return;
    }
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" asChild>
          <a href={backHref}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </a>
        </Button>
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="container mx-auto px-4 pt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="relative h-[360px] lg:h-[420px] rounded-xl overflow-hidden">
              <Image
                src={images[selectedImage]}
                alt={activity.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                {images.slice(1, 5).map((img, idx) => {
                  const realIndex = idx + 1;
                  return (
                    <div
                      key={img}
                      className={`relative h-[172px] lg:h-[202px] rounded-lg overflow-hidden cursor-pointer ${
                        selectedImage === realIndex ? 'ring-2 ring-brand-orange ring-offset-2' : ''
                      }`}
                      onClick={() => setSelectedImage(realIndex)}
                    >
                      <Image
                        src={img}
                        alt={`${activity.title} ${realIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Title bar */}
        <div className="container mx-auto px-4 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 p-5 rounded-xl">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-orange mb-1.5">
                TRIPLY Activity
              </p>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                {activity.title}
              </h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                  <MapPin className="w-3 h-3" />
                  {activity.location}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-orange/10 text-brand-orange text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  {activity.duration ? activity.duration : 'Flexible time'}
                </span>
                {activity.groupSize !== undefined && activity.groupSize !== null && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                    <Users className="w-3 h-3" />
                    Max group: {activity.groupSize}
                  </span>
                )}
                {showInternalStatus ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${
                      status.tone === 'green'
                        ? 'bg-green-500/15 text-green-600'
                        : status.tone === 'amber'
                          ? 'bg-amber-500/15 text-amber-700'
                          : 'bg-red-500/15 text-red-700'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    {status.label}
                  </span>
                ) : null}
              </div>
            </div>

           
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 max-w-3xl">
            {/* Description */}
            <div className="mt-10 mb-5">
              <span className="inline-block px-3 py-1.5 rounded-md bg-brand-orange/10 text-brand-orange text-[11px] font-semibold tracking-wider uppercase">
                Overview
              </span>
            </div>

            <Card className="rounded-xl border border-border bg-card shadow-sm p-6">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.description}</p>
            </Card>

            {/* Highlights */}
            <div className="mt-10 mb-5">
              <span className="inline-block px-3 py-1.5 rounded-md bg-brand-orange/10 text-brand-orange text-[11px] font-semibold tracking-wider uppercase">
                Highlights
              </span>
            </div>

            {activity.pointGroups?.length ? (
              <div className="space-y-4">
                {activity.pointGroups.map((group, idx) => (
                  <div key={`${group.text}-${idx}`} className="rounded-xl border border-border bg-card p-5 pl-5 border-l-4 border-l-brand-orange/80">
                    {group.text ? <h3 className="font-display text-lg font-semibold mb-2">{group.text}</h3> : null}
                    {group.subPoints?.length ? (
                      <ul className="space-y-1.5 list-none p-0 m-0 text-sm text-muted-foreground">
                        {group.subPoints.map((sp, spIdx) => (
                          <li key={`${sp}-${spIdx}`} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{sp}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No highlights</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No highlights were provided for this activity.</p>
            )}

            {/* Included / Excluded */}
            {(activity.includes?.length || activity.excludes?.length) && (
              <>
                <div className="mt-12 mb-4">
                  <span className="inline-block px-3 py-1.5 rounded-md bg-brand-orange/10 text-brand-orange text-[11px] font-semibold tracking-wider uppercase">
                    Included &amp; Not Included
                  </span>
                </div>

                <div className="space-y-4">
                  {activity.includes?.length ? (
                    <div className="rounded-xl border border-border bg-card p-5 pl-5 border-l-4 border-l-green-500">
                      <h3 className="font-display text-base font-semibold text-foreground mb-3">Included</h3>
                      <ul className="space-y-1.5 list-none p-0 m-0 text-sm text-muted-foreground">
                        {activity.includes.map((x, idx) => (
                          <li key={`${x}-${idx}`} className="flex items-center gap-2">
                            <span className="text-green-500">+</span>
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {activity.excludes?.length ? (
                    <div className="rounded-xl border border-border bg-card p-5 pl-5 border-l-4 border-l-red-400">
                      <h3 className="font-display text-base font-semibold text-foreground mb-3">
                        Not included
                      </h3>
                      <ul className="space-y-1.5 list-none p-0 m-0 text-sm text-muted-foreground">
                        {activity.excludes.map((x, idx) => (
                          <li key={`${x}-${idx}`} className="flex items-center gap-2">
                            <span className="text-red-400">−</span>
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 max-w-[320px] mx-auto lg:mx-0 rounded-2xl overflow-hidden border border-border bg-card">
              <div className="bg-[#111] px-5 pt-5 pb-4">
                <span className="inline-flex items-center rounded-full bg-brand-orange px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase text-white mb-2.5">
                  {activity.status === 'approved' ? 'Booking available' : 'Booking unavailable'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[34px] leading-none font-extrabold text-brand-orange tabular-nums">
                    {activity.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-white/60 font-medium">{activity.currency}</span>
                </div>
                <p className="mt-1 text-[11px] text-white/45 tracking-[0.04em]">
                  {activity.location}
                </p>
                <div className="my-3 h-px bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/45">Secure checkout</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange/15 px-2 py-0.5 text-[11px] font-semibold text-brand-orange">
                    <Shield className="h-3 w-3" />
                    Verified
                  </span>
                </div>
              </div>

              <div className="px-5 py-5 space-y-4">
                <div className="rounded-xl bg-muted px-3.5 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
                      Details
                    </span>

                    <div className="mt-2 space-y-2 text-[11px] text-muted-foreground">
                      {activity.duration ? (
                        <div className="flex items-start gap-2">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-brand-orange/90 mt-0.5" />
                          <span>
                            <span className="font-medium text-foreground/90">Duration: </span>
                            {activity.duration}
                          </span>
                        </div>
                      ) : null}

                      {typeof activity.groupSize === 'number' ? (
                        <div className="flex items-start gap-2">
                          <Users className="h-3.5 w-3.5 shrink-0 text-brand-orange/90 mt-0.5" />
                          <span>
                            <span className="font-medium text-foreground/90">Max group: </span>
                            {activity.groupSize}
                          </span>
                        </div>
                      ) : null}

                      {typeof activity.languages === 'string' && activity.languages.trim() ? (
                        <div className="flex items-start gap-2">
                          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded bg-brand-orange/15 text-brand-orange/90 mt-0.5">
                            <Shield className="h-[11px] w-[11px]" />
                          </span>
                          <span>
                            <span className="font-medium text-foreground/90">Languages: </span>
                            {activity.languages}
                          </span>
                        </div>
                      ) : null}

                      {activity.includes?.length ? (
                        <div className="pt-1">
                          <p className="text-[11px] font-medium text-foreground/90">Includes</p>
                          <ul className="mt-1 space-y-1 list-none p-0">
                            {activity.includes.slice(0, 3).map((inc, idx) => (
                              <li key={`${inc}-${idx}`} className="flex items-start gap-2">
                                <span className="text-brand-orange/90 mt-0.5">•</span>
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full rounded-[10px] bg-brand-orange py-6 text-sm font-bold tracking-[0.04em] text-white hover:bg-brand-orange/90"
                  onClick={handleBookNow}
                  disabled={!canBook}
                >
                  {canBook ? 'Book Now' : 'Not available'}
                </Button>

                {activity.status !== 'approved' ? (
                  <p className="text-center text-[11px] text-muted-foreground">
                    This activity can be booked only after approval.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking modal */}
      {selectedImage >= 0 && (
        <ActivityBookingModal
          activity={activity}
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
        />
      )}
    </div>
  );
}

