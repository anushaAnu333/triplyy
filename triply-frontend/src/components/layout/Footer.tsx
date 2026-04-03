'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

const footerLinks = {
  company: [{ name: 'About Us', href: '/about' }],
  support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Cancellation Policy', href: '/cancellation' },
    { name: 'Refund Policy', href: '/refund' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
  ],
};

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/triply.squads' },
  {
    name: 'Facebook',
    icon: Facebook,
    href: 'https://www.facebook.com/share/1EWYuZEQC3/?mibextid=wwXIfr',
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    href: 'https://www.linkedin.com/company/trply/',
  },
  { name: 'WhatsApp', icon: MessageCircle, href: 'https://wa.me/971525163595' },
];

export function Footer() {
  const pathname = usePathname();

  const isAdminPage = pathname?.startsWith('/admin');
  const isAffiliatePage = pathname?.startsWith('/affiliate');
  if (isAdminPage || isAffiliatePage) {
    return null;
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Amber Gem Tower, Ajman, United Arab Emirates'
  )}`;

  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-4 md:py-4.5">
        <Link href="/" className="inline-block">
          <Image
            src="/images/triply-logo.png"
            alt="TRIPLY - Travel. Connect. Repeat."
            width={280}
            height={80}
            className="h-10 w-auto object-contain md:h-11"
          />
        </Link>
        <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-6 lg:gap-6">
          <div className="lg:col-span-2">
            <p className="mb-3 max-w-md text-xs leading-relaxed text-white/60">
              Making group travel simple, flexible, and fun — one squad at a time. Reserve any trip from AED 199 and
              travel when life allows.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-orange"
                  aria-label={social.name}
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-1.5 text-xs font-bold text-white">Company</h4>
            <ul className="space-y-1.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs text-white/60 transition-colors hover:text-brand-orange"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-1.5 text-xs font-bold text-white">Support</h4>
            <ul className="space-y-1.5">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs text-white/60 transition-colors hover:text-brand-orange"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-1.5 text-xs font-bold text-white">Contact</h4>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-orange" />
                <span className="text-xs text-white/60">UAE</span>
              </li>
              <li>
                <a
                  href="tel:+971525163595"
                  className="flex items-center gap-2.5 text-xs text-white/60 transition-colors hover:text-brand-orange"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-brand-orange" />
                  +971 52 516 3595
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@triplysquads.com"
                  className="flex items-center gap-2.5 text-xs text-white/60 transition-colors hover:text-brand-orange"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-brand-orange" />
                  hello@triplysquads.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-orange" />
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs leading-snug text-white/60 hover:text-brand-orange transition-colors"
                  aria-label="View on Google Maps"
                >
                  Office No. BC-891204, 26th Floor, Amber Gem Tower, Sheikh Khalifa Street, Ajman, United Arab Emirates
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-1.5 px-4 py-2 md:flex-row">
          <p className="text-center text-xs text-white/40 md:text-left">TR✨PLY · Travel. Connect. Repeat.</p>
          <p className="text-center text-xs text-white/40 md:text-right">
            © 2026 TR✨PLY Travel and Tourism FZE LLC. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs text-white/40 transition-colors hover:text-brand-orange"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
