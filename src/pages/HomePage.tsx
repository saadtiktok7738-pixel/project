import { useEffect, useState } from 'react';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones, Award, Quote, Star } from 'lucide-react';
import { Link } from '@/lib/router';
import type { Product, Category, Banner } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Loader';
import { fetchProducts, fetchCategories, fetchBanners } from '@/lib/data';

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cats, best, newArr, feat, bann] = await Promise.all([
          fetchCategories(),
          fetchProducts({ bestseller: true, limit: 8 }),
          fetchProducts({ isNew: true, limit: 4 }),
          fetchProducts({ featured: true, limit: 8 }),
          fetchBanners('hero'),
        ]);
        setCategories(cats);
        setBestsellers(best);
        setNewArrivals(newArr);
        setFeatured(feat);
        setBanners(bann);
      } catch (e) {
        console.error('Homepage load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const heroBanner = banners[0];
  const promoBanner = banners[1];

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream-100">
        <div className="container-page py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 animate-fade-up">
              <Badge variant="gold" className="bg-gold-100/80">New Autumn Collection</Badge>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-ink-900 text-balance">
                The art of slow craft, <em className="text-clay-600 not-italic font-normal italic">made to last</em>
              </h1>
              <p className="text-base lg:text-lg text-ink-600 max-w-md leading-relaxed">
                Hand-stitched leather, wheel-thrown ceramics, and considered homeware from independent makers we know by name.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/shop" className="btn btn-primary">
                  Shop the Collection <ArrowRight size={16} />
                </Link>
                <Link to="/about" className="btn btn-outline">
                  Our Story
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div>
                  <p className="font-display text-2xl font-semibold text-ink-900">120+</p>
                  <p className="text-xs text-ink-500">Independent makers</p>
                </div>
                <div className="w-px h-10 bg-cream-400" />
                <div>
                  <p className="font-display text-2xl font-semibold text-ink-900">15k+</p>
                  <p className="text-xs text-ink-500">Happy customers</p>
                </div>
                <div className="w-px h-10 bg-cream-400" />
                <div>
                  <p className="font-display text-2xl font-semibold text-ink-900">4.9★</p>
                  <p className="text-xs text-ink-500">Average rating</p>
                </div>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[3/4] overflow-hidden rounded-xl bg-cream-200">
                    {heroBanner?.image_url && (
                      <img src={heroBanner.image_url} alt={heroBanner.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="aspect-square overflow-hidden rounded-xl bg-cream-200">
                    {bestsellers[1]?.primary_image && (
                      <img src={bestsellers[1].primary_image} alt={bestsellers[1].name} className="h-full w-full object-cover" />
                    )}
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square overflow-hidden rounded-xl bg-cream-200">
                    {featured[0]?.primary_image && (
                      <img src={featured[0].primary_image} alt={featured[0].name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="aspect-[3/4] overflow-hidden rounded-xl bg-cream-200">
                    {bestsellers[0]?.primary_image && (
                      <img src={bestsellers[0].primary_image} alt={bestsellers[0].name} className="h-full w-full object-cover" />
                    )}
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-ink-900 text-cream-50 rounded-full px-5 py-2.5 shadow-elevated whitespace-nowrap">
                <span className="text-xs font-medium">✦ Handcrafted in 18 countries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-cream-200 bg-cream-50">
        <div className="container-page py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Fast Delivery', desc: 'Free over $75, 2–5 days' },
              { icon: ShieldCheck, title: 'Secure Payments', desc: 'Encrypted & protected' },
              { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return window' },
              { icon: Headphones, title: 'Real Support', desc: 'Mon–Fri, 9–6 EST' },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sage-100 text-sage-600 shrink-0">
                  <item.icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-800">{item.title}</p>
                  <p className="text-xs text-ink-500 truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container-page py-16 lg:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-clay-600 font-medium mb-2">Browse by craft</p>
            <h2 className="font-display text-3xl lg:text-4xl font-medium text-ink-900">Shop by category</h2>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-clay-600 transition-colors link-underline">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Large card */}
            <Link to={`/category/${categories[0]?.slug}`} className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden rounded-xl bg-cream-200 aspect-square lg:aspect-auto">
              <img src={categories[0]?.image_url ?? ''} alt={categories[0]?.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-display text-xl lg:text-2xl font-medium text-cream-50">{categories[0]?.name}</h3>
                <p className="text-xs lg:text-sm text-cream-200 mt-1 line-clamp-2">{categories[0]?.description}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-cream-50 mt-3 link-underline">
                  Explore <ArrowRight size={14} />
                </span>
              </div>
            </Link>

            {/* Small cards */}
            {categories.slice(1, 5).map(cat => (
              <Link key={cat.id} to={`/category/${cat.slug}`} className="group relative overflow-hidden rounded-xl bg-cream-200 aspect-square">
                <img src={cat.image_url ?? ''} alt={cat.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm font-medium text-cream-50">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bestsellers */}
      <section className="bg-cream-100 py-16 lg:py-20">
        <div className="container-page">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-clay-600 font-medium mb-2">Loved by thousands</p>
              <h2 className="font-display text-3xl lg:text-4xl font-medium text-ink-900">Best sellers</h2>
            </div>
            <Link to="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-clay-600 transition-colors link-underline">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : bestsellers.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="container-page py-16 lg:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900">
          <div className="grid lg:grid-cols-2 items-center">
            <div className="p-8 lg:p-12 space-y-5">
              <Badge variant="sale">Limited time</Badge>
              <h2 className="font-display text-3xl lg:text-4xl font-medium text-cream-50 leading-tight">
                Autumn arrivals — up to 25% off
              </h2>
              <p className="text-sm lg:text-base text-cream-300 max-w-md">
                New ceramics, leather goods, and wool accessories from our maker community. Refresh your everyday with pieces made to last.
              </p>
              <div className="flex gap-3">
                <Link to="/shop" className="btn btn-accent">Shop New In <ArrowRight size={16} /></Link>
                <Link to="/category/apparel" className="btn btn-outline border-cream-500 text-cream-100 hover:bg-cream-50 hover:text-ink-900">Explore Apparel</Link>
              </div>
            </div>
            <div className="aspect-[4/3] lg:aspect-auto lg:h-full overflow-hidden">
              {promoBanner?.image_url ? (
                <img src={promoBanner.image_url} alt={promoBanner.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-ink-800" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container-page pb-16 lg:pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-clay-600 font-medium mb-2">Just landed</p>
            <h2 className="font-display text-3xl lg:text-4xl font-medium text-ink-900">New arrivals</h2>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-clay-600 transition-colors link-underline">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : newArrivals.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Editorial / Brand Story */}
      <section className="bg-ink-900 text-cream-100 py-16 lg:py-24">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="aspect-[4/3] overflow-hidden rounded-xl">
              <img src="https://images.pexels.com/photos/36731516/pexels-photo-36731516.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Artisan at work" className="h-full w-full object-cover" />
            </div>
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-wider text-gold-400 font-medium">Our story</p>
              <h2 className="font-display text-3xl lg:text-4xl font-medium text-cream-50 leading-tight">
                Every piece has a maker, and we know them by name
              </h2>
              <p className="text-sm lg:text-base text-cream-300 leading-relaxed">
                Maison was founded on a simple belief: that the things we live with should be made by hands, not factories. We travel to workshops in Portugal, Vietnam, Morocco, and beyond to find makers whose craft we trust — and whose stories we share with you.
              </p>
              <p className="text-sm lg:text-base text-cream-300 leading-relaxed">
                Every product in our collection is sourced directly, paid fairly, and built to outlast trends. We think that's worth paying for.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300 transition-colors link-underline">
                Read our full story <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container-page py-16 lg:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-clay-600 font-medium mb-2">Handpicked for you</p>
            <h2 className="font-display text-3xl lg:text-4xl font-medium text-ink-900">Featured pieces</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-cream-100 py-16 lg:py-20">
        <div className="container-page">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider text-clay-600 font-medium mb-2">What people say</p>
            <h2 className="font-display text-3xl lg:text-4xl font-medium text-ink-900">Loved by our community</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card p-6 space-y-4">
                <Quote size={28} className="text-clay-300" />
                <p className="text-sm text-ink-700 leading-relaxed">{t.quote}</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, n) => <Star key={n} size={14} className="fill-gold-400 text-gold-400" />)}
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-cream-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-100 text-clay-700 font-medium text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{t.name}</p>
                    <p className="text-xs text-ink-500">Purchased: {t.product}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Guarantee */}
      <section className="container-page py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 space-y-6">
            <div className="flex items-center gap-3">
              <Award size={28} className="text-gold-500" />
              <p className="text-xs uppercase tracking-wider text-clay-600 font-medium">Our promise</p>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-medium text-ink-900 leading-tight">
              Crafted to outlast. Backed for life.
            </h2>
            <p className="text-sm lg:text-base text-ink-600 leading-relaxed">
              We stand behind every piece we sell. If a product doesn't meet our standards — or yours — we'll make it right. That's the Maison guarantee.
            </p>
            <div className="space-y-4">
              {[
                { title: 'Lifetime craftsmanship guarantee', desc: 'If stitching, hardware, or construction fails, we repair or replace.' },
                { title: 'Fair-trade sourced', desc: 'Every maker is paid directly and transparently for their work.' },
                { title: 'Sustainable materials', desc: 'Vegetable-tanned leather, natural fibres, and lead-free glazes.' },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-100 text-sage-600 shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{item.title}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2 aspect-[4/3] overflow-hidden rounded-2xl">
            <img src="https://images.pexels.com/photos/18425415/pexels-photo-18425415.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Craftsmanship" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>
    </div>
  );
}

const testimonials = [
  { name: 'Eleanor Hartwell', product: 'Heritage Tote Bag', quote: "I've carried this tote daily for six months and the leather has only gotten more beautiful. The stitching is flawless — this is a bag I'll have for decades." },
  { name: 'Marcus Chen', product: 'Onyx Automatic Watch', quote: "The attention to detail is remarkable. From the packaging to the movement, everything feels considered. Worth every penny and then some." },
  { name: 'Sofia Reyes', product: 'Hanoi Tea Set', quote: "Each piece is genuinely unique. You can see the hand of the maker in every brushstroke. It makes our morning ritual feel special." },
];
