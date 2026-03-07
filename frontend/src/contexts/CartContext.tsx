'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface CartItem {
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'aishop_cart';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

function isSameItem(a: CartItem, productId: string, variantId: string | null): boolean {
  return a.productId === productId && a.variantId === variantId;
}

export function CartProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);

  const addItem = useCallback(
    (incoming: Omit<CartItem, 'quantity'> & { quantity?: number }): void => {
      const qty = incoming.quantity ?? 1;
      setItems((prev) => {
        const idx = prev.findIndex((i) => isSameItem(i, incoming.productId, incoming.variantId));
        if (idx >= 0) {
          return prev.map((item, i) => {
            if (i !== idx) return item;
            const newQty = Math.min(item.quantity + qty, item.maxQuantity);
            return { ...item, quantity: newQty };
          });
        }
        return [
          ...prev,
          {
            productId: incoming.productId,
            variantId: incoming.variantId,
            name: incoming.name,
            price: incoming.price,
            imageUrl: incoming.imageUrl,
            quantity: Math.min(qty, incoming.maxQuantity),
            maxQuantity: incoming.maxQuantity,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string, variantId: string | null): void => {
      setItems((prev) => prev.filter((i) => !isSameItem(i, productId, variantId)));
    },
    [],
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number): void => {
      setItems((prev) =>
        prev.map((item) => {
          if (!isSameItem(item, productId, variantId)) return item;
          const clamped = Math.max(1, Math.min(quantity, item.maxQuantity));
          return { ...item, quantity: clamped };
        }),
      );
    },
    [],
  );

  const clearCart = useCallback((): void => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx === null) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
