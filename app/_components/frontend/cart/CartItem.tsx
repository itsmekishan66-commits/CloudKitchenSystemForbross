"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { safeImageUrl } from "@/lib/image";
import toast from "react-hot-toast";

import type { CartItem as CartItemType } from "@/store/cartStore";

interface Props {
  item: CartItemType;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeItem: (id: string) => void;
  removeAddon: (cartItemId: string, addonName: string) => void;
}

export interface CartAddon {
  id: number;
  name: string;
  price: number;
  inventoryItemId?: number | null;
  quantity?: number | null;
}
export default function CartItem({
  item,
  increaseQty,
  decreaseQty,
  removeItem,
  removeAddon,
}: Props) {
  const addonTotal = item.addons?.reduce((sum, a) => sum + a.price, 0) ?? 0;
  const basePrice = item.basePrice ?? item.price - addonTotal;
  const itemKey = item.cartItemId ?? item.id;

  return (
    <div className="text-white flex gap-4 border-b pb-4 items-start">
      <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden">
        <Image
          src={safeImageUrl(item.image)}
          alt={item.title}
          width={80}
          height={80}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold">{item.title}</h4>

        {item.addons && item.addons.length > 0 ? (
          <div className="text-sm text-gray-400 mt-1 space-y-0.5">
            <div className="flex justify-between">
              <span>Base Price</span>
              <span>Rs.{basePrice.toFixed(2)}</span>
            </div>
            {item.addons.map((addon, i) => (
              <div key={i} className="flex justify-between pl-3 items-center">
                <span className="truncate">+ {addon.name}</span>
                <span className="shrink-0 flex items-center gap-1">
                  <span>Rs.{addon.price.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => removeAddon(itemKey, addon.name)}
                    className="flex gap-4 text-red-500 hover:scale-110 transition-all"
                    aria-label={`Remove ${addon.name}`}
                  >
                    <X size={16} />
                  </button>
                </span>
              </div>
            ))}
            <div className="border-t border-gray-700 my-1" />
            {item.discountPercent && item.originalPrice ? (
              <>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="line-through text-gray-500">Rs.{item.originalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Discount ({item.discountPercent}% off)</span>
                  <span>-Rs.{(item.originalPrice - item.price).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-700 my-1" />
                <div className="flex justify-between font-medium text-white">
                  <span>You Pay</span>
                  <span>Rs.{item.price.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between font-medium text-white">
                <span>Total</span>
                <span>Rs.{item.price.toFixed(2)}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-300">Rs.{item.price.toFixed(2)}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            aria-label={`Decrease ${item.title} quantity`}
            onClick={() => {
              if (item.quantity === 1) {
                toast.success(`Removed ${item.title} from cart`);
              }
              decreaseQty(itemKey);
            }}
          >
            <Minus size={16} />
          </button>

          <span>{item.quantity}</span>

          <button
            type="button"
            aria-label={`Increase ${item.title} quantity`}
            onClick={() => increaseQty(itemKey)}
          >
            <Plus size={16} />
          </button>

        </div>
        <span className="text-sm text-gray-300 space-y-1">
          Total {item.price.toFixed(2)} x {item.quantity} = {(item.price * item.quantity).toFixed(2)}
        </span>
      </div>

      <button
        type="button"
        aria-label={`Remove ${item.title}`}
        onClick={() => {
          toast.success(`Removed ${item.title} from cart`);
          removeItem(itemKey);
        }}
      >
        <Trash2 />
      </button>
    </div>
  );
}
