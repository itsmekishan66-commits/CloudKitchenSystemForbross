# Dynamic Delivery Charge by Location

## Overview
Replace the hardcoded Rs.100 delivery charge with a **zone-based dynamic system**. Customers select their area from a dropdown at checkout, and the delivery charge is calculated from a database table that admins manage via a UI.

---

## Step 1 — Create the `delivery_zones` Database Table

### `db/schemas/delivery-zones.ts`

```ts
import {
  boolean,
  decimal,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const deliveryZones = mysqlTable("delivery_zones", {
  id: int("id").autoincrement().primaryKey(),
  areaName: varchar("area_name", { length: 100 }).notNull().unique(),
  deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).notNull().default("0"),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type NewDeliveryZone = typeof deliveryZones.$inferInsert;
```

### `db/schemas/index.ts` — Add export

```ts
export * from "./delivery-zones";
```

### `db/schemas/orders.ts` — Add delivery charge column (after `total` line)

```ts
deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).notNull().default("0"),
```

### Run migration

```powershell
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## Step 2 — Create the Delivery Zone Service

### `db/services/delivery-zones.ts`

```ts
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { deliveryZones, type NewDeliveryZone } from "@/db/schemas";

export async function getActiveZones() {
  return db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.isActive, true))
    .orderBy(desc(deliveryZones.createdAt));
}

export async function getAllZones() {
  return db.select().from(deliveryZones).orderBy(desc(deliveryZones.createdAt));
}

export async function getZoneById(id: number) {
  const [zone] = await db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.id, id))
    .limit(1);
  return zone ?? null;
}

export async function createZone(data: NewDeliveryZone) {
  const result = await db.insert(deliveryZones).values(data);
  return result[0].insertId;
}

export async function updateZone(id: number, data: Partial<NewDeliveryZone>) {
  await db.update(deliveryZones).set(data).where(eq(deliveryZones.id, id));
}

export async function toggleZoneStatus(id: number) {
  const zone = await getZoneById(id);
  if (!zone) return null;
  await db
    .update(deliveryZones)
    .set({ isActive: !zone.isActive })
    .where(eq(deliveryZones.id, id));
  return !zone.isActive;
}

export async function deleteZone(id: number) {
  await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
}
```

---

## Step 3 — Create the Zones API

### `app/api/delivery-zones/route.ts`

```ts
import { NextResponse } from "next/server";

