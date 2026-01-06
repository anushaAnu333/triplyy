'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Blog', href: '/blog' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQs', href: '/faqs' },
    { name: 'Cancellation Policy', href: '/cancellation' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  destinations: [
    { name: 'Maldives', href: '/destinations/magical-maldives' },
    { name: 'Bali', href: '/destinations/enchanting-bali' },
    { name: 'Switzerland', href: '/destinations/swiss-alps-adventure' },
    { name: 'All Destinations', href: '/destinations' },
  ],
};

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: '#' },
  { name: 'Twitter', icon: Twitter, href: '#' },
  { name: 'Instagram', icon: Instagram, href: '#' },
  { name: 'Youtube', icon: Youtube, href: '#' },
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
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Get Travel Inspiration
              </h3>
              <p className="text-white/60">
                Subscribe for exclusive deals and travel tips
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-w-[250px]"
              />
              <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white border-0 px-6 font-semibold">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold">TRIPLY</span>
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
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="font-bold text-lg mb-4">Destinations</h4>
            <ul className="space-y-3">
              {footerLinks.destinations.map((link) => (
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
                <span className="text-white/60">
                  Dubai Marina, Tower A<br />
                  Dubai, UAE
                </span>
              </li>
              <li>
                <a href="tel:+97145551234" className="flex items-center gap-3 text-white/60 hover:text-brand-orange transition-colors">
                  <Phone className="w-5 h-5 text-brand-orange" />
                  +971 4 555 1234
                </a>
              </li>
              <li>
                <a href="mailto:hello@triply.com" className="flex items-center gap-3 text-white/60 hover:text-brand-orange transition-colors">
                  <Mail className="w-5 h-5 text-brand-orange" />
                  hello@triply.com
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
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} TRIPLY. All rights reserved.
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
