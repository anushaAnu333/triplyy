'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, ChevronDown, LogOut, LayoutDashboard, Calendar, Settings, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Destinations', href: '/destinations' },
  { name: 'How It Works', href: '/#how-it-works' },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide header on admin and affiliate pages (they have their own navigation)
  const isAdminPage = pathname?.startsWith('/admin');
  const isAffiliatePage = pathname?.startsWith('/affiliate');
  if (isAdminPage || isAffiliatePage) {
    return null;
  }

  const isHomePage = pathname === '/';
  const headerBg = isScrolled || !isHomePage
    ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
    : 'bg-transparent';
  const textColor = isScrolled || !isHomePage ? 'text-black' : 'text-white';
  const logoColor = isScrolled || !isHomePage ? 'text-brand-orange' : 'text-white';

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'affiliate') return '/affiliate/dashboard';
    return '/dashboard';
  };

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      headerBg
    )}>
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className={cn('text-2xl font-bold tracking-tight', logoColor)}>
              TRIPLY
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-brand-orange/10 text-brand-orange'
                    : cn(textColor, 'hover:bg-black/5')
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      'flex items-center gap-2 rounded-full',
                      textColor
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white text-sm font-medium">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <span className="font-medium">{user?.firstName}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookings" className="cursor-pointer">
                      <Calendar className="w-4 h-4 mr-2" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'user' && (
                    <DropdownMenuItem asChild>
                      <Link href="/refer" className="cursor-pointer">
                        <Gift className="w-4 h-4 mr-2" />
                        Refer & Earn
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  asChild 
                  variant="ghost" 
                  className={cn('rounded-full font-medium', textColor)}
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className="rounded-full bg-brand-orange hover:bg-brand-orange/90 text-white border-0 font-semibold"
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn('md:hidden p-2 rounded-lg', textColor)}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg animate-slide-down">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-lg text-black font-medium',
                    pathname === item.href ? 'bg-brand-orange/10 text-brand-orange' : 'hover:bg-gray-100'
                  )}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-4 border-t">
                <div className="px-4 pb-2">
                  <LanguageSelector />
                </div>
              </div>
              
              <div className="pt-2 border-t space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      href={getDashboardLink()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-black font-medium hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-black font-medium hover:bg-gray-100"
                    >
                      My Bookings
                    </Link>
                    {user?.role === 'user' && (
                      <Link
                        href="/refer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-lg text-black font-medium hover:bg-gray-100"
                      >
                        Refer & Earn
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 rounded-lg text-red-600 font-medium hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-black font-medium hover:bg-gray-100"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg bg-brand-orange text-white font-semibold text-center"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
