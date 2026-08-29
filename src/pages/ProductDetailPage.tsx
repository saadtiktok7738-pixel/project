import { useEffect, useState } from 'react';
import { Heart, ShoppingCart, Minus, Plus, Check, Truck, RotateCcw, ShieldCheck, ChevronRight, Star } from 'lucide-react';
import { useRouter, Link } from '@/lib/router';
import type { Product, Review, Product as ProductType } from '@/types';
import { fetchProductBySlug, fetchProductImages, fetchRelatedProducts, fetchReviews, addReview } from '@/lib/data';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { ProductCard } from '@/components/ProductCard';
import { PageLoader } from '@/components/ui/Loader';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { formatPrice, discountPercent, formatDate, cn } from '@/lib/utils';

export function ProductDetailPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { addItem, openCart } = useCart();
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const { show } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [related, setRelated] = useState<ProductType[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await fetchProductBySlug(slug);
        if (!p) {
          setError('Product not found');
          return;
        }
        setProduct(p);
        const [imgs, rel, revs] = await Promise.all([
          fetchProductImages(p.id),
          fetchRelatedProducts(p.id, p.category_id, 4),
          fetchReviews(p.id),
        ]);
        const allImages = [p.primary_image, ...(p.secondary_image ? [p.secondary_image] : []), ...imgs.map(i => i.url)];
        setImages(Array.from(new Set(allImages)));
        setRelated(rel);
        setReviews(revs);
        setActiveImage(0);
        setQuantity(1);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <PageLoader label="Loading product..." />;
  if (error) return <ErrorState message={error} onRetry={() => navigate('/shop')} />;
  if (!product) return <ErrorState message="Product not found" onRetry={() => navigate('/shop')} />;

  const inWishlist = has(product.id);
  const discount = discountPercent(Number(product.price), product.original_price ? Number(product.original_price) : null);
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addItem(product, quantity);
    show(`${quantity} × ${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    addItem(product, quantity);
    navigate('/checkout');
  };

  const handleWishlist = () => {
    toggle(product);
    show(inWishlist ? 'Removed from wishlist' : 'Added to wishlist', 'info');
  };

  const handleSubmitReview = async () => {
    if (!user) {
      show('Please sign in to leave a review', 'error');
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      await addReview(product.id, user.id, reviewForm.rating, reviewForm.title, reviewForm.body);
      show('Review submitted successfully');
      setReviewModalOpen(false);
      setReviewForm({ rating: 5, title: '', body: '' });
      const revs = await fetchReviews(product.id);
      setReviews(revs);
    } catch (e) {
      show(e instanceof Error ? e.message : 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="pb-20 md:pb-12">
      {/* Breadcrumbs */}
      <nav className="container-page flex items-center gap-1.5 text-xs text-ink-500 py-4">
        <Link to="/" className="hover:text-ink-800">Home</Link>
        <ChevronRight size={12} />
        <Link to="/shop" className="hover:text-ink-800">Shop</Link>
        {product.category && (
          <>
            <ChevronRight size={12} />
            <Link to={`/category/${product.category.slug}`} className="hover:text-ink-800">{product.category.name}</Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-ink-800 truncate">{product.name}</span>
      </nav>

      {/* Product section */}
      <div className="container-page grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-xl bg-cream-100">
            <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                    activeImage === i ? 'border-ink-800' : 'border-cream-300 hover:border-ink-300'
                  )}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.is_bestseller && <Badge variant="bestseller">Bestseller</Badge>}
              {product.is_new && <Badge variant="new">New Arrival</Badge>}
              {discount && <Badge variant="sale">-{discount}% Off</Badge>}
              {product.origin && <Badge variant="neutral">Made in {product.origin}</Badge>}
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-medium text-ink-900 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-3">
              <Rating value={product.rating} count={product.review_count} size="md" />
              <button onClick={() => setActiveTab('reviews')} className="text-sm text-clay-600 hover:underline">
                Read reviews
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-ink-900">{formatPrice(Number(product.price))}</span>
            {product.original_price && Number(product.original_price) > Number(product.price) && (
              <>
                <span className="text-lg text-ink-400 line-through">{formatPrice(Number(product.original_price))}</span>
                <span className="text-sm font-medium text-clay-600">
                  Save {formatPrice(Number(product.original_price) - Number(product.price))}
                </span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            {outOfStock ? (
              <span className="flex items-center gap-1.5 text-sm text-error-500"><span className="h-2 w-2 rounded-full bg-error-500" /> Out of stock</span>
            ) : lowStock ? (
              <span className="flex items-center gap-1.5 text-sm text-warning-600"><span className="h-2 w-2 rounded-full bg-warning-500" /> Only {product.stock} left in stock</span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-sage-600"><Check size={15} /> In stock — ready to ship</span>
            )}
          </div>

          {/* Description preview */}
          <p className="text-sm text-ink-600 leading-relaxed line-clamp-3">
            {product.description}
          </p>

          {/* Quantity + Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <QuantitySelector value={quantity} onChange={setQuantity} max={Math.max(1, product.stock)} />
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="btn btn-primary flex-1 min-w-[180px] disabled:opacity-50"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button
              onClick={handleWishlist}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg border transition-all',
                inWishlist ? 'border-clay-300 bg-clay-50 text-clay-600' : 'border-cream-400 text-ink-600 hover:border-ink-300'
              )}
              aria-label="Toggle wishlist"
            >
              <Heart size={20} className={inWishlist ? 'fill-clay-600' : ''} />
            </button>
          </div>
          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="btn btn-accent w-full disabled:opacity-50"
          >
            Buy Now
          </button>

          {/* Quick facts */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-cream-200">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over $75' },
              { icon: RotateCcw, title: '30-Day Returns', desc: 'No questions asked' },
              { icon: ShieldCheck, title: 'Lifetime Guarantee', desc: 'On craftsmanship' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <item.icon size={20} className="mx-auto text-ink-500" />
                <p className="text-xs font-medium text-ink-800 mt-1.5">{item.title}</p>
                <p className="text-2xs text-ink-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container-page mt-16">
        <div className="border-b border-cream-200 flex gap-1">
          {[
            { key: 'description', label: 'Description' },
            { key: 'specifications', label: 'Specifications' },
            { key: 'reviews', label: `Reviews (${reviews.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.key ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose prose-sm max-w-3xl">
              <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              {product.care_instructions && (
                <div className="mt-6 rounded-lg bg-cream-100 p-5">
                  <h4 className="text-sm font-semibold text-ink-800 mb-2">Care Instructions</h4>
                  <p className="text-sm text-ink-600">{product.care_instructions}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="max-w-2xl">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { label: 'Material', value: product.material },
                  { label: 'Dimensions', value: product.dimensions },
                  { label: 'Weight', value: product.weight },
                  { label: 'Origin', value: product.origin },
                  { label: 'SKU', value: product.sku },
                  { label: 'Category', value: product.category?.name },
                ].filter(s => s.value).map(s => (
                  <div key={s.label} className="flex justify-between border-b border-cream-200 pb-3">
                    <dt className="text-sm text-ink-500">{s.label}</dt>
                    <dd className="text-sm font-medium text-ink-800">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-display text-4xl font-semibold text-ink-900">{product.rating}</p>
                    <Rating value={product.rating} showCount={false} size="sm" />
                    <p className="text-xs text-ink-500 mt-1">{product.review_count} reviews</p>
                  </div>
                </div>
                <button onClick={() => setReviewModalOpen(true)} className="btn btn-outline">
                  Write a Review
                </button>
              </div>

              {reviews.length === 0 ? (
                <EmptyState
                  icon={<Star size={36} />}
                  title="No reviews yet"
                  description="Be the first to share your experience with this product."
                />
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="card p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-100 text-clay-700 font-medium text-sm">
                            {(r.profile?.full_name ?? 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink-800">{r.profile?.full_name ?? 'Anonymous'}</p>
                            <p className="text-xs text-ink-400">{formatDate(r.created_at)}</p>
                          </div>
                        </div>
                        <Rating value={r.rating} showCount={false} size="sm" />
                      </div>
                      {r.title && <h4 className="text-sm font-semibold text-ink-800 mt-3">{r.title}</h4>}
                      {r.body && <p className="text-sm text-ink-600 mt-1 leading-relaxed">{r.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="container-page mt-12">
          <h2 className="font-display text-2xl lg:text-3xl font-medium text-ink-900 mb-8">You might also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Write a Review">
        <div className="p-6 space-y-5">
          <h3 className="font-display text-xl font-medium text-ink-900">Share your experience</h3>
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                  className="p-1"
                  aria-label={`${n} stars`}
                >
                  <Star
                    size={28}
                    className={n <= reviewForm.rating ? 'fill-gold-400 text-gold-400' : 'fill-cream-300 text-cream-300'}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              value={reviewForm.title}
              onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Sum up your experience"
              className="input"
            />
          </div>
          <div>
            <label className="label">Review</label>
            <textarea
              value={reviewForm.body}
              onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
              placeholder="What did you like? What could be better?"
              rows={4}
              className="input resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setReviewModalOpen(false)} className="btn btn-ghost">Cancel</button>
            <button onClick={handleSubmitReview} disabled={submittingReview} className="btn btn-primary">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
