import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}

