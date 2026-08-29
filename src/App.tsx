import { useEffect, useState } from 'react';
import { RouterProvider, useRouter } from '@/lib/router';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { WishlistProvider } from '@/lib/wishlist';
import { ToastProvider } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { HomePage } from '@/pages/HomePage';
import { ShopPage } from '@/pages/ShopPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { SearchPage } from '@/pages/SearchPage';
import { AuthPage } from '@/pages/AuthPage';
import { AccountPage } from '@/pages/AccountPage';
import { AdminPage } from '@/pages/AdminPage';
import { Chatbot } from '@/components/Chatbot';

function AppRoutes() {
  const { path } = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('sort_order');
        if (!error && data) setCategories(data as Category[]);
      } catch (e) { console.error('Categories load error:', e); }
    })();
  }, []);

  // Parse route
  const segments = path.split('/').filter(Boolean);
  const isAdmin = segments[0] === 'admin';
  const isAuth = segments[0] === 'login' || segments[0] === 'signup';

  let page: React.ReactNode;
  if (path === '/' || path === '') {
    page = <HomePage />;
  } else if (segments[0] === 'shop') {
    page = <ShopPage />;
  } else if (segments[0] === 'category' && segments[1]) {
    page = <ShopPage categorySlug={segments[1]} />;
  } else if (segments[0] === 'product' && segments[1]) {
    page = <ProductDetailPage slug={segments[1]} />;
  } else if (segments[0] === 'cart') {
    page = <CartPage />;
  } else if (segments[0] === 'checkout') {
    page = <CheckoutPage />;
  } else if (segments[0] === 'wishlist') {
    page = <WishlistPage />;
  } else if (segments[0] === 'search') {
    page = <SearchPage />;
  } else if (segments[0] === 'login') {
    page = <AuthPage mode="login" />;
  } else if (segments[0] === 'signup') {
    page = <AuthPage mode="signup" />;
  } else if (segments[0] === 'account') {
    page = <AccountPage />;
  } else if (segments[0] === 'admin') {
    page = <AdminPage />;
  } else {
    page = (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-4xl font-medium text-ink-900">404</h1>
        <p className="text-ink-500 mt-2">This page could not be found.</p>
        <a href="#/" className="btn btn-primary mt-6 inline-flex">Back to Home</a>
      </div>
    );
  }

  // Auth and admin pages have minimal chrome
  if (isAuth) {
    return <div className="min-h-screen bg-cream-50">{page}</div>;
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-cream-50">
        <Header categories={categories} />
        {page}
        <CartDrawer />
        <Chatbot />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Header categories={categories} />
      <main className="flex-1">{page}</main>
      <Footer categories={categories} />
      <CartDrawer />
      <Chatbot />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppRoutes />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </RouterProvider>
  );
}
