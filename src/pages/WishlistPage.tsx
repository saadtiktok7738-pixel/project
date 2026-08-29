import { useEffect, useState } from 'react';
import { Heart, Trash2, ShoppingCart, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { useWishlist } from '@/lib/wishlist';
import { useCart } from '@/lib/cart';
import { useToast } from '@/lib/toast';
import { fetchProducts } from '@/lib/data';
import type { Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Loader';
import { formatPrice } from '@/lib/utils';

export function WishlistPage() {
  const { ids, toggle } = useWishlist();
  const { addItem } = useCart();
  const { show } = useToast();
  const { navigate } = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const all = await fetchProducts({ limit: 100 });
        setProducts(all.filter(p => ids.includes(p.id)));
      } catch (e) {
        console.error('Wishlist load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [ids]);

  if (!loading && products.length === 0) {
    return (
      <div className="container-page py-16 pb-20 md:pb-16">
        <EmptyState
          icon={<Heart size={48} />}
          title="Your wishlist is empty"
          description="Save the pieces you love and come back to them anytime."
          action={<Link to="/shop" className="btn btn-primary">Discover Products <ArrowRight size={16} /></Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 pb-20 md:pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-medium text-ink-900">My Wishlist</h1>
          <p className="text-sm text-ink-500 mt-1">{products.length} saved item{products.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
