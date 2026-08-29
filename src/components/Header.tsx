import { useState, useEffect, useRef } from 'react';
import { Search, Heart, ShoppingCart, User, Menu, X, ChevronDown, Package, Home, Grid3x3 } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useAuth } from '@/lib/auth';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

export function Header({ categories }: { categories: Category[] }) {
  const { navigate, path } = useRouter();
  const { count, openCart } = useCart();
  const { count: wishCount } = useWishlist();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [path]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchFocused(false);
      setMobileSearchOpen(false);
    }
  };

  const navLinks = [
    { label: 'Shop All', to: '/shop' },
    ...categories.slice(0, 5).map(c => ({ label: c.name, to: `/category/${c.slug}` })),
  ];

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-ink-900 text-cream-200 text-center py-2 text-xs">
        <div className="container-page flex items-center justify-center gap-2">
          <span className="hidden sm:inline">Free shipping on orders over $75</span>
          <span className="sm:hidden">Free shipping over $75</span>
          <span className="text-cream-500">·</span>
          <span>Use code WELCOME10 for 10% off your first order</span>
        </div>
      </div>

      {/* Main Header */}
      <header className={cn(
        'sticky top-0 z-50 bg-cream-50/95 backdrop-blur-md transition-shadow duration-300',
        scrolled ? 'shadow-soft' : 'border-b border-cream-200'
      )}>
        <div className="container-page">
          <div className="flex items-center justify-between h-16 lg:h-18 gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-ink-700"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="font-display text-xl lg:text-2xl font-semibold tracking-tight text-ink-900">
                Maison
              </span>
              <span className="hidden sm:inline text-2xs uppercase tracking-[0.2em] text-clay-600 font-medium border-l border-cream-400 pl-2">
                Est. 2019
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-2 text-sm font-medium text-ink-700 hover:text-clay-600 transition-colors rounded-md hover:bg-cream-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Search - Desktop */}
            <div ref={searchRef} className="hidden md:block flex-1 max-w-xs relative">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                    placeholder="Search products..."
                    className="w-full rounded-lg border border-cream-300 bg-cream-100/50 pl-9 pr-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 transition-all focus:border-ink-300 focus:bg-cream-50"
                  />
                </div>
              </form>
              {searchFocused && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-elevated border border-cream-200 p-3 animate-slide-down">
                  <p className="text-2xs uppercase tracking-wider text-ink-400 mb-2">Popular categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(c => (
                      <Link key={c.id} to={`/category/${c.slug}`} className="rounded-full bg-cream-100 hover:bg-cream-200 px-3 py-1 text-xs text-ink-700 transition-colors">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Mobile search */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden p-2 text-ink-700"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Account */}
              <Link to={user ? '/account' : '/login'} className="hidden sm:flex p-2 text-ink-700 hover:text-clay-600 transition-colors" aria-label="Account">
                <div className="relative">
                  <User size={20} />
                  {profile?.role === 'admin' && (
                    <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-gold-500" />
                  )}
                </div>
              </Link>

              {/* Wishlist */}
              <Link to="/wishlist" className="relative p-2 text-ink-700 hover:text-clay-600 transition-colors" aria-label="Wishlist">
                <Heart size={20} />
                {wishCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay-600 px-1 text-2xs font-bold text-cream-50">
                    {wishCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2 text-ink-700 hover:text-clay-600 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart size={20} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay-600 px-1 text-2xs font-bold text-cream-50 animate-scale-in">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {mobileSearchOpen && (
            <div className="md:hidden pb-3 animate-slide-down">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    autoFocus
                    className="w-full rounded-lg border border-cream-300 bg-cream-100/50 pl-9 pr-3 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-ink-300 focus:bg-cream-50"
                  />
                </div>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-cream-50 shadow-elevated animate-slide-in-right" style={{ animationDuration: '0.3s' }}>
            <div className="flex items-center justify-between p-4 border-b border-cream-200">
              <span className="font-display text-xl font-semibold text-ink-900">Maison</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-ink-500" aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-65px)] p-4 space-y-1">
              <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink-800 hover:bg-cream-100 transition-colors">
                <Home size={18} className="text-ink-400" /> Home
              </Link>
              <Link to="/shop" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink-800 hover:bg-cream-100 transition-colors">
                <Grid3x3 size={18} className="text-ink-400" /> Shop All
              </Link>
              <div className="py-2">
                <p className="px-3 text-2xs uppercase tracking-wider text-ink-400 mb-2">Categories</p>
                {categories.map(c => (
                  <Link key={c.id} to={`/category/${c.slug}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-700 hover:bg-cream-100 transition-colors">
                    {c.name}
                  </Link>
                ))}
              </div>
              <div className="border-t border-cream-200 pt-2">
                <Link to={user ? '/account' : '/login'} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink-800 hover:bg-cream-100 transition-colors">
                  <User size={18} className="text-ink-400" /> {user ? 'My Account' : 'Sign In'}
                </Link>
                <Link to="/wishlist" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink-800 hover:bg-cream-100 transition-colors">
                  <Heart size={18} className="text-ink-400" /> Wishlist {wishCount > 0 && `(${wishCount})`}
                </Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-clay-600 hover:bg-cream-100 transition-colors">
                    <Package size={18} /> Admin Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-cream-50 border-t border-cream-200 grid grid-cols-5">
        <Link to="/" className="flex flex-col items-center justify-center py-2.5 text-ink-600 hover:text-clay-600 transition-colors">
          <Home size={20} />
          <span className="text-2xs mt-0.5">Home</span>
        </Link>
        <Link to="/shop" className="flex flex-col items-center justify-center py-2.5 text-ink-600 hover:text-clay-600 transition-colors">
          <Grid3x3 size={20} />
          <span className="text-2xs mt-0.5">Shop</span>
        </Link>
        <button onClick={() => setMobileSearchOpen(true)} className="flex flex-col items-center justify-center py-2.5 text-ink-600 hover:text-clay-600 transition-colors">
          <Search size={20} />
          <span className="text-2xs mt-0.5">Search</span>
        </button>
        <Link to="/wishlist" className="flex flex-col items-center justify-center py-2.5 text-ink-600 hover:text-clay-600 transition-colors relative">
          <Heart size={20} />
          <span className="text-2xs mt-0.5">Wishlist</span>
          {wishCount > 0 && <span className="absolute top-1.5 right-1/4 h-1.5 w-1.5 rounded-full bg-clay-600" />}
        </Link>
        <Link to={user ? '/account' : '/login'} className="flex flex-col items-center justify-center py-2.5 text-ink-600 hover:text-clay-600 transition-colors">
          <User size={20} />
          <span className="text-2xs mt-0.5">Account</span>
        </Link>
      </nav>
    </>
  );
}
