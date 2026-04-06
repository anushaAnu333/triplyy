/**
 * Contact links for holiday packages (AFC-style: call / WhatsApp / email first).
 * Override via NEXT_PUBLIC_* in .env — see next.config.js
 */

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

export interface PackageEnquiryConfig {
  phoneDisplay: string;
  telHref: string;
  whatsappHref: string;
  email: string;
  mailtoHref: string;
}

export function getPackageEnquiryConfig(): PackageEnquiryConfig {
  const phone =
    process.env.NEXT_PUBLIC_ENQUIRY_PHONE?.trim() || '+971 52 516 3595';
  const email = process.env.NEXT_PUBLIC_ENQUIRY_EMAIL?.trim() || 'hello@triplysquad.com';
  const waRaw =
    process.env.NEXT_PUBLIC_ENQUIRY_WHATSAPP?.trim() || digitsOnly(phone) || '971525163595';

  const telHref = `tel:${digitsOnly(phone)}`;
  const mailtoHref = `mailto:${email}`;

  return {
    phoneDisplay: phone,
    telHref,
    whatsappHref: `https://wa.me/${waRaw}`,
    email,
    mailtoHref,
  };
}

/** Merge defaults with optional per-package overrides (admin-edited). */
export function resolvePackageContact(pkg: {
  contactPhone?: string;
  contactEmail?: string;
  contactInstagram?: string;
}): PackageEnquiryConfig & { instagram?: string } {
  const base = getPackageEnquiryConfig();
  const phone = pkg.contactPhone?.trim();
  const email = pkg.contactEmail?.trim();
  const ig = pkg.contactInstagram?.trim();
  return {
    phoneDisplay: phone || base.phoneDisplay,
    telHref: phone ? `tel:${digitsOnly(phone)}` : base.telHref,
    email: email || base.email,
    mailtoHref: email ? `mailto:${email}` : base.mailtoHref,
    whatsappHref: base.whatsappHref,
    instagram: ig || undefined,
  };
}

/** WhatsApp with optional prefilled message. Uses package phone override when set. */
export function getWhatsAppEnquiryUrl(packageName: string, contactPhoneOverride?: string): string {
  const defaultCfg = getPackageEnquiryConfig();
  let base = defaultCfg.whatsappHref.split('?')[0];
  if (contactPhoneOverride?.trim()) {
    const d = digitsOnly(contactPhoneOverride);
    if (d) base = `https://wa.me/${d}`;
  }
  const text = `Hi, I'm interested in: ${packageName}`;
  return `${base}?text=${encodeURIComponent(text)}`;
}
