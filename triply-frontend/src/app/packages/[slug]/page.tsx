'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Check,
  Loader2,
  CalendarRange,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ItineraryDay } from '@/lib/api/packages';
import { packagesApi } from '@/lib/api/packages';
import { getPackageEnquiryConfig, getWhatsAppEnquiryUrl } from '@/lib/packageEnquiry';
import { formatCurrency } from '@/lib/utils';

function DayBlock({ day }: { day: ItineraryDay }) {
  const groups = day.pointGroups?.length
    ? day.pointGroups
    : (day.highlights || []).map((h, idx) => ({
        text: h,
        subPoints: idx === 0 ? day.subHighlights || [] : [],
      }));

  const meals = (day.meals || []).filter((m) => typeof m === 'string').map((m) => m.toUpperCase());
  const mealSet = new Set(meals);
  const hasAnyMeal = mealSet.size > 0;
  const mealOrder: Array<'B' | 'L' | 'D'> = ['B', 'L', 'D'];

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-semibold text-base">{day.day}</h3>
        <div className="flex flex-wrap gap-2 justify-end">
          {!hasAnyMeal ? (
            <span className="rounded border bg-white/5 px-2 py-1 text-xs text-muted-foreground">No Meals</span>
          ) : (
            mealOrder.map((m) =>
              mealSet.has(m) ? (
                <span
                  key={m}
                  className="rounded border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300"
                >
                  {m}
                </span>
              ) : null
            )
          )}
        </div>
      </div>

      <ul className="space-y-4 text-sm">
        {groups.map((g, gi) => {
          if (g.subPoints?.length) {
            return (
              <li key={gi} className="space-y-2">
                {g.text ? (
                  <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{g.text}</div>
                ) : null}
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {g.subPoints.map((s, si) => (
                    <li key={si}>{s}</li>
                  ))}
                </ul>
              </li>
            );
          }

          return (
            <li key={gi}>
              {g.text ? <span className="font-medium text-foreground">{g.text}</span> : null}
            </li>
          );
        })}
      </ul>
      {(day.overnight || day.checkin) && (
        <p className="text-xs text-muted-foreground mt-3">
          {day.overnight && <>Overnight: {day.overnight}</>}
          {day.overnight && day.checkin ? ' · ' : null}
          {day.checkin && <>Check-in: {day.checkin}</>}
        </p>
      )}
    </div>
  );
}

function ItinerarySection({ title, days }: { title: string; days?: ItineraryDay[] }) {
  if (!days?.length) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-6">
        {days.map((day, i) => (
          <DayBlock key={i} day={day} />
        ))}
      </div>
    </section>
  );
}

