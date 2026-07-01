"use client";

import useCart from "@/hooks/useCart";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const {
    items,
    totalPrice,
    increaseQty,
    decreaseQty,
    removeItem,
  } = useCart();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 h-screen bg-black/30 z-100"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-screen w-full max-w-100 bg-white z-100 shadow-xl flex flex-col  overflow-hidden transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-2xl font-bold">Your Cart</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border bg-black text-white px-3 py-1 text-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              Your cart is empty
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  increaseQty={increaseQty}
                  decreaseQty={decreaseQty}
                  removeItem={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        <div className="border-t p-6 bg-white">
          <CartSummary totalPrice={totalPrice} />
        </div>
      </div>
    </>
  );
}