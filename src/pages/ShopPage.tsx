import { useEffect, useState, useMemo } from 'react';
import { SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';
import { useRouter, Link } from '@/lib/router';
import type { Product, Category } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { SkeletonCard } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchProducts, fetchCategories } from '@/lib/data';
import { cn } from '@/lib/utils';

export function ShopPage({ categorySlug }: { categorySlug?: string }) {
  const { query, navigate } = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
  const search = query.get('q') ?? '';
  const selectedCategory = categorySlug ?? query.get('category') ?? '';
  const sort = query.get('sort') ?? 'featured';
  const minPrice = query.get('minPrice');
  const maxPrice = query.get('maxPrice');
  const inStockOnly = query.get('inStock') === 'true';
  const filterNew = query.get('filter') === 'new';

  useEffect(() => {
    (async () => {
      setLoading(true);
      setVisibleCount(12);
      try {
        const [prods, cats] = await Promise.all([
          fetchProducts({
            search: search || undefined,
            sort,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            inStock: inStockOnly || undefined,
            isNew: filterNew || undefined,
          }),
          fetchCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (e) {
        console.error('Shop load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [search, sort, minPrice, maxPrice, inStockOnly, filterNew]);

  // Filter by category client-side if slug is provided
  const filteredProducts = useMemo(() => {
    if (!categorySlug) return products;
    const cat = categories.find(c => c.slug === categorySlug);
    if (!cat) return products;
    return products.filter(p => p.category_id === cat.id);
  }, [products, categories, categorySlug]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const activeCategory = categories.find(c => c.slug === categorySlug);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(query.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    navigate(`/shop?${params.toString()}`, { replace: true });
  };

  const setSort = (s: string) => updateFilter('sort', s);

  const priceRanges = [
    { label: 'Under $50', min: '0', max: '50' },
    { label: '$50 – $100', min: '50', max: '100' },
    { label: '$100 – $250', min: '100', max: '250' },
    { label: '$250 – $500', min: '250', max: '500' },
    { label: 'Over $500', min: '500', max: '' },
  ];

  const activePriceRange = priceRanges.find(r => r.min === minPrice && r.max === maxPrice);

  const clearFilters = () => {
    navigate(categorySlug ? `/category/${categorySlug}` : '/shop', { replace: true });
  };

  const hasActiveFilters = !!(search || minPrice || maxPrice || inStockOnly || filterNew);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-ink-800 mb-3">Categories</h3>
        <div className="space-y-1.5">
          <Link to="/shop" className={cn(
            'block rounded-md px-3 py-2 text-sm transition-colors',
            !selectedCategory ? 'bg-ink-900 text-cream-50' : 'text-ink-600 hover:bg-cream-100'
          )}>
            All Products
          </Link>
          {categories.map(c => (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              className={cn(
                'block rounded-md px-3 py-2 text-sm transition-colors',
                categorySlug === c.slug ? 'bg-ink-900 text-cream-50' : 'text-ink-600 hover:bg-cream-100'
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-sm font-semibold text-ink-800 mb-3">Price Range</h3>
        <div className="space-y-1.5">
          {priceRanges.map(r => (
            <button
              key={r.label}
              onClick={() => {
                updateFilter('minPrice', r.min);
                updateFilter('maxPrice', r.max || null);
              }}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors w-full text-left',
                activePriceRange?.label === r.label ? 'bg-cream-100 text-ink-900' : 'text-ink-600 hover:bg-cream-100'
              )}
            >
              {activePriceRange?.label === r.label && <Check size={14} />}
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-sm font-semibold text-ink-800 mb-3">Availability</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={e => updateFilter('inStock', e.target.checked ? 'true' : null)}
            className="rounded border-cream-400 text-clay-600 focus:ring-clay-400"
          />
          <span className="text-sm text-ink-600">In stock only</span>
        </label>
      </div>

      {hasActiveFilters && (
        <button onClick={clearFilters} className="text-sm text-clay-600 hover:text-clay-700 font-medium">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-page py-8 pb-20 md:pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-ink-500 mb-6">
        <Link to="/" className="hover:text-ink-800">Home</Link>
        <span>/</span>
        {categorySlug ? (
          <>
            <Link to="/shop" className="hover:text-ink-800">Shop</Link>
            <span>/</span>
            <span className="text-ink-800">{activeCategory?.name ?? 'Category'}</span>
          </>
        ) : (
          <span className="text-ink-800">Shop All</span>
        )}
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-medium text-ink-900">
            {activeCategory?.name ?? (search ? `Results for "${search}"` : 'All Products')}
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            {loading ? 'Loading...' : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`}
            {activeCategory?.description && ` · ${activeCategory.description}`}
          </p>
        </div>

        {/* Sort + Filter button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="appearance-none rounded-lg border border-cream-400 bg-cream-50 pl-4 pr-9 py-2.5 text-sm text-ink-800 cursor-pointer hover:border-ink-300 transition-colors"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Alphabetical</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 rounded-lg border border-cream-400 bg-cream-50 px-4 py-2.5 text-sm text-ink-800"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24">
            <FilterContent />
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : visibleProducts.length === 0 ? (
            <EmptyState
              icon={<SlidersHorizontal size={40} />}
              title="No products found"
              description="Try adjusting your filters or search terms to find what you're looking for."
              action={<button onClick={clearFilters} className="btn btn-outline">Clear filters</button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {visibleProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
              {visibleCount < filteredProducts.length && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => setVisibleCount(c => c + 12)}
                    className="btn btn-outline"
                  >
                    Load More ({filteredProducts.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={() => setFiltersOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-cream-50 shadow-elevated flex flex-col animate-slide-in-right" style={{ animationDuration: '0.3s' }}>
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h2 className="font-display text-lg font-medium text-ink-900">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} className="p-2 text-ink-500" aria-label="Close filters">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterContent />
            </div>
            <div className="border-t border-cream-200 p-5">
              <button onClick={() => setFiltersOpen(false)} className="btn btn-primary w-full">
                Show {filteredProducts.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
