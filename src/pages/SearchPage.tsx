import { useEffect, useState } from 'react';
import { Search as SearchIcon, X, ArrowRight } from 'lucide-react';
import { useRouter, Link } from '@/lib/router';
import type { Product, Category } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Loader';
import { fetchProducts, fetchCategories } from '@/lib/data';

const RECENT_KEY = 'maison-recent-searches';

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}
function addRecent(q: string) {
  const recent = getRecent().filter(r => r !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

export function SearchPage() {
  const { query, navigate } = useRouter();
  const q = query.get('q') ?? '';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(q);
  const [recentSearches] = useState<string[]>(getRecent);

  useEffect(() => { setInput(q); }, [q]);

  useEffect(() => {
    if (!q) { setProducts([]); return; }
    (async () => {
      setLoading(true);
      try {
        const [prods, cats] = await Promise.all([
          fetchProducts({ search: q, limit: 24 }),
          fetchCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
        addRecent(q);
      } catch (e) { console.error('Search error:', e); }
      finally { setLoading(false); }
    })();
  }, [q]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) navigate(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  const matchingCategories = q
    ? categories.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <div className="container-page py-8 pb-20 md:pb-12">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Search for products, categories..."
              autoFocus
              className="w-full rounded-xl border border-cream-400 bg-white pl-12 pr-10 py-4 text-base text-ink-800 placeholder:text-ink-400 focus:border-ink-300 shadow-soft"
            />
            {input && (
              <button type="button" onClick={() => setInput('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-800" aria-label="Clear">
                <X size={18} />
              </button>
            )}
          </div>
        </form>

        {/* Recent searches */}
        {!q && recentSearches.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Recent searches</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map(s => (
                <Link key={s} to={`/search?q=${encodeURIComponent(s)}`} className="rounded-full bg-cream-100 hover:bg-cream-200 px-3 py-1.5 text-sm text-ink-700 transition-colors">
                  {s}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions when no query */}
        {!q && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Browse by category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <Link key={c.id} to={`/category/${c.slug}`} className="rounded-full bg-cream-100 hover:bg-cream-200 px-3 py-1.5 text-sm text-ink-700 transition-colors">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {q && (
        <>
          <p className="text-sm text-ink-500 mb-6">
            {loading ? 'Searching...' : `${products.length} result${products.length !== 1 ? 's' : ''} for "${q}"`}
          </p>

          {/* Matching categories */}
          {matchingCategories.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {matchingCategories.map(c => (
                  <Link key={c.id} to={`/category/${c.slug}`} className="inline-flex items-center gap-1.5 rounded-lg border border-cream-300 bg-white px-4 py-2 text-sm text-ink-700 hover:border-ink-300 transition-colors">
                    {c.name} <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={48} />}
              title="No results found"
              description={`We couldn't find anything matching "${q}". Try different keywords or browse our categories.`}
              action={<Link to="/shop" className="btn btn-primary">Browse All Products</Link>}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
