import { Link, useRouter } from '@/lib/router';
import { useCart } from '@/lib/cart';
import { useToast } from '@/lib/toast';
import { Heart, Trash2, ArrowRight, ShieldCheck, Truck, RotateCcw, ShoppingBag, Tag } from 'lucide-react';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { useState } from 'react';
import { fetchCouponByCode } from '@/lib/data';
import type { Coupon } from '@/types';
import { formatPrice } from '@/lib/utils';

export function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, clear } = useCart();
  const { navigate } = useRouter();
  const { show } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const discount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? (subtotal * Number(appliedCoupon.discount_value)) / 100
      : Math.min(Number(appliedCoupon.discount_value), subtotal)
    : 0;
  const shipping = subtotal >= 75 ? 0 : (subtotal > 0 ? 12 : 0);
  const total = subtotal - discount + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const coupon = await fetchCouponByCode(couponCode);
      if (!coupon) {
        show('Invalid coupon code', 'error');
        return;
      }
      if (subtotal < Number(coupon.min_subtotal)) {
        show(`Minimum order of ${formatPrice(Number(coupon.min_subtotal))} required`, 'error');
        return;
      }
      setAppliedCoupon(coupon);
      show(`Coupon ${coupon.code} applied!`);
    } catch {
      show('Failed to apply coupon', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-page py-16 pb-20 md:pb-16">
        <EmptyState
          icon={<ShoppingBag size={48} />}
          title="Your cart is empty"
          description="Discover handcrafted pieces made to last a lifetime — not a season."
          action={<Link to="/shop" className="btn btn-primary">Start Shopping <ArrowRight size={16} /></Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 pb-20 md:pb-12">
      <h1 className="font-display text-3xl lg:text-4xl font-medium text-ink-900 mb-2">Shopping Cart</h1>
      <p className="text-sm text-ink-500 mb-8">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.product_id} className="flex gap-4 rounded-xl border border-cream-200 bg-white p-4">
              <Link to={`/product/${item.slug}`} className="shrink-0">
                <img src={item.image_url} alt={item.name} className="h-24 w-24 rounded-lg object-cover bg-cream-100" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.slug}`} className="text-sm font-medium text-ink-800 hover:text-clay-600 transition-colors">
                  {item.name}
                </Link>
                <p className="text-xs text-ink-500 mt-1">{formatPrice(item.price)} each</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <QuantitySelector
                    value={item.quantity}
                    onChange={v => updateQuantity(item.product_id, v)}
                    max={item.stock}
                    size="sm"
                  />
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-ink-900">{formatPrice(item.price * item.quantity)}</span>
                    <button onClick={() => { removeItem(item.product_id); show('Item removed', 'info'); }} className="text-ink-400 hover:text-error-500 transition-colors" aria-label="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <button onClick={() => { clear(); setAppliedCoupon(null); show('Cart cleared', 'info'); }} className="text-sm text-ink-500 hover:text-error-500 transition-colors">
              Clear cart
            </button>
            <Link to="/shop" className="text-sm font-medium text-clay-600 hover:text-clay-700 link-underline">Continue shopping</Link>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="rounded-xl border border-cream-200 bg-white p-5 space-y-4">
            <h2 className="font-display text-lg font-medium text-ink-900">Order Summary</h2>

            {/* Coupon */}
            <div>
              <label className="label">Discount Code</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="WELCOME10"
                    className="input input-sm pl-8"
                  />
                </div>
                <button onClick={handleApplyCoupon} disabled={couponLoading} className="btn btn-outline btn-sm">
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-xs text-sage-600 mt-1.5 flex items-center gap-1">
                  <ShieldCheck size={13} /> {appliedCoupon.code} applied — {appliedCoupon.description}
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm border-t border-cream-200 pt-4">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sage-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              {subtotal < 75 && subtotal > 0 && (
                <p className="text-xs text-ink-400">Add {formatPrice(75 - subtotal)} more for free shipping</p>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-cream-200 pt-4">
              <span className="font-display text-lg font-medium text-ink-900">Total</span>
              <span className="font-display text-2xl font-semibold text-ink-900">{formatPrice(total)}</span>
            </div>

            <button onClick={() => navigate('/checkout')} className="btn btn-primary w-full">
              Proceed to Checkout <ArrowRight size={16} />
            </button>
          </div>

          {/* Reassurance */}
          <div className="rounded-xl bg-cream-100 p-5 space-y-3">
            {[
              { icon: ShieldCheck, text: 'Secure SSL encrypted checkout' },
              { icon: Truck, text: 'Free shipping on orders over $75' },
              { icon: RotateCcw, text: '30-day hassle-free returns' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2.5 text-sm text-ink-600">
                <item.icon size={17} className="text-sage-600 shrink-0" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
