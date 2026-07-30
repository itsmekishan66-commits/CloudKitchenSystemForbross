import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Addon = {
  id?: string;
  name: string;
  price: number;
  inventoryItemId?: number | null;
  quantity?: number | null;
};

export interface CartItem {
  id: string;
  cartItemId?: string;
  title: string;
  image: string;
  price: number;
  basePrice?: number;
  quantity: number;
  addons?: Addon[];
  originalPrice?: number;
  discountPercent?: number;
}

interface CartStore {
  items: CartItem[];

  addItem: (item: Omit<CartItem, "quantity">) => void;

  removeItem: (id: string) => void;

  removeAddon: (cartItemId: string, addonName: string) => void;

  increaseQty: (id: string) => void;

  decreaseQty: (id: string) => void;

  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const addonKey = (item.addons ?? [])
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => `${a.name}:${a.price}`)
            .join("|");
          const cartItemId = addonKey ? `${item.id}_${addonKey}` : item.id;

          const existingItem = state.items.find(
            (cartItem) => (cartItem.cartItemId ?? cartItem.id) === cartItemId,
          );

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                (cartItem.cartItemId ?? cartItem.id) === cartItemId
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + 1,
                    }
                  : cartItem,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                cartItemId,
                quantity: 1,
              },
            ],
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter(
            (item) => (item.cartItemId ?? item.id) !== id,
          ),
        })),

      increaseQty: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            (item.cartItemId ?? item.id) === id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item,
          ),
        })),

      decreaseQty: (id) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              (item.cartItemId ?? item.id) === id
                ? {
                    ...item,
                    quantity: Math.max(item.quantity - 1, 0),
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),

      removeAddon: (cartItemId, addonName) =>
        set((state) => {
          const item = state.items.find(
            (i) => (i.cartItemId ?? i.id) === cartItemId,
          );
          if (!item?.addons) return state;

          const addon = item.addons.find((a) => a.name === addonName);
          if (!addon) return state;

          const remainingAddons = item.addons.filter(
            (a) => a.name !== addonName,
          );
          const newPrice = item.price - addon.price;
          const newOriginalPrice = item.originalPrice
            ? item.originalPrice - addon.price
            : undefined;

          const addonKey = remainingAddons
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => `${a.name}:${a.price}`)
            .join("|");
          const newCartItemId = addonKey
            ? `${item.id}_${addonKey}`
            : item.id;

          return {
            items: state.items.map((i) =>
              (i.cartItemId ?? i.id) === cartItemId
                ? {
                    ...i,
                    addons: remainingAddons.length > 0 ? remainingAddons : undefined,
                    price: newPrice,
                    originalPrice: newOriginalPrice,
                    cartItemId: newCartItemId,
                  }
                : i,
            ),
          };
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cloud-kitchen-cart",
    },
  ),
);