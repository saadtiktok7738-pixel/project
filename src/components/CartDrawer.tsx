import { X, ShoppingCart, Trash2, ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { Link, useRouter } from '@/lib/router';
import { formatPrice } from '@/lib/utils';
import { QuantitySelector } from './ui/QuantitySelector';

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, count } = useCart();
  const { navigate } = useRouter();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={closeCart} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-cream-50 shadow-elevated flex flex-col animate-slide-in-right" style={{ animationDuration: '0.3s' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-ink-700" />
            <h2 className="font-display text-lg font-medium text-ink-900">Your Cart</h2>
            <span className="text-sm text-ink-400">({count})</span>
          </div>
          <button onClick={closeCart} className="p-2 text-ink-500 hover:text-ink-900 hover:bg-cream-100 rounded-lg transition-colors" aria-label="Close cart">
            <X size={22} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-ink-300 mb-4">
              <ShoppingCart size={28} />
            </div>
            <h3 className="font-display text-lg text-ink-800">Your cart is empty</h3>
            <p className="mt-2 text-sm text-ink-500">Discover handcrafted pieces made to last.</p>
            <button onClick={() => { closeCart(); navigate('/shop'); }} className="btn btn-primary mt-6">
              Start Shopping <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.map(item => (
                <div key={item.product_id} className="flex gap-3">
                  <Link to={`/product/${item.slug}`} onClick={closeCart} className="shrink-0">
                    <img src={item.image_url} alt={item.name} className="h-20 w-20 rounded-lg object-cover bg-cream-100" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.slug}`} onClick={closeCart} className="text-sm font-medium text-ink-800 hover:text-clay-600 transition-colors line-clamp-1">
                      {item.name}
                    </Link>
                    <p className="text-xs text-ink-500 mt-0.5">{formatPrice(item.price)} each</p>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantitySelector
                        value={item.quantity}
                        onChange={v => updateQuantity(item.product_id, v)}
                        max={item.stock}
                        size="sm"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-ink-900">{formatPrice(item.price * item.quantity)}</span>
                        <button onClick={() => removeItem(item.product_id)} className="text-ink-400 hover:text-error-500 transition-colors" aria-label="Remove item">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-cream-200 p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center gap-1 text-ink-500">
                  <ShieldCheck size={16} className="text-sage-600" />
                  <span className="text-2xs">Secure checkout</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-ink-500">
                  <Truck size={16} className="text-sage-600" />
                  <span className="text-2xs">Free over $75</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-ink-500">
                  <RotateCcw size={16} className="text-sage-600" />
                  <span className="text-2xs">30-day returns</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-600">Subtotal</span>
                <span className="font-display text-xl font-semibold text-ink-900">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-ink-400">Shipping and taxes calculated at checkout.</p>
              <button onClick={handleCheckout} className="btn btn-primary w-full">
                Proceed to Checkout <ArrowRight size={16} />
              </button>
              <button onClick={closeCart} className="btn btn-ghost w-full text-ink-600">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
