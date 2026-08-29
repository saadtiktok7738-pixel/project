import { Heart, ShoppingCart, Eye, Check } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/types';
import { Link } from '@/lib/router';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useToast } from '@/lib/toast';
import { Rating } from './ui/Rating';
import { Badge } from './ui/Badge';
import { formatPrice, discountPercent, cn } from '@/lib/utils';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const { show } = useToast();
  const [added, setAdded] = useState(false);

  const inWishlist = has(product.id);
  const discount = discountPercent(Number(product.price), product.original_price ? Number(product.original_price) : null);
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product, 1);
    setAdded(true);
    show(`${product.name} added to cart`);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
    show(inWishlist ? 'Removed from wishlist' : 'Added to wishlist', 'info');
  };

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div
        className="relative overflow-hidden rounded-xl bg-cream-100"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Image */}
        <div className="aspect-square overflow-hidden">
          <img
            src={product.primary_image}
            alt={product.name}
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition-all duration-700 ease-smooth',
              'group-hover:scale-105',
              outOfStock && 'opacity-60'
            )}
          />
          {/* Secondary image on hover */}
          {product.secondary_image && (
            <img
              src={product.secondary_image}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount && <Badge variant="sale">-{discount}%</Badge>}
          {product.is_new && <Badge variant="new">New</Badge>}
          {product.is_bestseller && <Badge variant="bestseller">Bestseller</Badge>}
          {outOfStock && <Badge variant="error">Sold Out</Badge>}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
            'bg-cream-50/90 backdrop-blur-sm hover:bg-cream-50 shadow-soft',
            inWishlist ? 'text-clay-600' : 'text-ink-600 hover:text-clay-600'
          )}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={17} className={inWishlist ? 'fill-clay-600' : ''} />
        </button>

        {/* Hover action bar */}
        <div className="absolute bottom-0 left-0 right-0 flex translate-y-full transition-transform duration-300 ease-smooth group-hover:translate-y-0">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
              added ? 'bg-sage-600 text-cream-50' : 'bg-ink-900 text-cream-50 hover:bg-ink-800',
              outOfStock && 'cursor-not-allowed opacity-50'
            )}
          >
            {added ? <><Check size={16} /> Added</> : <><ShoppingCart size={16} /> Add to Cart</>}
          </button>
          <div className="flex items-center justify-center bg-ink-800 px-4 text-cream-50">
            <Eye size={16} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        {product.category && (
          <p className="text-2xs uppercase tracking-wider text-ink-400">{product.category.name}</p>
        )}
        <h3 className="text-sm font-medium leading-snug text-ink-800 group-hover:text-clay-600 transition-colors line-clamp-2">
          {product.name}
        </h3>
        <Rating value={product.rating} count={product.review_count} size="xs" />
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-sm font-semibold text-ink-900">{formatPrice(Number(product.price))}</span>
          {product.original_price && Number(product.original_price) > Number(product.price) && (
            <span className="text-xs text-ink-400 line-through">{formatPrice(Number(product.original_price))}</span>
          )}
        </div>
        {lowStock && <p className="text-2xs font-medium text-clay-600">Only {product.stock} left</p>}
      </div>
    </Link>
  );
}
