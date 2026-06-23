"use client";

import { createContext, useContext } from "react";
import { useCartStore, type CartItem } from "@/store/cartStore";

type CartContextType = {
  cartCount: number;
  addToCart: (item: CartItem) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (item: CartItem) => {
    addItem(item);
  };
  

  return (
    <CartContext.Provider value={{ cartCount, addToCart }}>
      {children}
    </CartContext.Provider>
    
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
