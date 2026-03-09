'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
  ],
  support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Cancellation Policy', href: '/cancellation' },
    { name: 'Refund Policy', href: '/refund' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
  ],
  destinations: [
    { name: 'Maldives', href: '/destinations/magical-maldives' },
    { name: 'Bali', href: '/destinations/enchanting-bali' },
    { name: 'Switzerland', href: '/destinations/swiss-alps-adventure' },
    { name: 'All Destinations', href: '/destinations' },
  ],
};

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/triply.squad' },
];

export function Footer() {
  const pathname = usePathname();
  
  // Hide footer on admin and affiliate pages (they have their own navigation)
  const isAdminPage = pathname?.startsWith('/admin');
  const isAffiliatePage = pathname?.startsWith('/affiliate');
  if (isAdminPage || isAffiliatePage) {
    return null;
  }

  return (
    <footer className="bg-black text-white">
   

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 border-b border-white/10 pb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
          
          <Link href="/" className="">
              <Image
                src="/images/triply-logo.png"
                alt="TRIPLY - Travel. Connect. Repeat."
                width={280}
                height={80}
                className="h-20 w-auto object-contain"
              />
            </Link>
            <p className="text-white/60 mb-6 leading-relaxed">
              Your trusted travel partner for unforgettable adventures. 
              Book with just AED 199 deposit and travel when you're ready.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-lg mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-white/60 hover:text-brand-orange transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-white/60 hover:text-brand-orange transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                <span className="text-white/60">UAE</span>
              </li>
              <li>
                <a href="tel:+971525163595" className="flex items-center gap-3 text-white/60 hover:text-brand-orange transition-colors">
                  <Phone className="w-5 h-5 text-brand-orange" />
                  +971 52 516 3595
                </a>
              </li>
              <li>
                <a href="mailto:hello@triplysquads.com" className="flex items-center gap-3 text-white/60 hover:text-brand-orange transition-colors">
                  <Mail className="w-5 h-5 text-brand-orange" />
                  hello@triplysquads.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm text-center md:text-left">
              TR✨PLY · Travel. Connect. Repeat.
            </p>
            <p className="text-white/40 text-sm text-center md:text-left">
              © 2026 TR✨PLY Travel and Tourism FZE LLC. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-white/40 text-sm hover:text-brand-orange transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
