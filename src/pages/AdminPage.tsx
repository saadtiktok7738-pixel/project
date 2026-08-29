import { useEffect, useState, useCallback } from 'react';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Image as ImageIcon,
  TrendingUp, Plus, Pencil, Trash2, X, Check, ArrowLeft, ExternalLink,
} from 'lucide-react';
import type { Product, Category, Order, Profile, Banner, Coupon } from '@/types';
import {
  fetchAllProductsAdmin, createProduct, updateProduct, deleteProduct,
  fetchCategories, createCategory, updateCategory, deleteCategory,
  fetchAllOrders, updateOrderStatus, fetchOrderById,
  fetchAllProfiles, fetchAllBanners, createBanner, updateBanner, deleteBanner,
  fetchAllCoupons,
} from '@/lib/data';
import { formatPrice, formatDate, slugify, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';

type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'customers' | 'banners' | 'coupons';

export function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const { show } = useToast();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Modals
  const [productModal, setProductModal] = useState<{ open: boolean; edit: Product | null }>({ open: false, edit: null });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; edit: Category | null }>({ open: false, edit: null });
  const [bannerModal, setBannerModal] = useState<{ open: boolean; edit: Banner | null }>({ open: false, edit: null });
  const [orderModal, setOrderModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
  const [customerModal, setCustomerModal] = useState<{ open: boolean; customer: Profile | null }>({ open: false, customer: null });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats, ords, custs, banns, cpns] = await Promise.all([
        fetchAllProductsAdmin(),
        fetchCategories(),
        fetchAllOrders(),
        fetchAllProfiles(),
        fetchAllBanners(),
        fetchAllCoupons(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setOrders(ords);
      setCustomers(custs);
      setBanners(banns);
      setCoupons(cpns);
    } catch (e) {
      console.error('Admin load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== 'admin') {
        navigate('/login');
        return;
      }
      loadAll();
    }
  }, [authLoading, user, profile, navigate, loadAll]);

  if (authLoading || (!user || profile?.role !== 'admin')) return <PageLoader label="Loading admin..." />;
  if (loading) return <PageLoader label="Loading dashboard..." />;

  // Analytics calculations
  const revenue = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded').reduce((s, o) => s + Number(o.total), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const lowStockProducts = products.filter(p => p.stock <= 5);

  const tabs: { key: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'categories', label: 'Categories', icon: Package },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'banners', label: 'Banners', icon: ImageIcon },
    { key: 'coupons', label: 'Coupons', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="container-page py-8 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
              <Link to="/" className="hover:text-ink-800">Storefront</Link>
              <span>/</span>
              <span className="text-ink-800">Admin</span>
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-medium text-ink-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn btn-outline btn-sm"><ArrowLeft size={15} /> Back to Store</Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar */}
          <aside>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide bg-white rounded-xl p-2 border border-cream-200">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                    tab === t.key ? 'bg-ink-900 text-cream-50' : 'text-ink-600 hover:bg-cream-100'
                  )}
                >
                  <t.icon size={17} />
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="min-w-0">
            {tab === 'dashboard' && (
              <DashboardTab revenue={revenue} orderCount={orders.length} productCount={products.length} customerCount={customers.length} pendingOrders={pendingOrders} lowStockProducts={lowStockProducts} recentOrders={orders.slice(0, 5)} />
            )}

            {tab === 'products' && (
              <ProductsTab
                products={products}
                categories={categories}
                onAdd={() => setProductModal({ open: true, edit: null })}
                onEdit={p => setProductModal({ open: true, edit: p })}
                onDelete={async (id) => { try { await deleteProduct(id); await loadAll(); show('Product deleted', 'info'); } catch (e) { show('Failed to delete', 'error'); } }}
              />
            )}

            {tab === 'categories' && (
              <CategoriesTab
                categories={categories}
                productCount={products}
                onAdd={() => setCategoryModal({ open: true, edit: null })}
                onEdit={c => setCategoryModal({ open: true, edit: c })}
                onDelete={async (id) => { try { await deleteCategory(id); await loadAll(); show('Category deleted', 'info'); } catch (e) { show('Failed to delete', 'error'); } }}
              />
            )}

            {tab === 'orders' && (
              <OrdersTab
                orders={orders}
                onView={async (id) => { try { const o = await fetchOrderById(id); setOrderModal({ open: true, order: o }); } catch { show('Failed to load order', 'error'); } }}
                onUpdateStatus={async (id, status) => { try { await updateOrderStatus(id, status); await loadAll(); show('Order status updated'); } catch { show('Failed to update', 'error'); } }}
              />
            )}

            {tab === 'customers' && (
              <CustomersTab
                customers={customers}
                orders={orders}
                onView={(c) => setCustomerModal({ open: true, customer: c })}
              />
            )}

            {tab === 'banners' && (
              <BannersTab
                banners={banners}
                onAdd={() => setBannerModal({ open: true, edit: null })}
                onEdit={b => setBannerModal({ open: true, edit: b })}
                onDelete={async (id) => { try { await deleteBanner(id); await loadAll(); show('Banner deleted', 'info'); } catch { show('Failed to delete', 'error'); } }}
                onToggle={async (b) => { try { await updateBanner(b.id, { is_active: !b.is_active }); await loadAll(); } catch { show('Failed to update', 'error'); } }}
              />
            )}

            {tab === 'coupons' && (
              <CouponsTab coupons={coupons} />
            )}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {productModal.open && (
        <ProductFormModal
          edit={productModal.edit}
          categories={categories}
          onClose={() => setProductModal({ open: false, edit: null })}
          onSave={async (data) => {
            try {
              if (productModal.edit) {
                await updateProduct(productModal.edit.id, data);
                show('Product updated');
              } else {
                await createProduct(data);
                show('Product created');
              }
              await loadAll();
              setProductModal({ open: false, edit: null });
            } catch (e) {
              show(e instanceof Error ? e.message : 'Failed to save', 'error');
            }
          }}
        />
      )}

      {/* Category Modal */}
      {categoryModal.open && (
        <CategoryFormModal
          edit={categoryModal.edit}
          onClose={() => setCategoryModal({ open: false, edit: null })}
          onSave={async (data) => {
            try {
              if (categoryModal.edit) {
                await updateCategory(categoryModal.edit.id, data);
                show('Category updated');
              } else {
                await createCategory(data);
                show('Category created');
              }
              await loadAll();
              setCategoryModal({ open: false, edit: null });
            } catch (e) {
              show(e instanceof Error ? e.message : 'Failed to save', 'error');
            }
          }}
        />
      )}

      {/* Banner Modal */}
      {bannerModal.open && (
        <BannerFormModal
          edit={bannerModal.edit}
          onClose={() => setBannerModal({ open: false, edit: null })}
          onSave={async (data) => {
            try {
              if (bannerModal.edit) {
                await updateBanner(bannerModal.edit.id, data);
                show('Banner updated');
              } else {
                await createBanner(data);
                show('Banner created');
              }
              await loadAll();
              setBannerModal({ open: false, edit: null });
            } catch (e) {
              show(e instanceof Error ? e.message : 'Failed to save', 'error');
            }
          }}
        />
      )}

      {/* Order Detail Modal */}
      {orderModal.open && orderModal.order && (
        <Modal open={orderModal.open} onClose={() => setOrderModal({ open: false, order: null })} title={`Order ${orderModal.order.order_number}`} size="lg">
          <OrderDetailContent order={orderModal.order} onUpdateStatus={async (status) => {
            try { await updateOrderStatus(orderModal.order!.id, status); await loadAll(); setOrderModal({ open: false, order: null }); show('Status updated'); } catch { show('Failed', 'error'); }
          }} />
        </Modal>
      )}

      {/* Customer Detail Modal */}
      {customerModal.open && customerModal.customer && (
        <Modal open={customerModal.open} onClose={() => setCustomerModal({ open: false, customer: null })} title="Customer Details" size="md">
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-clay-100 text-clay-700 font-medium">
                {customerModal.customer.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="font-medium text-ink-900">{customerModal.customer.full_name ?? 'Unknown'}</p>
                <p className="text-sm text-ink-500">{customerModal.customer.email}</p>
              </div>
              {customerModal.customer.role === 'admin' && <Badge variant="gold">Admin</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-ink-400 text-xs uppercase tracking-wider">Joined</p><p className="text-ink-800">{formatDate(customerModal.customer.created_at)}</p></div>
              <div><p className="text-ink-400 text-xs uppercase tracking-wider">Total Orders</p><p className="text-ink-800">{orders.filter(o => o.profile_id === customerModal.customer!.id).length}</p></div>
            </div>
            <div className="border-t border-cream-200 pt-4">
              <p className="text-sm font-semibold text-ink-800 mb-3">Order History</p>
              {orders.filter(o => o.profile_id === customerModal.customer!.id).length === 0 ? (
                <p className="text-sm text-ink-400">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {orders.filter(o => o.profile_id === customerModal.customer!.id).map(o => (
                    <div key={o.id} className="flex justify-between items-center rounded-lg bg-cream-100 px-3 py-2 text-sm">
                      <span className="text-ink-700">{o.order_number}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{o.status}</Badge>
                        <span className="font-medium text-ink-900">{formatPrice(Number(o.total))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ Dashboard Tab ============
function DashboardTab({ revenue, orderCount, productCount, customerCount, pendingOrders, lowStockProducts, recentOrders }: {
  revenue: number; orderCount: number; productCount: number; customerCount: number; pendingOrders: number; lowStockProducts: Product[]; recentOrders: Order[];
}) {
  const stats = [
    { label: 'Total Revenue', value: formatPrice(revenue), change: '+12.5%', positive: true },
    { label: 'Orders', value: orderCount.toString(), change: `${pendingOrders} pending`, positive: true },
    { label: 'Products', value: productCount.toString(), change: `${lowStockProducts.length} low stock`, positive: lowStockProducts.length === 0 },
    { label: 'Customers', value: customerCount.toString(), change: '+3 this month', positive: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-cream-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-ink-400">{s.label}</p>
            <p className="font-display text-2xl lg:text-3xl font-semibold text-ink-900 mt-2">{s.value}</p>
            <p className={cn('text-xs mt-1', s.positive ? 'text-sage-600' : 'text-warning-600')}>{s.change}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart placeholder */}
      <div className="rounded-xl border border-cream-200 bg-white p-6">
        <h3 className="font-display text-lg font-medium text-ink-900 mb-4">Revenue Overview</h3>
        <div className="flex items-end gap-2 h-40">
          {[40, 55, 35, 70, 60, 85, 75, 90, 65, 80, 95, 100].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-clay-200 hover:bg-clay-400 transition-colors" style={{ height: `${h}%` }} title={`Month ${i + 1}`} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-2xs text-ink-400">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <span key={m}>{m}</span>)}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="rounded-xl border border-cream-200 bg-white p-6">
          <h3 className="font-display text-lg font-medium text-ink-900 mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? <p className="text-sm text-ink-400">No orders yet.</p> : (
            <div className="space-y-2">
              {recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between rounded-lg bg-cream-100 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink-800">{o.order_number}</p>
                    <p className="text-xs text-ink-500">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">{o.status}</Badge>
                    <span className="text-sm font-semibold text-ink-900">{formatPrice(Number(o.total))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="rounded-xl border border-cream-200 bg-white p-6">
          <h3 className="font-display text-lg font-medium text-ink-900 mb-4">Low Stock Alerts</h3>
          {lowStockProducts.length === 0 ? <p className="text-sm text-ink-400">All products well stocked.</p> : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-cream-100 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <img src={p.primary_image} alt={p.name} className="h-8 w-8 rounded object-cover" />
                    <p className="text-sm font-medium text-ink-800 line-clamp-1">{p.name}</p>
                  </div>
                  <Badge variant={p.stock === 0 ? 'error' : 'warning'}>{p.stock} left</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Products Tab ============
function ProductsTab({ products, categories, onAdd, onEdit, onDelete }: {
  products: Product[]; categories: Category[]; onAdd: () => void; onEdit: (p: Product) => void; onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-ink-900">Products ({products.length})</h2>
        <button onClick={onAdd} className="btn btn-primary btn-sm"><Plus size={15} /> Add Product</button>
      </div>
      {products.length === 0 ? (
        <EmptyState icon={<Package size={36} />} title="No products" action={<button onClick={onAdd} className="btn btn-primary">Add Product</button>} />
      ) : (
        <div className="rounded-xl border border-cream-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-200 text-left text-xs uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 hidden md:table-cell">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 hidden sm:table-cell">Stock</th>
                <th className="px-4 py-3 hidden lg:table-cell">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-cream-100 hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.primary_image} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-cream-100" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink-800 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-ink-400">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-ink-600">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{formatPrice(Number(p.price))}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant={p.stock === 0 ? 'error' : p.stock <= 5 ? 'warning' : 'success'}>{p.stock}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <Badge variant={p.status === 'active' ? 'success' : 'neutral'}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/product/${p.slug}`} className="p-1.5 text-ink-400 hover:text-ink-800" aria-label="View"><ExternalLink size={15} /></Link>
                      <button onClick={() => onEdit(p)} className="p-1.5 text-ink-400 hover:text-clay-600" aria-label="Edit"><Pencil size={15} /></button>
                      <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) onDelete(p.id); }} className="p-1.5 text-ink-400 hover:text-error-500" aria-label="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============ Categories Tab ============
function CategoriesTab({ categories, productCount, onAdd, onEdit, onDelete }: {
  categories: Category[]; productCount: Product[]; onAdd: () => void; onEdit: (c: Category) => void; onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-ink-900">Categories ({categories.length})</h2>
        <button onClick={onAdd} className="btn btn-primary btn-sm"><Plus size={15} /> Add Category</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => {
          const count = productCount.filter(p => p.category_id === c.id).length;
          return (
            <div key={c.id} className="rounded-xl border border-cream-200 bg-white p-4">
              {c.image_url && <img src={c.image_url} alt={c.name} className="h-32 w-full rounded-lg object-cover mb-3" />}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-ink-800">{c.name}</h3>
                  <p className="text-xs text-ink-500">{count} products</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onEdit(c)} className="p-1.5 text-ink-400 hover:text-clay-600" aria-label="Edit"><Pencil size={15} /></button>
                  <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) onDelete(c.id); }} className="p-1.5 text-ink-400 hover:text-error-500" aria-label="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Orders Tab ============
function OrdersTab({ orders, onView, onUpdateStatus }: {
  orders: Order[]; onView: (id: string) => void; onUpdateStatus: (id: string, status: string) => void;
}) {
  const statusColors: Record<string, 'success' | 'new' | 'warning' | 'error' | 'neutral'> = {
    delivered: 'success', shipped: 'new', processing: 'warning', pending: 'neutral', cancelled: 'error', refunded: 'error',
  };
  return (
    <div>
      <h2 className="font-display text-xl font-medium text-ink-900 mb-4">Orders ({orders.length})</h2>
      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingBag size={36} />} title="No orders yet" />
      ) : (
        <div className="rounded-xl border border-cream-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-200 text-left text-xs uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 hidden sm:table-cell">Customer</th>
                <th className="px-4 py-3 hidden md:table-cell">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-cream-100 hover:bg-cream-50">
                  <td className="px-4 py-3 font-medium text-ink-800">{o.order_number}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-ink-600">{o.profile?.email ?? o.shipping_email ?? '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-ink-500">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{formatPrice(Number(o.total))}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={e => onUpdateStatus(o.id, e.target.value)}
                      className="rounded-md border border-cream-300 bg-white px-2 py-1 text-xs text-ink-800"
                    >
                      {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onView(o.id)} className="text-clay-600 hover:text-clay-700 text-xs font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============ Customers Tab ============
function CustomersTab({ customers, orders, onView }: {
  customers: Profile[]; orders: Order[]; onView: (c: Profile) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-medium text-ink-900 mb-4">Customers ({customers.length})</h2>
      <div className="rounded-xl border border-cream-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-left text-xs uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 hidden md:table-cell">Joined</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3 hidden lg:table-cell">Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-b border-cream-100 hover:bg-cream-50 cursor-pointer" onClick={() => onView(c)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-100 text-clay-700 text-xs font-medium">{c.full_name?.charAt(0).toUpperCase() ?? 'U'}</div>
                    <span className="font-medium text-ink-800">{c.full_name ?? 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-ink-600">{c.email}</td>
                <td className="px-4 py-3 hidden md:table-cell text-ink-500">{formatDate(c.created_at)}</td>
                <td className="px-4 py-3 text-ink-700">{orders.filter(o => o.profile_id === c.id).length}</td>
                <td className="px-4 py-3 hidden lg:table-cell"><Badge variant={c.role === 'admin' ? 'gold' : 'neutral'}>{c.role}</Badge></td>
                <td className="px-4 py-3 text-right"><span className="text-clay-600 text-xs font-medium">View</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Banners Tab ============
function BannersTab({ banners, onAdd, onEdit, onDelete, onToggle }: {
  banners: Banner[]; onAdd: () => void; onEdit: (b: Banner) => void; onDelete: (id: string) => void; onToggle: (b: Banner) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-ink-900">Banners ({banners.length})</h2>
        <button onClick={onAdd} className="btn btn-primary btn-sm"><Plus size={15} /> Add Banner</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {banners.map(b => (
          <div key={b.id} className="rounded-xl border border-cream-200 bg-white overflow-hidden">
            {b.image_url && <img src={b.image_url} alt={b.title} className="h-32 w-full object-cover" />}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-ink-800">{b.title}</h3>
                  <p className="text-xs text-ink-500 mt-0.5">{b.placement}</p>
                </div>
                <Badge variant={b.is_active ? 'success' : 'neutral'}>{b.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => onToggle(b)} className="text-xs text-clay-600 font-medium hover:underline">{b.is_active ? 'Deactivate' : 'Activate'}</button>
                <span className="text-ink-300">·</span>
                <button onClick={() => onEdit(b)} className="text-xs text-ink-600 font-medium hover:underline">Edit</button>
                <span className="text-ink-300">·</span>
                <button onClick={() => { if (confirm(`Delete "${b.title}"?`)) onDelete(b.id); }} className="text-xs text-error-500 font-medium hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Coupons Tab ============
function CouponsTab({ coupons }: { coupons: Coupon[] }) {
  return (
    <div>
      <h2 className="font-display text-xl font-medium text-ink-900 mb-4">Coupons ({coupons.length})</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(c => (
          <div key={c.id} className="rounded-xl border border-cream-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-semibold text-ink-900">{c.code}</p>
                <p className="text-xs text-ink-500 mt-0.5">{c.description}</p>
              </div>
              <Badge variant={c.active ? 'success' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-medium text-clay-600">
                {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `${formatPrice(Number(c.discount_value))} off`}
              </span>
              {Number(c.min_subtotal) > 0 && <span className="text-xs text-ink-400">Min: {formatPrice(Number(c.min_subtotal))}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Order Detail Content ============
function OrderDetailContent({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (status: string) => void }) {
  return (
    <div className="p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div><p className="text-ink-400 text-xs uppercase tracking-wider mb-1">Order Date</p><p className="text-ink-800">{formatDate(order.created_at)}</p></div>
        <div><p className="text-ink-400 text-xs uppercase tracking-wider mb-1">Payment</p><p className="text-ink-800">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'} — {order.payment_status}</p></div>
        <div className="sm:col-span-2"><p className="text-ink-400 text-xs uppercase tracking-wider mb-1">Customer</p><p className="text-ink-800">{order.shipping_name} · {order.shipping_email}</p></div>
        <div className="sm:col-span-2"><p className="text-ink-400 text-xs uppercase tracking-wider mb-1">Shipping Address</p><p className="text-ink-800">{order.shipping_address}, {order.shipping_city} {order.shipping_postal}, {order.shipping_country}</p></div>
      </div>
      <div className="border-t border-cream-200 pt-4">
        <p className="text-sm font-semibold text-ink-800 mb-3">Items</p>
        <div className="space-y-3">
          {order.items?.map(item => (
            <div key={item.id} className="flex gap-3 items-center">
              {item.image_url && <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />}
              <div className="flex-1"><p className="text-sm font-medium text-ink-800">{item.name}</p><p className="text-xs text-ink-500">Qty: {item.quantity}</p></div>
              <span className="text-sm font-semibold text-ink-900">{formatPrice(Number(item.price) * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-cream-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span></div>
        {Number(order.discount) > 0 && <div className="flex justify-between text-sage-600"><span>Discount</span><span>-{formatPrice(Number(order.discount))}</span></div>}
        <div className="flex justify-between text-ink-600"><span>Shipping</span><span>{Number(order.shipping) === 0 ? 'Free' : formatPrice(Number(order.shipping))}</span></div>
        <div className="flex justify-between font-display text-lg font-semibold text-ink-900 pt-2 border-t border-cream-200"><span>Total</span><span>{formatPrice(Number(order.total))}</span></div>
      </div>
      <div className="border-t border-cream-200 pt-4">
        <p className="text-sm font-semibold text-ink-800 mb-2">Update Status</p>
        <div className="flex flex-wrap gap-2">
          {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map(s => (
            <button key={s} onClick={() => onUpdateStatus(s)} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', order.status === s ? 'bg-ink-900 text-cream-50' : 'bg-cream-100 text-ink-600 hover:bg-cream-200')}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ Product Form Modal ============
function ProductFormModal({ edit, categories, onClose, onSave }: {
  edit: Product | null; categories: Category[]; onClose: () => void; onSave: (data: Partial<Product>) => void;
}) {
  const [form, setForm] = useState({
    name: edit?.name ?? '',
    slug: edit?.slug ?? '',
    description: edit?.description ?? '',
    category_id: edit?.category_id ?? categories[0]?.id ?? '',
    price: edit?.price?.toString() ?? '',
    original_price: edit?.original_price?.toString() ?? '',
    stock: edit?.stock?.toString() ?? '0',
    sku: edit?.sku ?? '',
    status: edit?.status ?? 'active',
    is_featured: edit?.is_featured ?? false,
    is_bestseller: edit?.is_bestseller ?? false,
    is_new: edit?.is_new ?? false,
    primary_image: edit?.primary_image ?? '',
    secondary_image: edit?.secondary_image ?? '',
    material: edit?.material ?? '',
    dimensions: edit?.dimensions ?? '',
    weight: edit?.weight ?? '',
    origin: edit?.origin ?? '',
    care_instructions: edit?.care_instructions ?? '',
  });

  const handleSave = () => {
    const data: Partial<Product> = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      category_id: form.category_id || null,
      price: Number(form.price) || 0,
      original_price: form.original_price ? Number(form.original_price) : null,
      stock: Number(form.stock) || 0,
      sku: form.sku || null,
      status: form.status as Product['status'],
      is_featured: form.is_featured,
      is_bestseller: form.is_bestseller,
      is_new: form.is_new,
      primary_image: form.primary_image,
      secondary_image: form.secondary_image || null,
      material: form.material || null,
      dimensions: form.dimensions || null,
      weight: form.weight || null,
      origin: form.origin || null,
      care_instructions: form.care_instructions || null,
    };
    onSave(data);
  };

  return (
    <Modal open onClose={onClose} title={edit ? 'Edit Product' : 'Add Product'} size="xl">
      <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" /></div>
          <div><label className="label">Slug</label><input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" className="input" /></div>
          <div><label className="label">SKU</label><input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="input" /></div>
          <div><label className="label">Category</label><select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="input">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Product['status'] }))} className="input"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
          <div><label className="label">Price ($)</label><input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input" /></div>
          <div><label className="label">Original Price ($)</label><input type="number" step="0.01" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} className="input" /></div>
          <div><label className="label">Stock</label><input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="input" /></div>
          <div className="sm:col-span-2"><label className="label">Primary Image URL</label><input value={form.primary_image} onChange={e => setForm(f => ({ ...f, primary_image: e.target.value }))} className="input" placeholder="https://..." /></div>
          <div className="sm:col-span-2"><label className="label">Secondary Image URL</label><input value={form.secondary_image} onChange={e => setForm(f => ({ ...f, secondary_image: e.target.value }))} className="input" placeholder="https://..." /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="input resize-none" /></div>
          <div><label className="label">Material</label><input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} className="input" /></div>
          <div><label className="label">Dimensions</label><input value={form.dimensions} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} className="input" /></div>
          <div><label className="label">Weight</label><input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="input" /></div>
          <div><label className="label">Origin</label><input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} className="input" /></div>
          <div className="sm:col-span-2"><label className="label">Care Instructions</label><input value={form.care_instructions} onChange={e => setForm(f => ({ ...f, care_instructions: e.target.value }))} className="input" /></div>
        </div>
        <div className="flex flex-wrap gap-4">
          {([['is_featured', 'Featured'], ['is_bestseller', 'Bestseller'], ['is_new', 'New Arrival']] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="rounded border-cream-400 text-clay-600 focus:ring-clay-400" />
              <span className="text-sm text-ink-700">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-cream-200">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary"><Check size={16} /> Save</button>
        </div>
      </div>
    </Modal>
  );
}

// ============ Category Form Modal ============
function CategoryFormModal({ edit, onClose, onSave }: {
  edit: Category | null; onClose: () => void; onSave: (data: Partial<Category>) => void;
}) {
  const [form, setForm] = useState({
    name: edit?.name ?? '',
    slug: edit?.slug ?? '',
    description: edit?.description ?? '',
    image_url: edit?.image_url ?? '',
    sort_order: edit?.sort_order ?? 0,
  });

  return (
    <Modal open onClose={onClose} title={edit ? 'Edit Category' : 'Add Category'}>
      <div className="p-6 space-y-4">
        <div><label className="label">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" /></div>
        <div><label className="label">Slug</label><input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" className="input" /></div>
        <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input resize-none" /></div>
        <div><label className="label">Image URL</label><input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="input" placeholder="https://..." /></div>
        <div><label className="label">Sort Order</label><input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="input" /></div>
        <div className="flex gap-3 justify-end pt-2 border-t border-cream-200">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={() => onSave({ ...form, slug: form.slug || slugify(form.name) })} className="btn btn-primary"><Check size={16} /> Save</button>
        </div>
      </div>
    </Modal>
  );
}

// ============ Banner Form Modal ============
function BannerFormModal({ edit, onClose, onSave }: {
  edit: Banner | null; onClose: () => void; onSave: (data: Partial<Banner>) => void;
}) {
  const [form, setForm] = useState({
    title: edit?.title ?? '',
    subtitle: edit?.subtitle ?? '',
    image_url: edit?.image_url ?? '',
    cta_text: edit?.cta_text ?? '',
    cta_link: edit?.cta_link ?? '',
    placement: edit?.placement ?? 'hero',
    is_active: edit?.is_active ?? true,
    sort_order: edit?.sort_order ?? 0,
  });

  return (
    <Modal open onClose={onClose} title={edit ? 'Edit Banner' : 'Add Banner'}>
      <div className="p-6 space-y-4">
        <div><label className="label">Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" /></div>
        <div><label className="label">Subtitle</label><input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className="input" /></div>
        <div><label className="label">Image URL</label><input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="input" placeholder="https://..." /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">CTA Text</label><input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} className="input" /></div>
          <div><label className="label">CTA Link</label><input value={form.cta_link} onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))} className="input" placeholder="/shop" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Placement</label><select value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value as Banner['placement'] }))} className="input"><option value="hero">Hero</option><option value="promotional">Promotional</option><option value="editorial">Editorial</option></select></div>
          <div><label className="label">Sort Order</label><input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="input" /></div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-cream-400 text-clay-600" /><span className="text-sm text-ink-700">Active</span></label>
        <div className="flex gap-3 justify-end pt-2 border-t border-cream-200">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={() => onSave(form)} className="btn btn-primary"><Check size={16} /> Save</button>
        </div>
      </div>
    </Modal>
  );
}
