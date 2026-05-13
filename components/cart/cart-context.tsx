"use client";

import type {
  Cart,
  Product,
  ProductVariant,
} from "lib/local/types";
import { useCartStore } from "lib/cart/store";
import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState
} from "react";

type UpdateType = "plus" | "minus" | "delete";

type CartContextType = {
  cart: Cart | undefined;
  updateCartItem: (merchandiseId: string, updateType: UpdateType) => void;
  addCartItem: (variant: ProductVariant, product: Product) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
  cartPromise?: Promise<Cart | undefined>;
}) {
  const { cart, addItem, removeItem, updateQuantity } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch for persisted store
  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCartItem = (merchandiseId: string, updateType: UpdateType) => {
    const line = cart.lines.find((l: { merchandise: { id: string; }; }) => l.merchandise.id === merchandiseId);
    if (!line) return;

    if (updateType === 'delete') {
      removeItem(line.id!);
    } else if (updateType === 'plus') {
      updateQuantity(line.id!, line.quantity + 1);
    } else if (updateType === 'minus') {
      updateQuantity(line.id!, line.quantity - 1);
    }
  };

  const addCartItem = (variant: ProductVariant, product: Product) => {
    addItem(product, variant);
  };

  const value = useMemo(
    () => ({
      cart: mounted ? cart : undefined,
      updateCartItem,
      addCartItem,
    }),
    [cart, mounted]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