export default function PackageDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [selectedPkg, setSelectedPkg] = useState<'4d3n' | '5d4n'>('4d3n');
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: pkg, isLoading, error } = useQuery({
    queryKey: ['package', slug],
    queryFn: () => packagesApi.getBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 px-4">
        <h2 className="text-2xl font-bold mb-4">Package not found</h2>
        <Button asChild>
          <Link href="/packages">All packages</Link>
        </Button>
      </div>
    );
  }

  const images =
    pkg.images?.length > 0 ? pkg.images : [pkg.thumbnailImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200'];
  const safeImageIndex = Math.min(selectedImage, Math.max(images.length - 1, 0));

  const promoStart = pkg.promotionStartDate ? new Date(pkg.promotionStartDate) : null;
  const promoEnd = pkg.promotionEndDate ? new Date(pkg.promotionEndDate) : null;
  const validityLabel = promoEnd
    ? promoStart
      ? `${format(promoStart, 'MMM d')} – ${format(promoEnd, 'MMM d, yyyy')}`
      : `Valid until ${format(promoEnd, 'MMM yyyy')}`
    : null;

  const contact = getPackageEnquiryConfig();
  const waUrl = getWhatsAppEnquiryUrl(pkg.name);

  const pt = pkg.pricingTable;
  const tableCurrency = pt?.currency || pkg.priceCurrency || 'USD';

  const primaryDays = pkg.duration?.days ?? 4;
  const primaryNights = pkg.duration?.nights ?? 3;
  const secondaryDays = pkg.secondaryItinerary?.length ?? 5;
  const secondaryNights = Math.max(secondaryDays - 1, 0);

  const primaryTabLabel = `${primaryDays}D${primaryNights}N`;
  const secondaryTabLabel = pkg.secondaryItineraryTitle?.trim() || `${secondaryDays}D${secondaryNights}N`;
  const hasSecondaryItinerary = (pkg.secondaryItinerary?.length || 0) > 0;

  const selectedItinerary = selectedPkg === '4d3n' ? pkg.itinerary : pkg.secondaryItinerary;

  const findRow = (category: string) => pt?.rows?.find((r) => r.category === category);
  const findColIdx = (duration: '4D3N' | '5D4N', pax: '2-4' | '5-8') => {
    const headers = pt?.columnHeaders || [];
    const paxNeedle = pax === '2-4' ? '2' : '5';
    return headers.findIndex((h) => h.includes(duration) && h.includes(paxNeedle));
  };

  const buildPricingCards = () => {
    if (!pt?.rows?.length || !pt.columnHeaders?.length) return null;
    const rowA = findRow('A');
    const rowB = findRow('B');
    const rowC = findRow('C');
    if (!rowA || !rowB || !rowC) return null;

    const col4d3n24 = findColIdx('4D3N', '2-4');
    const col4d3n58 = findColIdx('4D3N', '5-8');
    const col5d4n24 = findColIdx('5D4N', '2-4');
    const col5d4n58 = findColIdx('5D4N', '5-8');
    if ([col4d3n24, col4d3n58, col5d4n24, col5d4n58].some((i) => i < 0)) return null;

    const get = (row: { values: number[] }, colIdx: number) => row.values[colIdx];

    return {
      '4d3n': {
        '2-4': { A: get(rowA, col4d3n24), B: get(rowB, col4d3n24), C: get(rowC, col4d3n24) },
        '5-8': { A: get(rowA, col4d3n58), B: get(rowB, col4d3n58), C: get(rowC, col4d3n58) },
      },
      '5d4n': {
        '2-4': { A: get(rowA, col5d4n24), B: get(rowB, col5d4n24), C: get(rowC, col5d4n24) },
        '5-8': { A: get(rowA, col5d4n58), B: get(rowB, col5d4n58), C: get(rowC, col5d4n58) },
      },
    };
  };

  const pricingCards = buildPricingCards();

  const tdacMatch = (pkg.importantNotes || []).find((n) => /tdac|digital arrival card/i.test(n));
  const remarksNotes = (pkg.importantNotes || []).filter((n) => n !== tdacMatch);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" asChild>
          <Link href="/packages">
            <ArrowLeft className="w-4 h-4 mr-2" />
            All packages
          </Link>
        </Button>
      </div>

      <section className="relative">
        <div className="container mx-auto px-4 pt-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="relative h-[360px] lg:h-[420px] rounded-xl overflow-hidden">
              <Image
                src={images[safeImageIndex]}
                alt={pkg.name}
                fill
                className="object-cover"
                priority
                quality={95}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {images.length > 1 ? (
              <div className="grid grid-cols-2 gap-3">
                {images.slice(1, 5).map((img, index) => (
                  <div
                    key={img}
                    className={`relative h-[172px] lg:h-[202px] rounded-lg overflow-hidden cursor-pointer ${
                      safeImageIndex === index + 1 ? 'ring-2 ring-brand-orange ring-offset-2' : ''
                    }`}
                    onClick={() => setSelectedImage(index + 1)}
                  >
                    <Image
                      src={img}
                      alt={`${pkg.name} ${index + 2}`}
                      fill
                      className="object-cover"
                      quality={90}
                      sizes="200px"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="container mx-auto px-4 mt-6 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 p-5 rounded-xl">
            <div>
              {pkg.shortDescription && (
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-orange mb-1.5">
                  {pkg.shortDescription}
                </p>
              )}
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {pkg.name}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-sm text-muted-foreground mt-3">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-orange" />
                  {pkg.location}
                </span>
                {pkg.duration ? (
                  <span>
                    {pkg.duration.days} days · {pkg.duration.nights} nights
                  </span>
                ) : null}
              </div>
              {pkg.priceLabel?.trim() ? (
                <p className="text-xl font-semibold text-foreground mt-4">{pkg.priceLabel}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 max-w-3xl space-y-10">
            <div className="prose prose-neutral dark:prose-invert max-w-none rounded-xl border bg-card p-6 sm:p-8">
              <p className="text-muted-foreground whitespace-pre-wrap m-0 leading-relaxed">{pkg.description}</p>
            </div>

            {pkg.hotelGroups && pkg.hotelGroups.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">Hotels</h2>
                <div className="space-y-4">
                  {pkg.hotelGroups.map((g, i) => (
                    <div key={`${g.title}-${i}`} className="rounded-xl border bg-card p-5">
                      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                        {g.title}
                      </div>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {(g.items || []).map((line, li) => (
                          <li key={li}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {pricingCards && (
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">Package Pricing</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border bg-card p-4">
                    <div className="mb-3 font-display font-semibold">4D3N Package · Per Person (USD)</div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b">
                          <th className="pb-2 pr-2 font-medium">Group</th>
                          <th className="pb-2 pr-2 font-medium">Option A</th>
                          <th className="pb-2 pr-2 font-medium">Option B</th>
                          <th className="pb-2 pr-2 font-medium">Option C</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b last:border-0">
                          <td className="py-2 pr-2 text-muted-foreground font-medium">2–4 Pax</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['4d3n']['2-4'].A, tableCurrency)}</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['4d3n']['2-4'].B, tableCurrency)}</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['4d3n']['2-4'].C, tableCurrency)}</td>
                        </tr>
                        <tr className="border-b last:border-0">
                          <td className="py-2 pr-2 text-muted-foreground font-medium">5–8 Pax</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['4d3n']['5-8'].A, tableCurrency)}</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['4d3n']['5-8'].B, tableCurrency)}</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['4d3n']['5-8'].C, tableCurrency)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <div className="mb-3 font-display font-semibold">5D4N Package · Per Person (USD)</div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b">
                          <th className="pb-2 pr-2 font-medium">Group</th>
                          <th className="pb-2 pr-2 font-medium">Option A</th>
                          <th className="pb-2 pr-2 font-medium">Option B</th>
                          <th className="pb-2 pr-2 font-medium">Option C</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b last:border-0">
                          <td className="py-2 pr-2 text-muted-foreground font-medium">2–4 Pax</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['5d4n']['2-4'].A, tableCurrency)}</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['5d4n']['2-4'].B, tableCurrency)}</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['5d4n']['2-4'].C, tableCurrency)}</td>
                        </tr>
                        <tr className="border-b last:border-0">
                          <td className="py-2 pr-2 text-muted-foreground font-medium">5–8 Pax</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['5d4n']['5-8'].A, tableCurrency)}</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['5d4n']['5-8'].B, tableCurrency)}</td>
                          <td className="py-2 pr-2 font-semibold">{formatCurrency(pricingCards['5d4n']['5-8'].C, tableCurrency)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
            {!pricingCards && pt?.columnHeaders?.length && pt?.rows?.length ? (
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">Package Pricing</h2>
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Category</th>
                        {pt.columnHeaders.map((h, hi) => (
                          <th key={hi} className="text-left p-3 font-medium min-w-[100px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pt.rows.map((row, ri) => (
                        <tr key={ri} className="border-b last:border-0">
                          <td className="p-3 font-medium">{row.category}</td>
                          {pt.columnHeaders.map((_, ci) => {
                            const v = row.values[ci];
                            return (
                              <td key={ci} className="p-3">
                                {typeof v === 'number' && !Number.isNaN(v) ? formatCurrency(v, tableCurrency) : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {pkg.blackoutDates && pkg.blackoutDates.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">Blackout dates</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {pkg.blackoutDates.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </section>
            )}

            {(pkg.inclusions?.length || 0) > 0 || (pkg.exclusions?.length || 0) > 0 ? (
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">What's Included</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border bg-card p-4">
                    <div className="mb-3 font-display font-semibold text-green-600">✓ Included</div>
                    <ul className="space-y-2 text-sm">
                      {(pkg.inclusions || []).map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <div className="mb-3 font-display font-semibold text-red-600">✕ Not Included</div>
                    <ul className="space-y-2 text-sm">
                      {(pkg.exclusions || []).map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-4 h-4 inline-flex items-center justify-center text-red-600 shrink-0 mt-0.5">✕</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ) : null}

            {(remarksNotes && remarksNotes.length > 0) || tdacMatch ? (
              <section className="space-y-6">
                {remarksNotes && remarksNotes.length > 0 ? (
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-4">Remarks & Notes</h2>
                    <div className="rounded-xl border bg-card p-5">
                      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                        {remarksNotes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {tdacMatch ? (
                  <div className="rounded-xl border bg-emerald-500/5 p-5">
                    <div className="text-xs font-bold uppercase tracking-wide text-emerald-600 mb-3">
                      🛂 Thailand Digital Arrival Card (TDAC) — Required
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p className="whitespace-pre-wrap">{tdacMatch}</p>
                      <p>
                        Register within 3 days before travel at:{' '}
                        <a
                          className="text-emerald-600 font-semibold hover:underline"
                          href="https://tdac.immigration.go.th"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          tdac.immigration.go.th
                        </a>
                      </p>
                    </div>
                  </div>
                ) : null}

              </section>
            ) : null}
            <section>
              {hasSecondaryItinerary ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Choose Package</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="flex flex-wrap gap-3 mb-6">
                    <Button type="button" variant={selectedPkg === '4d3n' ? 'default' : 'outline'} onClick={() => setSelectedPkg('4d3n')}>
                      {primaryTabLabel}
                    </Button>
                    <Button type="button" variant={selectedPkg === '5d4n' ? 'default' : 'outline'} onClick={() => setSelectedPkg('5d4n')}>
                      {secondaryTabLabel}
                    </Button>
                  </div>
                  <ItinerarySection title={selectedPkg === '4d3n' ? primaryTabLabel : secondaryTabLabel} days={selectedItinerary} />
                </>
              ) : (
                <ItinerarySection title="Itinerary" days={pkg.itinerary} />
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 border-brand-orange/20 shadow-lg overflow-hidden">
              <CardHeader className="bg-brand-orange/5 pb-4">
                <CardTitle className="font-display text-xl">Talk to us</CardTitle>
                <CardDescription>
                  Get a quote or ask questions. We&apos;ll help you plan this trip — call, WhatsApp, or email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <Button className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white" size="lg" asChild>
                  <a href={contact.telHref}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call {contact.phoneDisplay}
                  </a>
                </Button>
                <Button className="w-full" size="lg" variant="outline" asChild>
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
                <Button className="w-full" size="lg" variant="outline" asChild>
                  <a href={contact.mailtoHref}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email {contact.email}
                  </a>
                </Button>
                {pkg.isPromotion && validityLabel && (
                  <div className="flex items-start gap-2 text-sm rounded-lg bg-muted p-3 mt-4">
                    <CalendarRange className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Offer validity</p>
                      <p className="text-muted-foreground">{validityLabel}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
