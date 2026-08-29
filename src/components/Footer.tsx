import { Instagram, Facebook, Twitter, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router';
import { useState } from 'react';
import { useToast } from '@/lib/toast';
import type { Category } from '@/types';

export function Footer({ categories }: { categories: Category[] }) {
  const { show } = useToast();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      show('Thanks for subscribing! Check your inbox for a welcome offer.');
      setEmail('');
    }
  };

  return (
    <footer className="bg-ink-900 text-cream-200 mt-20">
      {/* Newsletter strip */}
      <div className="border-b border-ink-800">
        <div className="container-page py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-medium text-cream-50">
                Join the Maison circle
              </h2>
              <p className="mt-2 text-sm text-cream-400 max-w-md">
                Early access to new collections, maker stories, and 10% off your first order.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-3 lg:justify-end">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 max-w-sm rounded-lg border border-ink-700 bg-ink-800 px-4 py-3 text-sm text-cream-50 placeholder:text-ink-500 focus:border-clay-400 focus:bg-ink-800"
              />
              <button type="submit" className="btn btn-accent">
                Subscribe <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-page py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="font-display text-2xl font-semibold text-cream-50">
              Maison
            </Link>
            <p className="mt-4 text-sm text-cream-400 max-w-xs leading-relaxed">
              A curated collection of handcrafted leather, ceramics, and homeware from independent makers around the world. Made to last a lifetime — not a season.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
              ].map(s => (
                <a
                  key={s.label}
                  href="#"
                  onClick={e => e.preventDefault()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-cream-400 hover:bg-clay-600 hover:text-cream-50 transition-colors"
                  aria-label={s.label}
                >
                  <s.icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-cream-50 mb-4">Shop</h3>
            <ul className="space-y-2.5">
              <li><Link to="/shop" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">All Products</Link></li>
              {categories.slice(0, 5).map(c => (
                <li key={c.id}><Link to={`/category/${c.slug}`} className="text-sm text-cream-400 hover:text-cream-50 transition-colors">{c.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-cream-50 mb-4">Service</h3>
            <ul className="space-y-2.5">
              <li><Link to="/shipping" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/returns" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/faq" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">Contact Us</Link></li>
              <li><Link to="/track-order" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-cream-50 mb-4">About</h3>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">Our Story</Link></li>
              <li><Link to="/makers" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">Our Makers</Link></li>
              <li><Link to="/sustainability" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">Sustainability</Link></li>
              <li><Link to="/careers" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">Careers</Link></li>
              <li><Link to="/press" className="text-sm text-cream-400 hover:text-cream-50 transition-colors">Press</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-cream-50 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-cream-400">
                <MapPin size={15} className="mt-0.5 shrink-0" />
                <span>123 Maker's Lane, Brooklyn, NY 11201</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-cream-400">
                <Phone size={15} className="shrink-0" />
                <span>+1 (555) 010-2024</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-cream-400">
                <Mail size={15} className="shrink-0" />
                <span>hello@maison.shop</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ink-800">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream-500">© {new Date().getFullYear()} Maison. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-cream-500">Secure payments via</span>
            <div className="flex items-center gap-2">
              {['VISA', 'MC', 'AMEX', 'PYPL'].map(p => (
                <span key={p} className="rounded border border-ink-700 bg-ink-800 px-2 py-1 text-2xs font-bold text-cream-400">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
