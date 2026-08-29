import { useState } from 'react';
import { Link, useRouter } from '@/lib/router';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { ArrowRight, ArrowLeft, ShieldCheck, Truck, Check, Lock } from 'lucide-react';
import { createOrder } from '@/lib/data';
import { fetchCouponByCode } from '@/lib/data';
import { formatPrice, generateOrderNumber, cn } from '@/lib/utils';
import type { Order } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShoppingBag } from 'lucide-react';

export function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { show } = useToast();

  const [form, setForm] = useState({
    full_name: '', phone: '', email: user?.email ?? '',
    address: '', city: '', postal_code: '', country: 'United States',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const shipping = subtotal >= 75 ? 0 : 12;
  const total = subtotal - discount + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const coupon = await fetchCouponByCode(couponCode);
      if (!coupon) { show('Invalid coupon code', 'error'); return; }
      if (subtotal < Number(coupon.min_subtotal)) { show(`Minimum ${formatPrice(Number(coupon.min_subtotal))} required`, 'error'); return; }
      const d = coupon.discount_type === 'percentage'
        ? (subtotal * Number(coupon.discount_value)) / 100
        : Math.min(Number(coupon.discount_value), subtotal);
      setDiscount(d);
      setCouponApplied(true);
      show(`Coupon ${coupon.code} applied!`);
    } catch {
      show('Failed to apply coupon', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      show('Please sign in to complete your order', 'error');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const orderNumber = generateOrderNumber();
      const order = await createOrder({
        order_number: orderNumber,
        profile_id: user.id,
        status: 'pending',
        subtotal,
        discount,
        shipping,
        total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'unpaid' : 'paid',
        coupon_code: couponApplied ? couponCode.toUpperCase() : null,
        shipping_name: form.full_name,
        shipping_phone: form.phone,
        shipping_email: form.email,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_postal: form.postal_code,
        shipping_country: form.country,
        notes: form.notes || null,
      }, items.map(i => ({
        product_id: i.product_id,
        name: i.name,
        image_url: i.image_url,
        price: i.price,
        quantity: i.quantity,
      })));
      setPlacedOrder(order);
      clear();
      show('Order placed successfully!');
    } catch (e) {
      show(e instanceof Error ? e.message : 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="container-page py-16 pb-20 md:pb-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-sage-100 text-sage-600 mb-6 animate-scale-in">
            <Check size={32} />
          </div>
          <h1 className="font-display text-3xl font-medium text-ink-900">Order confirmed!</h1>
          <p className="text-sm text-ink-500 mt-2">Thank you for your purchase. A confirmation has been sent to your email.</p>
          <div className="mt-6 rounded-xl border border-cream-200 bg-white p-6 text-left">
            <div className="flex justify-between mb-4">
              <span className="text-sm text-ink-500">Order number</span>
              <span className="text-sm font-semibold text-ink-900">{placedOrder.order_number}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-sm text-ink-500">Total</span>
              <span className="text-sm font-semibold text-ink-900">{formatPrice(Number(placedOrder.total))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-ink-500">Payment</span>
              <span className="text-sm font-semibold text-ink-900">{placedOrder.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center mt-8">
            <Link to="/account" className="btn btn-primary">View Orders <ArrowRight size={16} /></Link>
            <Link to="/shop" className="btn btn-outline">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-16 pb-20 md:pb-16">
        <EmptyState
          icon={<ShoppingBag size={48} />}
          title="Your cart is empty"
          description="Add some products before checking out."
          action={<Link to="/shop" className="btn btn-primary">Start Shopping</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 pb-20 md:pb-12">
      <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-6">
        <ArrowLeft size={16} /> Back to cart
      </Link>

      <h1 className="font-display text-3xl lg:text-4xl font-medium text-ink-900 mb-8">Checkout</h1>

      {!user && (
        <div className="rounded-lg bg-gold-100/60 border border-gold-200 px-4 py-3 mb-6 text-sm text-gold-700">
          You'll need to <Link to="/login" className="font-semibold underline">sign in</Link> to complete your order.
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <section className="rounded-xl border border-cream-200 bg-white p-6">
            <h2 className="font-display text-lg font-medium text-ink-900 mb-4">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="input" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="+1 555 0000" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="jane@email.com" />
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className="rounded-xl border border-cream-200 bg-white p-6">
            <h2 className="font-display text-lg font-medium text-ink-900 mb-4">Shipping Address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Street Address *</label>
                <input required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input" placeholder="123 Maker's Lane" />
              </div>
              <div>
                <label className="label">City *</label>
                <input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input" placeholder="Brooklyn" />
              </div>
              <div>
                <label className="label">Postal Code</label>
                <input value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} className="input" placeholder="11201" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Country</label>
                <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="input">
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>Germany</option>
                  <option>France</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Order Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input resize-none" placeholder="Delivery instructions, gift messages, etc." />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-cream-200 bg-white p-6">
            <h2 className="font-display text-lg font-medium text-ink-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className={cn('flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors', paymentMethod === 'cod' ? 'border-clay-400 bg-clay-50' : 'border-cream-300 hover:border-ink-300')}>
                <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="text-clay-600 focus:ring-clay-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-800">Cash on Delivery</p>
                  <p className="text-xs text-ink-500">Pay when your order arrives</p>
                </div>
                <Truck size={20} className="text-ink-400" />
              </label>
              <label className={cn('flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors', paymentMethod === 'online' ? 'border-clay-400 bg-clay-50' : 'border-cream-300 hover:border-ink-300')}>
                <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="text-clay-600 focus:ring-clay-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-800">Online Payment</p>
                  <p className="text-xs text-ink-500">Credit card, PayPal, Apple Pay</p>
                </div>
                <Lock size={20} className="text-ink-400" />
              </label>
              {paymentMethod === 'online' && (
                <div className="rounded-lg bg-cream-100 p-4 text-xs text-ink-500">
                  Online payment integration is ready to connect. This is a placeholder for the payment processor.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-xl border border-cream-200 bg-white p-5 space-y-4">
            <h2 className="font-display text-lg font-medium text-ink-900">Your Order</h2>

            {/* Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.product_id} className="flex gap-3">
                  <div className="relative shrink-0">
                    <img src={item.image_url} alt={item.name} className="h-14 w-14 rounded-lg object-cover bg-cream-100" />
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-800 px-1 text-2xs font-bold text-cream-50">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink-800 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-ink-500">{formatPrice(item.price)} each</p>
                  </div>
                  <span className="text-sm font-medium text-ink-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            {!couponApplied && (
              <div className="flex gap-2">
                <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Coupon code" className="input input-sm" />
                <button type="button" onClick={handleApplyCoupon} className="btn btn-outline btn-sm">Apply</button>
              </div>
            )}

            <div className="space-y-2 text-sm border-t border-cream-200 pt-4">
              <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-sage-600"><span>Discount</span><span>-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between text-ink-600"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
            </div>
            <div className="flex justify-between items-center border-t border-cream-200 pt-4">
              <span className="font-display text-lg text-ink-900">Total</span>
              <span className="font-display text-2xl font-semibold text-ink-900">{formatPrice(total)}</span>
            </div>

            <button type="submit" disabled={submitting || !user} className="btn btn-primary w-full disabled:opacity-50">
              {submitting ? 'Placing order...' : <>Place Order <ArrowRight size={16} /></>}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-ink-400">
              <ShieldCheck size={14} className="text-sage-600" /> Secure checkout
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
