import { supabase } from './supabase';
import type { Product, Category, Review, Order, OrderItem, Banner, Coupon, Address, Profile } from '@/types';

// ============ Categories ============
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data as Category[];
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as Category | null;
}

// ============ Products ============
export async function fetchProducts(opts?: {
  categoryId?: string;
  featured?: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  search?: string;
  sort?: string;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}): Promise<Product[]> {
  let query = supabase.from('products').select('*, category:categories(*)');
  
  if (opts?.categoryId) query = query.eq('category_id', opts.categoryId);
  if (opts?.featured) query = query.eq('is_featured', true);
  if (opts?.bestseller) query = query.eq('is_bestseller', true);
  if (opts?.isNew) query = query.eq('is_new', true);
  if (opts?.inStock) query = query.gt('stock', 0);
  if (opts?.search) query = query.or(`name.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
  if (typeof opts?.minPrice === 'number') query = query.gte('price', opts.minPrice);
  if (typeof opts?.maxPrice === 'number') query = query.lte('price', opts.maxPrice);
  
  query = query.eq('status', 'active');
  
  switch (opts?.sort) {
    case 'price-asc': query = query.order('price', { ascending: true }); break;
    case 'price-desc': query = query.order('price', { ascending: false }); break;
    case 'newest': query = query.order('created_at', { ascending: false }); break;
    case 'rating': query = query.order('rating', { ascending: false }); break;
    case 'name': query = query.order('name', { ascending: true }); break;
    default: query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  }
  
  if (opts?.limit) query = query.limit(opts.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function fetchProductImages(productId: string): Promise<{ url: string }[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', productId)
    .order('sort_order');
  if (error) throw error;
  return data as { url: string }[];
}

export async function fetchRelatedProducts(productId: string, categoryId: string | null, limit = 4): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .neq('id', productId)
    .eq('status', 'active')
    .limit(limit);
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

// ============ Reviews ============
export async function fetchReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profile:profiles(*)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Review[];
}

export async function addReview(productId: string, profileId: string, rating: number, title: string, body: string): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .insert({ product_id: productId, profile_id: profileId, rating, title, body });
  if (error) throw error;
}

// ============ Banners ============
export async function fetchBanners(placement?: string): Promise<Banner[]> {
  let query = supabase.from('banners').select('*').eq('is_active', true);
  if (placement) query = query.eq('placement', placement);
  query = query.order('sort_order');
  const { data, error } = await query;
  if (error) throw error;
  return data as Banner[];
}

// ============ Coupons ============
export async function fetchCouponByCode(code: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data as Coupon | null;
}

// ============ Orders ============
export async function createOrder(order: {
  order_number: string;
  profile_id: string;
  status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  payment_status: string;
  coupon_code: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal: string;
  shipping_country: string;
  notes: string | null;
}, items: Omit<OrderItem, 'id' | 'order_id'>[]): Promise<Order> {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  if (orderError) throw orderError;
  
  const createdOrder = orderData as Order;
  const itemsWithOrderId = items.map(i => ({ ...i, order_id: createdOrder.id }));
  const { error: itemsError } = await supabase.from('order_items').insert(itemsWithOrderId);
  if (itemsError) throw itemsError;
  
  return createdOrder;
}

export async function fetchUserOrders(profileId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!orderData) return null;
  
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  if (itemsError) throw itemsError;
  
  return { ...orderData, items: itemsData as OrderItem[] } as Order;
}

export async function fetchAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, profile:profiles(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  if (error) throw error;
}

// ============ Addresses ============
export async function fetchAddresses(profileId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('profile_id', profileId)
    .order('is_default', { ascending: false });
  if (error) throw error;
  return data as Address[];
}

export async function addAddress(addr: Omit<Address, 'id' | 'profile_id'> & { profile_id: string }): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .insert(addr)
    .select()
    .single();
  if (error) throw error;
  return data as Address;
}

export async function updateAddress(id: string, addr: Partial<Address>): Promise<void> {
  const { error } = await supabase
    .from('addresses')
    .update(addr)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ Admin: Products ============
export async function fetchAllProductsAdmin(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Product[];
}

export async function createProduct(p: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(p)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, p: Partial<Product>): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update(p)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ Admin: Categories ============
export async function createCategory(c: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(c)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, c: Partial<Category>): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update(c)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ Admin: Banners ============
export async function fetchAllBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data as Banner[];
}

export async function createBanner(b: Partial<Banner>): Promise<Banner> {
  const { data, error } = await supabase
    .from('banners')
    .insert(b)
    .select()
    .single();
  if (error) throw error;
  return data as Banner;
}

export async function updateBanner(id: string, b: Partial<Banner>): Promise<void> {
  const { error } = await supabase
    .from('banners')
    .update(b)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ Admin: Customers ============
export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Profile[];
}

// ============ Admin: Coupons ============
export async function fetchAllCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Coupon[];
}

export async function createCoupon(c: Partial<Coupon>): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .insert(c)
    .select()
    .single();
  if (error) throw error;
  return data as Coupon;
}

export async function updateCoupon(id: string, c: Partial<Coupon>): Promise<void> {
  const { error } = await supabase
    .from('coupons')
    .update(c)
    .eq('id', id);
  if (error) throw error;
}

// ============ Profile ============
export async function updateProfile(id: string, p: { full_name?: string; avatar_url?: string }): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(p)
    .eq('id', id);
  if (error) throw error;
}
