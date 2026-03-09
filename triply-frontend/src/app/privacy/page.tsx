import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | TR✨PLY',
  description: 'How TR✨PLY collects, stores, and uses your personal data. Covers Stripe, Tamara, and Tabby.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-black mb-2">Privacy Policy</h1>
        <p className="text-gray-600 mb-10">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">1. Who We Are</h2>
            <p>
              TR✨PLY (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the travel community platform at our website. We are the data controller for personal data collected through the Platform. Contact: <a href="mailto:hello@triplysquads.com" className="text-brand-orange hover:underline">hello@triplysquads.com</a>, +971 52 516 3595, UAE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">2. What Data We Collect</h2>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Account and profile:</strong> name, email address, password (hashed), and profile details.</li>
              <li><strong>Bookings:</strong> travel preferences, selected dates, booking reference, and booking communications.</li>
              <li><strong>Payment:</strong> we do not store your full card number. Card payments are processed by Stripe (PCI-DSS compliant). For BNPL via Tamara or Tabby, payment data is handled by those providers under their own privacy policies. We may receive limited transaction data (e.g. last four digits, status) for support.</li>
              <li><strong>Usage and technical data:</strong> IP address, browser type, device information, and pages visited.</li>
              <li><strong>Communications:</strong> records of emails, calls, or contact form submissions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">3. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Create and manage your account and bookings.</li>
              <li>Process payments and send booking confirmations, updates, and support messages.</li>
              <li>Share necessary booking data with payment providers (Stripe, Tamara, Tabby) to process transactions.</li>
              <li>Comply with legal obligations and prevent fraud.</li>
              <li>Improve our website and services.</li>
              <li>Send marketing emails only if you have agreed; you can opt out at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">4. How We Store Your Data</h2>
            <p>
              Your data is stored on secure servers in the UAE or jurisdictions where our service providers operate. We retain data for as long as needed to provide services, resolve disputes, and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">5. Sharing Your Data</h2>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Payment providers:</strong> Stripe (card payments), Tamara, and Tabby (BNPL) — to process transactions, each under their own privacy policy.</li>
              <li><strong>Travel providers or partners:</strong> to fulfill your booking.</li>
              <li><strong>Service providers:</strong> hosting, email, analytics — under strict confidentiality.</li>
              <li><strong>Authorities:</strong> when required by law or to protect our rights.</li>
            </ul>
            <p className="mt-2">
              We do not sell your personal data to third parties for their marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">6. Your Rights</h2>
            <p>
              You may have the right to access, correct, delete, restrict or object to processing of your data, and to withdraw consent. Contact us at <a href="mailto:hello@triplysquads.com" className="text-brand-orange hover:underline">hello@triplysquads.com</a> to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">7. Cookies</h2>
            <p>
              We use cookies to run the website, remember preferences, and analyze usage. You can manage cookie settings in your browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date will change, and we may notify you of significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-black mt-8 mb-2">9. Contact</h2>
            <p>
              For privacy-related questions: <a href="mailto:hello@triplysquads.com" className="text-brand-orange hover:underline">hello@triplysquads.com</a> or +971 52 516 3595.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-6">
          <Link href="/terms" className="text-brand-orange font-semibold hover:underline">Terms of Service</Link>
          <Link href="/contact" className="text-brand-orange font-semibold hover:underline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
