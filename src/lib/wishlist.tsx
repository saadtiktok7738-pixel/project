import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { Product } from '@/types';

type WishlistContextType = {
  ids: string[];
  count: number;
  has: (productId: string) => boolean;
  toggle: (product: Product) => void;
  loading: boolean;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

const LOCAL_KEY = 'maison-wishlist';

function loadLocal(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>(loadLocal);
  const [loading, setLoading] = useState(false);

  const saveLocal = useCallback((newIds: string[]) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(newIds));
  }, []);

  const loadFromDb = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('profile_id', uid);
      if (!error && data) {
        const dbIds = data.map((d: { product_id: string }) => d.product_id);
        const merged = Array.from(new Set([...loadLocal(), ...dbIds]));
        setIds(merged);
        saveLocal(merged);
      }
    } catch (e) {
      console.error('Wishlist load error:', e);
    } finally {
      setLoading(false);
    }
  }, [saveLocal]);

  useEffect(() => {
    if (user?.id) {
      loadFromDb(user.id);
    } else {
      setIds(loadLocal());
    }
  }, [user?.id, loadFromDb]);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const toggle = useCallback((product: Product) => {
    setIds(prev => {
      const exists = prev.includes(product.id);
      const newIds = exists
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id];
      saveLocal(newIds);

      if (user?.id) {
        if (exists) {
          supabase
            .from('wishlist')
            .delete()
            .eq('profile_id', user.id)
            .eq('product_id', product.id)
            .then(({ error }) => { if (error) console.error('Wishlist remove error:', error); });
        } else {
          supabase
            .from('wishlist')
            .insert({ profile_id: user.id, product_id: product.id })
            .then(({ error }) => { if (error) console.error('Wishlist add error:', error); });
        }
      }

      return newIds;
    });
  }, [user?.id, saveLocal]);

  return (
    <WishlistContext.Provider value={{ ids, count: ids.length, has, toggle, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
