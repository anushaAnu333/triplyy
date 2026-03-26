 'use client';

import type { Activity } from '@/lib/api/activities';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ActivityBookingModal from '@/components/activities/ActivityBookingModal';
import { useState } from 'react';
import { MapPin, Users, Clock, Globe } from 'lucide-react';

function getStatusBadge(status: Activity['status']) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500">Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    case 'pending':
      return <Badge variant="outline">Pending</Badge>;
    default:
      return null;
  }
}

export function ActivityDetailView({ activity }: { activity: Activity }) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const canBook = activity.status === 'approved';

  return (
    <div className="min-h-screen bg-muted/30 py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl overflow-hidden bg-card border border-border">
          <div className="relative h-64 bg-muted">
            {activity.photos?.[0] ? (
              <img
                src={activity.photos[0]}
                alt={activity.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{activity.title}</h1>
                  <p className="text-sm text-white/90 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {activity.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(activity.status)}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="text-white">
                  <p className="text-xs text-white/80">Price</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(activity.price, activity.currency)}
                  </p>
                </div>
                {activity.groupSize !== undefined && activity.groupSize !== null && (
                  <div className="text-white">
                    <p className="text-xs text-white/80 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Max group size
                    </p>
                    <p className="text-sm font-medium">{activity.groupSize}</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                {canBook ? (
                  <Button onClick={() => setBookingOpen(true)}>Book Now</Button>
                ) : (
                  <div className="text-sm text-white/90">
                    Booking is available once the activity is approved.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {activity.rejectionReason && activity.status === 'rejected' && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive">Rejection reason</p>
                <p className="text-sm text-muted-foreground mt-1">{activity.rejectionReason}</p>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.description}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-2">Service Details</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {activity.duration && (
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{activity.duration}</span>
                    </p>
                  )}
                  {activity.languages && (
                    <p className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>{activity.languages}</span>
                    </p>
                  )}
                  {activity.pointsHeading && <p>{activity.pointsHeading}</p>}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-2">Included</h3>
                {activity.includes?.length ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {activity.includes.map((x, idx) => (
                      <li key={`${x}-${idx}`}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-2">Highlights</h3>
                {activity.pointGroups?.length ? (
                  <div className="space-y-3">
                    {activity.pointGroups.map((g, idx) => (
                      <div key={`${g.text}-${idx}`}>
                        {g.text && <p className="font-medium text-sm mb-1">{g.text}</p>}
                        {g.subPoints?.length ? (
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {g.subPoints.map((sp, spIdx) => (
                              <li key={`${sp}-${spIdx}`}>{sp}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No highlights</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold mb-2">Excluded</h3>
                {activity.excludes?.length ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {activity.excludes.map((x, idx) => (
                      <li key={`${x}-${idx}`}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Booking modal */}
        <ActivityBookingModal
          activity={activity}
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
        />
      </div>
    </div>
  );
}

