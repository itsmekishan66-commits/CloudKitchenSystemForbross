"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { safeImageUrl } from "@/lib/image";
import toast from "react-hot-toast";

import type { CartItem as CartItemType } from "@/store/cartStore";

interface Props {
  item: CartItemType;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeItem: (id: string) => void;
}

export interface CartAddon {
  id: number;
  name: string;
  price: number;
}
export default function CartItem({
  item,
  increaseQty,
  decreaseQty,
  removeItem,
}: Props) {
  return (
    <div className="flex gap-4 border-b pb-4">
      <Image
        src={safeImageUrl(item.image)}
        alt={item.title}
        width={80}
        height={80}
        className="rounded-lg"
      />

      <div className="flex-1">
        <h4 className="font-semibold">{item.title}</h4>

        <p className="text-red-900">Rs.{item.price}</p>

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            aria-label={`Decrease ${item.title} quantity`}
            onClick={() => {
              if (item.quantity === 1) {
                toast.success(`Removed ${item.title} from cart`);
              }
              decreaseQty(item.id);
            }}
          >
            <Minus size={16} />
          </button>

          <span>{item.quantity}</span>

          <button
            type="button"
            aria-label={`Increase ${item.title} quantity`}
            onClick={() => increaseQty(item.id)}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <button
        type="button"
        aria-label={`Remove ${item.title}`}
        onClick={() => {
          toast.success(`Removed ${item.title} from cart`);
          removeItem(item.id);
        }}
      >
        <Trash2 />
      </button>
    </div>
  );
}
