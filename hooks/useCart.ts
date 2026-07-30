"use client";

import { useCartStore } from "../store/cartStore";

export default function useCart() {
  const { items, addItem, removeItem, removeAddon, increaseQty, decreaseQty, clearCart } =
    useCartStore();

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const totalPrice = items.reduce(
    (acc, item) => acc + item.price * item.quantity,0
  );

  return {
    items,
    addItem,
    removeItem,
    removeAddon,
    increaseQty,
    decreaseQty,
    clearCart,
    totalItems,
    totalPrice,
  };
}