import {
  getActiveZones,
  getAllZones,
  createZone,
} from "@/db/services/delivery-zones";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get("admin");

  // Public endpoint - return active zones
  if (!admin) {
    try {
      const zones = await getActiveZones();
      return NextResponse.json({ zones });
    } catch (error) {
      console.error("Failed to load delivery zones", error);
      return NextResponse.json(
        { error: "Unable to load delivery zones" },
        { status: 500 }
      );
    }
  }

  // Admin endpoint - return all zones
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SETTINGS);
    if (user instanceof NextResponse) return user;

    const zones = await getAllZones();
    return NextResponse.json({ zones });
  } catch (error) {
    console.error("Failed to load delivery zones", error);
    return NextResponse.json(
      { error: "Unable to load delivery zones" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SETTINGS);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { areaName, deliveryCharge, minOrderAmount } = body;

    if (!areaName?.trim() || deliveryCharge === undefined) {
      return NextResponse.json(
        { error: "Area name and delivery charge are required" },
        { status: 400 }
      );
    }

    const charge = Number(deliveryCharge);
    if (!Number.isFinite(charge) || charge < 0) {
      return NextResponse.json(
        { error: "Delivery charge must be a valid non-negative number" },
        { status: 400 }
      );
    }

    const zoneId = await createZone({
      areaName: areaName.trim(),
      deliveryCharge: charge.toFixed(2),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount).toFixed(2) : null,
    });

    return NextResponse.json({ zoneId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create delivery zone", error);
    return NextResponse.json(
      { error: "Unable to create delivery zone" },
      { status: 500 }
    );
  }
}
```

### `app/api/delivery-zones/[id]/route.ts`

```ts
import { NextResponse } from "next/server";

import {
  updateZone,
  toggleZoneStatus,
  deleteZone,
  getZoneById,
} from "@/db/services/delivery-zones";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SETTINGS);
    if (user instanceof NextResponse) return user;

    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid zone ID" }, { status: 400 });
    }

    const body = await request.json();
    const { action, areaName, deliveryCharge, minOrderAmount, isActive } = body;

    if (action === "toggle") {
      const newStatus = await toggleZoneStatus(id);
      if (newStatus === null) {
        return NextResponse.json(
          { error: "Zone not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ isActive: newStatus });
    }

    const updateData: Record<string, unknown> = {};
    if (areaName?.trim()) updateData.areaName = areaName.trim();
    if (deliveryCharge !== undefined) {
      const charge = Number(deliveryCharge);
      if (!Number.isFinite(charge) || charge < 0) {
        return NextResponse.json(
          { error: "Delivery charge must be a valid non-negative number" },
          { status: 400 }
        );
      }
      updateData.deliveryCharge = charge.toFixed(2);
    }
    if (minOrderAmount !== undefined) {
      updateData.minOrderAmount = minOrderAmount
        ? Number(minOrderAmount).toFixed(2)
        : null;
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    await updateZone(id, updateData);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update delivery zone", error);
    return NextResponse.json(
      { error: "Unable to update delivery zone" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SETTINGS);
    if (user instanceof NextResponse) return user;

    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid zone ID" }, { status: 400 });
    }

    await deleteZone(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete delivery zone", error);
    return NextResponse.json(
      { error: "Unable to delete delivery zone" },
      { status: 500 }
    );
  }
}
```

---

## Step 4 — Update the Checkout Form

### `app/(root)/checkout/_components/checkoutForm.tsx`

Replace the entire file with:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import useCart from "@/hooks/useCart";
import useUser from "@/hooks/useUser";
import PaymentMethods from "./paymentMethods";
import { User, Phone, MapPin, ShoppingBag, ChevronDown } from "lucide-react";

type Zone = {
  id: number;
  areaName: string;
  deliveryCharge: string;
  minOrderAmount: string | null;
};

type OrderResponse = {
  error?: string;
  orderId?: number;
};

export default function CheckoutForm() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user, loading: userLoading } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    streetAddress: "",
  });

  const [profileFetched, setProfileFetched] = useState(false);

  // Fetch active delivery zones
  useEffect(() => {
    fetch("/api/delivery-zones")
      .then((res) => res.json())
      .then((data) => {
        if (data.zones) {
          setZones(data.zones);
        }
      })
      .catch(console.error);
  }, []);

  // Recalculate delivery charge when zone changes
  useEffect(() => {
    if (selectedZoneId) {
      const zone = zones.find((z) => z.id === selectedZoneId);
      if (zone) {
        const charge = Number(zone.deliveryCharge);
        if (zone.minOrderAmount && totalPrice >= Number(zone.minOrderAmount)) {
          setDeliveryCharge(0);
        } else {
          setDeliveryCharge(charge);
        }
      }
    } else {
      setDeliveryCharge(0);
    }
  }, [selectedZoneId, zones, totalPrice]);

  if (user && !profileFetched) {
    setProfileFetched(true);
    fetch("/api/auth/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setForm({
            customerName: data.user.name || "",
            phone: data.user.phone || "",
            streetAddress: data.user.address || "",
          });
        }
      })
      .catch(() => {});
  }

  const grandTotal = totalPrice + deliveryCharge;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setError("");

      if (!form.customerName.trim() || !form.phone.trim() || !form.streetAddress.trim()) {
        setError("Name, phone, and address are required.");
        return;
      }

      if (!selectedZoneId) {
        setError("Please select a delivery area.");
        return;
      }

      if (items.length === 0) {
        setError("Your cart is empty.");
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: form.customerName,
            phone: form.phone,
            address: form.streetAddress,
            zoneId: selectedZoneId,
            deliveryCharge,
            paymentMethod,
            items,
            total: grandTotal,
          }),
        });

        const data = (await response.json()) as OrderResponse;

        if (!response.ok) {
          setError(data.error ?? "Unable to place order. Please try again.");
          return;
        }

        clearCart();
        router.push(`/success?orderId=${data.orderId ?? ""}`);
      } catch {
        setError("Unable to reach the server. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [form, items, grandTotal, deliveryCharge, selectedZoneId, paymentMethod, clearCart, router],
  );

  const showGuestModal = !userLoading && !user;

  const addressSection = (
    <>
      <div className="relative">
        <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <select
          required
          value={selectedZoneId ?? ""}
          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm appearance-none"
          onChange={(e) => setSelectedZoneId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Select Delivery Area</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.areaName} — Rs.{Number(zone.deliveryCharge).toFixed(2)}
              {zone.minOrderAmount && ` (Free above Rs.${Number(zone.minOrderAmount).toFixed(2)})`}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative">
        <MapPin size={18} className="absolute left-3.5 top-3 text-gray-400" />
        <textarea
          required
          placeholder="Street / Building / Landmark"
          value={form.streetAddress}
          rows={3}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm resize-none"
          onChange={(e) => setForm({ ...form, streetAddress: e.target.value })}
        />
      </div>

      {selectedZoneId && (
        <div className="flex justify-between items-center text-sm px-1">
          <span className="text-gray-600">Delivery Charge</span>
          <span className="font-medium">
            {deliveryCharge === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              `Rs. ${deliveryCharge.toFixed(2)}`
            )}
          </span>
        </div>
      )}

      {selectedZoneId && (
        <div className="flex justify-between items-center font-bold text-base px-1 pt-2 border-t">
          <span>Total</span>
          <span>Rs. {grandTotal.toFixed(2)}</span>
        </div>
      )}
    </>
  );

  const formFields = (
    <>
      <div className="relative">
        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          required
          placeholder="Full Name"
          value={form.customerName}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
        />
      </div>

      <div className="relative">
        <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          required
          placeholder="Phone Number"
          value={form.phone}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      {addressSection}
    </>
  );

  const guestModal = (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-linear-to-r from-orange-500 to-red-600 p-6 text-white">
          <h2 className="text-xl font-bold">Complete Your Order</h2>
          <p className="text-white/80 text-sm mt-1">Enter your details to place the order</p>
        </div>

        <div className="p-6 space-y-4">
          {formFields}

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-linear-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-md disabled:opacity-60"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <ShoppingBag size={18} />
                Place Order — Rs.{grandTotal.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {showGuestModal && guestModal}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-lg text-gray-900">Delivery Details</h2>
          {formFields}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Payment Method</h2>
          <PaymentMethods value={paymentMethod} onChange={setPaymentMethod} />
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-md disabled:opacity-60"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <ShoppingBag size={20} />
              Place Order — Rs.{grandTotal.toFixed(2)}
            </>
          )}
        </button>
      </form>
    </>
  );
}
```

---

## Step 5 — Update Cart Summary (accept delivery charge as prop)

### `app/_components/frontend/cart/CartSummary.tsx`

```tsx
"use client";

import Link from "next/link";

interface CartSummaryProps {
  totalPrice: number;
  deliveryCharge?: number;
}

export default function CartSummary({
  totalPrice,
  deliveryCharge = 0,
}: CartSummaryProps) {
  const grandTotal = totalPrice + deliveryCharge;

  return (
    <div className="border-t pt-5">
      <div className="flex justify-between items-center mb-3">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium">Rs. {totalPrice.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center mb-3">
        <span className="text-gray-600">Delivery Charge</span>
        <span className="font-medium">
          {deliveryCharge === 0 ? (
            <span className="text-green-600">FREE</span>
          ) : (
            `Rs. ${deliveryCharge.toFixed(2)}`
          )}
        </span>
      </div>

      <div className="border-t my-4" />

      <div className="flex justify-between items-center text-lg font-bold">
        <span>Total</span>
        <span className="text-red-900">Rs. {grandTotal.toFixed(2)}</span>
      </div>

      {totalPrice > 0 ? (
        <Link
          href="/checkout"
          className="block w-full mt-5 bg-red-900 text-white text-center py-3 rounded-xl"
        >
          Proceed to Checkout
        </Link>
      ) : (
        <button
          disabled
          className="w-full mt-5 bg-gray-300 text-gray-500 py-3 rounded-xl cursor-not-allowed"
        >
          Cart is Empty
        </button>
      )}
    </div>
  );
}
```

Update calls to `<CartSummary>` wherever it's used to pass `deliveryCharge` if available (e.g., from context or store). If not available, it defaults to 0.

---

## Step 6 — Update Order API to accept delivery charge

### `app/api/orders/route.ts`

Add to the `OrderPayload` type (after line 28):
```ts
zoneId?: number;
deliveryCharge?: number;
```
Add validation after the existing validation (after line 101, before `try`):
```ts
const zoneId = Number.isInteger(payload.zoneId) ? payload.zoneId : null;
const deliveryCharge = Number(payload.deliveryCharge) || 0;

// If zoneId provided, validate it and calculate charge server-side
if (zoneId) {
  const { getZoneById } = await import("@/db/services/delivery-zones");
  const zone = await getZoneById(zoneId);
  if (!zone || !zone.isActive) {
    return NextResponse.json(
      { error: "Selected delivery area is not available" },
      { status: 400 }
    );
  }

  const expectedCharge = Number(zone.deliveryCharge);
  // Apply free delivery if min order met
  const effectiveCharge =
    zone.minOrderAmount && total >= Number(zone.minOrderAmount) ? 0 : expectedCharge;

  if (Math.abs(deliveryCharge - effectiveCharge) > 0.01) {
    return NextResponse.json(
      { error: "Delivery charge mismatch" },
      { status: 400 }
    );
  }
}
```

Update `createOrder` call (around line 122):
```ts
const orderId = await createOrder({
  userId,
  customerName,
  phone,
  address,
  paymentMethod,
  deliveryCharge: deliveryCharge.toFixed(2),
  total: total.toFixed(2),
  items: items.map((item) => ({
    menuItemId: null,
    title: item.title,
    quantity: item.quantity,
    price: item.price.toFixed(2),
    meta: {
      image: item.image,
      clientId: item.id,
    },
  })),
});
```

---

## Step 7 — Update Order Service Types

The `deliveryCharge` column is now part of `orders` schema, so `NewOrder` type already includes it. The `CreateOrderInput` in `db/services/orders.ts` extends `NewOrder`, so no changes needed there.

---

## Step 8 — Admin UI: Manage Delivery Zones

### `app/(superadmin)/dashboard/delivery-zones/page.tsx`

```tsx
import DeliveryZonesClient from "./client";

export const metadata = {
  title: "Delivery Zones",
};

export default function DeliveryZonesPage() {
  return <DeliveryZonesClient />;
}
```

### `app/(superadmin)/dashboard/delivery-zones/client.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, Edit3, Trash2, Power, PowerOff } from "lucide-react";

type Zone = {
  id: number;
  areaName: string;
  deliveryCharge: string;
  minOrderAmount: string | null;
  isActive: boolean;
};

const cardClass =
  "bg-white rounded-2xl shadow-sm border border-gray-100 p-6";
const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

export default function DeliveryZonesClient() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    areaName: "",
    deliveryCharge: "",
    minOrderAmount: "",
  });

  async function loadZones() {
    try {
      const res = await fetch("/api/delivery-zones?admin=true");
      const data = await res.json();
      if (data.zones) setZones(data.zones);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadZones();
  }, []);

  function openCreateModal() {
    setEditing(null);
    setForm({ areaName: "", deliveryCharge: "", minOrderAmount: "" });
    setShowModal(true);
  }

  function openEditModal(zone: Zone) {
    setEditing(zone);
    setForm({
      areaName: zone.areaName,
      deliveryCharge: zone.deliveryCharge,
      minOrderAmount: zone.minOrderAmount ?? "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.areaName.trim() || !form.deliveryCharge.trim()) return;
    setSaving(true);

    try {
      if (editing) {
        await fetch(`/api/delivery-zones/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            areaName: form.areaName,
            deliveryCharge: form.deliveryCharge,
            minOrderAmount: form.minOrderAmount || null,
          }),
        });
      } else {
        await fetch("/api/delivery-zones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            areaName: form.areaName,
            deliveryCharge: form.deliveryCharge,
            minOrderAmount: form.minOrderAmount || null,
          }),
        });
      }

      setShowModal(false);
      loadZones();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(zone: Zone) {
    try {
      await fetch(`/api/delivery-zones/${zone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      });
      loadZones();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(zone: Zone) {
    if (!confirm(`Delete "${zone.areaName}"?`)) return;
    try {
      await fetch(`/api/delivery-zones/${zone.id}`, { method: "DELETE" });
      loadZones();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Zones</h1>
          <p className="mt-2 text-gray-500">
            Manage delivery areas and their charges
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"
        >
          <Plus size={18} />
          Add Zone
        </button>
      </div>

      <div className={cardClass}>
        {zones.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No delivery zones configured yet. Click "Add Zone" to create one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Area</th>
                  <th className="pb-3 font-medium">Delivery Charge</th>
                  <th className="pb-3 font-medium">Min. Order (Free Delivery)</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id} className="border-b last:border-0">
                    <td className="py-4 font-medium">{zone.areaName}</td>
                    <td className="py-4">Rs. {Number(zone.deliveryCharge).toFixed(2)}</td>
                    <td className="py-4">
                      {zone.minOrderAmount
                        ? `Rs. ${Number(zone.minOrderAmount).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                          zone.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {zone.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(zone)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggle(zone)}
                          className={`rounded-lg p-2 ${
                            zone.isActive
                              ? "text-red-500 hover:bg-red-50"
                              : "text-green-500 hover:bg-green-50"
                          }`}
                          title={zone.isActive ? "Deactivate" : "Activate"}
                        >
                          {zone.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(zone)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">
              {editing ? "Edit Zone" : "Add Zone"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Area Name
                </label>
                <input
                  value={form.areaName}
                  onChange={(e) => setForm({ ...form, areaName: e.target.value })}
                  placeholder="e.g. Biratnagar"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Delivery Charge (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deliveryCharge}
                  onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })}
                  placeholder="e.g. 50"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Min. Order for Free Delivery (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                  placeholder="e.g. 500"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Leave empty to always charge delivery fee
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.areaName.trim() || !form.deliveryCharge.trim()}
                className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Step 9 — Add Sidebar Link in Admin Dashboard

Find the admin sidebar component (likely at `app/(superadmin)/dashboard/layout.tsx` or a sidebar component file) and add:

```tsx
{
  label: "Delivery Zones",
  href: "/dashboard/delivery-zones",
  icon: <MapPin size={18} />,
}
```

---

## Step 10 — (Optional) Seed Default Zones

Add this to a seed script or migration to populate initial zones:

```ts
import { db } from "@/db";
import { deliveryZones } from "@/db/schemas";

await db.insert(deliveryZones).values([
  { areaName: "Biratnagar", deliveryCharge: "50.00", minOrderAmount: "500.00" },
  { areaName: "Itahari", deliveryCharge: "70.00", minOrderAmount: "500.00" },
  { areaName: "Dharan", deliveryCharge: "80.00", minOrderAmount: "400.00" },
  { areaName: "Inaruwa", deliveryCharge: "60.00", minOrderAmount: null },
  { areaName: "Sundarharaicha", deliveryCharge: "50.00", minOrderAmount: null },
  { areaName: "Belbari", deliveryCharge: "100.00", minOrderAmount: "300.00" },
]);
```

---

## Summary of All Files

### Created (6 files)
| File | Purpose |
|------|---------|
| `db/schemas/delivery-zones.ts` | Database table schema |
| `db/services/delivery-zones.ts` | CRUD service for zones |
| `app/api/delivery-zones/route.ts` | API list + create |
| `app/api/delivery-zones/[id]/route.ts` | API update + toggle + delete |
| `app/(superadmin)/dashboard/delivery-zones/page.tsx` | Admin page (server component) |
| `app/(superadmin)/dashboard/delivery-zones/client.tsx` | Admin page (client component) |

### Modified (5 files)
| File | Changes |
|------|---------|
| `db/schemas/index.ts` | Export `delivery-zones` schema |
| `db/schemas/orders.ts` | Add `deliveryCharge` decimal column |
| `app/api/orders/route.ts` | Accept `zoneId` + `deliveryCharge`, validate against DB |
| `app/(root)/checkout/_components/checkoutForm.tsx` | Zone dropdown, dynamic charge calc, grand total display |
| `app/_components/frontend/cart/CartSummary.tsx` | Accept `deliveryCharge` prop instead of hardcoded 100 |
| Admin sidebar layout | Add "Delivery Zones" navigation link |
