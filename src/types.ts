export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  sku: string | null;
  status: 'active' | 'draft' | 'archived';
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  rating: number;
  review_count: number;
  primary_image: string;
  secondary_image: string | null;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  origin: string | null;
  care_instructions: string | null;
  created_at: string;
  category?: Category | null;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
};

export type Review = {
  id: string;
  product_id: string;
  profile_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  profile?: Profile | null;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'customer' | 'admin';
  avatar_url: string | null;
  created_at: string;
};

export type Address = {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  postal_code: string | null;
  country: string;
  is_default: boolean;
};

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cod' | 'online';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type Order = {
  id: string;
  order_number: string;
  profile_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  coupon_code: string | null;
  shipping_name: string;
  shipping_phone: string | null;
  shipping_email: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_postal: string | null;
  shipping_country: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  profile?: Profile | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  image_url: string | null;
  price: number;
  quantity: number;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_subtotal: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  placement: 'hero' | 'promotional' | 'editorial';
  is_active: boolean;
  sort_order: number;
};

export type CartItem = {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  quantity: number;
  stock: number;
};
