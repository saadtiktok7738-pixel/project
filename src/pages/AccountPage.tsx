import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { Package, MapPin, Heart, Settings, LogOut, Plus, Trash2, ArrowRight, Check, User } from 'lucide-react';
import type { Order, Address } from '@/types';
import { fetchUserOrders, fetchAddresses, addAddress, deleteAddress, updateProfile, fetchOrderById } from '@/lib/data';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { PageLoader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

type Tab = 'orders' | 'addresses' | 'profile' | 'wishlist';

export function AccountPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const { show } = useToast();
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [addrForm, setAddrForm] = useState({ full_name: '', phone: '', line1: '', line2: '', city: '', postal_code: '', country: 'United States' });
  const [profileForm, setProfileForm] = useState({ full_name: profile?.full_name ?? '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    (async () => {
      setLoading(true);
      try {
        const [ords, addrs] = await Promise.all([
          fetchUserOrders(user.id),
          fetchAddresses(user.id),
        ]);
        setOrders(ords);
        setAddresses(addrs);
      } catch (e) { console.error('Account load error:', e); }
      finally { setLoading(false); }
    })();
  }, [user, navigate]);

  useEffect(() => { setProfileForm({ full_name: profile?.full_name ?? '' }); }, [profile]);

  if (!user) return null;
  if (loading) return <PageLoader label="Loading your account..." />;

  const handleSignOut = async () => {
    await signOut();
    show('Signed out successfully', 'info');
    navigate('/');
  };

  const handleAddAddress = async () => {
    if (!user) return;
    try {
      const newAddr = await addAddress({ ...addrForm, profile_id: user.id, is_default: addresses.length === 0 });
      setAddresses(prev => [...prev, newAddr]);
      setAddrModalOpen(false);
      setAddrForm({ full_name: '', phone: '', line1: '', line2: '', city: '', postal_code: '', country: 'United States' });
      show('Address saved');
    } catch (e) {
      show(e instanceof Error ? e.message : 'Failed to save address', 'error');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      show('Address removed', 'info');
    } catch (e) {
      show(e instanceof Error ? e.message : 'Failed to remove address', 'error');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user.id, profileForm);
      await refreshProfile();
      show('Profile updated');
    } catch (e) {
      show(e instanceof Error ? e.message : 'Failed to update profile', 'error');
    }
  };

  const viewOrder = async (orderId: string) => {
    try {
      const order = await fetchOrderById(orderId);
      if (order) { setSelectedOrder(order); setOrderModalOpen(true); }
    } catch (e) { show('Failed to load order details', 'error'); }
  };

  const tabs: { key: Tab; label: string; icon: typeof Package; count?: number }[] = [
    { key: 'orders', label: 'Orders', icon: Package, count: orders.length },
    { key: 'addresses', label: 'Addresses', icon: MapPin, count: addresses.length },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
    { key: 'profile', label: 'Profile', icon: Settings },
  ];

  return (
    <div className="container-page py-8 pb-20 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-clay-100 text-clay-700 font-display text-xl font-medium">
            {(profile?.full_name ?? user.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium text-ink-900">{profile?.full_name ?? 'Account'}</h1>
            <p className="text-sm text-ink-500">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === 'admin' && (
            <Link to="/admin" className="btn btn-outline btn-sm">Admin Dashboard</Link>
          )}
          <button onClick={handleSignOut} className="btn btn-ghost btn-sm text-error-500 hover:bg-error-500/10">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <aside>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                  tab === t.key ? 'bg-ink-900 text-cream-50' : 'text-ink-600 hover:bg-cream-100'
                )}
              >
                <t.icon size={17} />
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={cn('ml-auto rounded-full px-2 py-0.5 text-2xs', tab === t.key ? 'bg-cream-50/20' : 'bg-cream-200')}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {tab === 'orders' && (
            <div>
              <h2 className="font-display text-xl font-medium text-ink-900 mb-4">Order History</h2>
              {orders.length === 0 ? (
                <EmptyState
                  icon={<Package size={40} />}
                  title="No orders yet"
                  description="When you place your first order, it will appear here."
                  action={<Link to="/shop" className="btn btn-primary">Start Shopping</Link>}
                />
              ) : (
                <div className="space-y-3">
                  {orders.map(o => (
                    <button
                      key={o.id}
                      onClick={() => viewOrder(o.id)}
                      className="w-full text-left rounded-xl border border-cream-200 bg-white p-5 hover:border-ink-300 hover:shadow-soft transition-all"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{o.order_number}</p>
                          <p className="text-xs text-ink-500 mt-0.5">{formatDate(o.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={o.status === 'delivered' ? 'success' : o.status === 'shipped' ? 'new' : o.status === 'cancelled' ? 'error' : 'neutral'}>
                            {o.status}
                          </Badge>
                          <span className="text-sm font-semibold text-ink-900">{formatPrice(Number(o.total))}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-medium text-ink-900">Saved Addresses</h2>
                <button onClick={() => setAddrModalOpen(true)} className="btn btn-outline btn-sm">
                  <Plus size={15} /> Add Address
                </button>
              </div>
              {addresses.length === 0 ? (
                <EmptyState
                  icon={<MapPin size={40} />}
                  title="No saved addresses"
                  description="Add an address for faster checkout."
                  action={<button onClick={() => setAddrModalOpen(true)} className="btn btn-primary">Add Address</button>}
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {addresses.map(a => (
                    <div key={a.id} className="rounded-xl border border-cream-200 bg-white p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink-800">{a.full_name}</span>
                          {a.is_default && <Badge variant="gold">Default</Badge>}
                        </div>
                        <button onClick={() => handleDeleteAddress(a.id)} className="text-ink-400 hover:text-error-500 transition-colors" aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="mt-3 text-sm text-ink-600 space-y-0.5">
                        <p>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                        <p>{a.city}, {a.postal_code}</p>
                        <p>{a.country}</p>
                        {a.phone && <p className="text-ink-400">{a.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'wishlist' && (
            <div>
              <h2 className="font-display text-xl font-medium text-ink-900 mb-4">My Wishlist</h2>
              <EmptyState
                icon={<Heart size={40} />}
                title="Manage your wishlist"
                description="View and manage your saved items on the dedicated wishlist page."
                action={<Link to="/wishlist" className="btn btn-primary">Go to Wishlist <ArrowRight size={16} /></Link>}
              />
            </div>
          )}

          {tab === 'profile' && (
            <div>
              <h2 className="font-display text-xl font-medium text-ink-900 mb-4">Profile Settings</h2>
              <div className="rounded-xl border border-cream-200 bg-white p-6 max-w-md space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input value={user.email} disabled className="input opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="label">Role</label>
                  <div className="flex items-center gap-2">
                    <Badge variant={profile?.role === 'admin' ? 'gold' : 'neutral'}>
                      {profile?.role === 'admin' ? 'Administrator' : 'Customer'}
                    </Badge>
                  </div>
                </div>
                <button onClick={handleSaveProfile} className="btn btn-primary">
                  <Check size={16} /> Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address Modal */}
      <Modal open={addrModalOpen} onClose={() => setAddrModalOpen(false)} title="Add Address">
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input value={addrForm.full_name} onChange={e => setAddrForm(f => ({ ...f, full_name: e.target.value }))} className="input" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Phone</label><input value={addrForm.phone} onChange={e => setAddrForm(f => ({ ...f, phone: e.target.value }))} className="input" /></div>
            <div><label className="label">Postal Code</label><input value={addrForm.postal_code} onChange={e => setAddrForm(f => ({ ...f, postal_code: e.target.value }))} className="input" /></div>
          </div>
          <div><label className="label">Street Address</label><input value={addrForm.line1} onChange={e => setAddrForm(f => ({ ...f, line1: e.target.value }))} className="input" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">City</label><input value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} className="input" /></div>
            <div><label className="label">Country</label><select value={addrForm.country} onChange={e => setAddrForm(f => ({ ...f, country: e.target.value }))} className="input"><option>United States</option><option>United Kingdom</option><option>Canada</option><option>Australia</option></select></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAddrModalOpen(false)} className="btn btn-ghost">Cancel</button>
            <button onClick={handleAddAddress} className="btn btn-primary">Save Address</button>
          </div>
        </div>
      </Modal>

      {/* Order Detail Modal */}
      <Modal open={orderModalOpen} onClose={() => setOrderModalOpen(false)} title={`Order ${selectedOrder?.order_number ?? ''}`} size="lg">
        {selectedOrder && (
          <div className="p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-ink-400 text-xs uppercase tracking-wider mb-1">Order Date</p>
                <p className="text-ink-800">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <p className="text-ink-400 text-xs uppercase tracking-wider mb-1">Status</p>
                <Badge variant={selectedOrder.status === 'delivered' ? 'success' : selectedOrder.status === 'shipped' ? 'new' : 'neutral'}>{selectedOrder.status}</Badge>
              </div>
              <div className="sm:col-span-2">
                <p className="text-ink-400 text-xs uppercase tracking-wider mb-1">Shipping Address</p>
                <p className="text-ink-800">{selectedOrder.shipping_name}, {selectedOrder.shipping_address}, {selectedOrder.shipping_city} {selectedOrder.shipping_postal}</p>
              </div>
            </div>

            <div className="border-t border-cream-200 pt-4">
              <p className="text-sm font-semibold text-ink-800 mb-3">Items</p>
              <div className="space-y-3">
                {selectedOrder.items?.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="h-14 w-14 rounded-lg object-cover bg-cream-100" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-800">{item.name}</p>
                      <p className="text-xs text-ink-500">Qty: {item.quantity} × {formatPrice(Number(item.price))}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink-900">{formatPrice(Number(item.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-cream-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatPrice(Number(selectedOrder.subtotal))}</span></div>
              {Number(selectedOrder.discount) > 0 && <div className="flex justify-between text-sage-600"><span>Discount</span><span>-{formatPrice(Number(selectedOrder.discount))}</span></div>}
              <div className="flex justify-between text-ink-600"><span>Shipping</span><span>{Number(selectedOrder.shipping) === 0 ? 'Free' : formatPrice(Number(selectedOrder.shipping))}</span></div>
              <div className="flex justify-between font-display text-lg font-semibold text-ink-900 pt-2 border-t border-cream-200"><span>Total</span><span>{formatPrice(Number(selectedOrder.total))}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
