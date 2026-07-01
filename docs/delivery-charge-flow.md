# How Delivery Charge Works — Full Flow

## The Big Picture

When a customer orders food, we need to know:

- **Where** are they ordering from? (Which landmark/area?)
- **How much** should they pay for delivery? (Fixed per area, or free if order is big enough)
- **Is that zone still active?** (Admins can disable zones temporarily)

The delivery charge flows through **4 layers**: Database → Admin Panel → Checkout Page → Order API. Let's walk through each.

---

## Layer 1: Database Schema

### `delivery_zones` table

Stored in `db/schemas/delivery-zones.ts`:

| Column | Type | Purpose |
|---|---|---|
| `id` | int (PK) | Unique identifier |
| `landmark` | varchar(200) | Area name (e.g. "Biratnagar", "Kathmandu") |
| `delivery_charge` | decimal(10,2) | The fee for this zone |
| `min_order_amount` | decimal(10,2) | If order >= this, delivery is FREE (nullable) |
| `is_active` | boolean | Admin can deactivate a zone without deleting it |
| `created_at` | timestamp | When was this zone created? |
| `updated_at` | timestamp | Last modification time |

### `orders` table

Stored in `db/schemas/orders.ts`:

| Column | Type | Purpose |
|---|---|---|
| `total` | decimal(10,2) | Final order total (items + delivery) |
| `delivery_charge` | decimal(10,2) | **Snapshot** of the charge at order time |

> **Important:** The `delivery_charge` on an order is a **copy** of what the zone charged at that moment. If an admin later changes the zone's charge, existing orders keep their original charge. This is called a **value snapshot**.

---

## Layer 2: Admin Setup (Managing Zones)

**File:** `app/(superadmin)/dashboard/settings/deliveryCharge.tsx`

The superadmin can:

1. **Add a zone** — Give it a name, delivery charge, optional free-delivery threshold
2. **Edit a zone** — Change the charge, threshold, or **toggle Active/Inactive**
3. **Delete a zone** — Remove it permanently

When a zone is **Inactive**:
- It won't appear in the customer's checkout page
- The backend will reject any order that tries to use it

```
Admin Panel → PATCH /api/delivery-zones/:id → updates delivery_zones table
```

---

## Layer 3: Customer Checkout (Frontend)

**File:** `app/(root)/checkout/_components/checkoutForm.tsx`

### Step 1: Fetch Active Zones

When the checkout page loads, it calls:

```ts
fetch("/api/delivery-zones")
```

The API at `app/api/delivery-zones/route.ts` runs:

```ts
const zones = await getActiveZones();
```

Which translates to SQL:

```sql
SELECT * FROM delivery_zones WHERE is_active = true ORDER BY created_at DESC;
```

Only **active** zones are returned. The customer never sees disabled zones.

### Step 2: Customer Selects a Zone

The customer picks a zone from a dropdown, e.g. "Biratnagar — Rs. 50.00 (Free above Rs. 500.00)".

This triggers a `useEffect` that recalculates the delivery charge:

```ts
useEffect(() => {
  if (selectedZoneId) {
    const zone = zones.find((z) => z.id === selectedZoneId);
    if (zone) {
      const charge = Number(zone.deliveryCharge);
      if (zone.minOrderAmount && totalPrice >= Number(zone.minOrderAmount)) {
        setDeliveryCharge(0);      // FREE delivery!
      } else {
        setDeliveryCharge(charge); // Normal charge
      }
    }
  } else {
    setDeliveryCharge(0);
  }
}, [selectedZoneId, zones, totalPrice]);
```

The logic is simple:
- If the zone has a `minOrderAmount` AND the cart total is >= that amount → **FREE**
- Otherwise → charge the zone's standard `deliveryCharge`

Then:

```ts
const grandTotal = totalPrice + deliveryCharge;
```

### Step 3: Submit the Order

When the customer clicks "Place Order", the frontend sends:

```ts
body: JSON.stringify({
  customerName: "...",
  phone: "...",
  address: "...",
  zoneId: selectedZoneId,       // <-- which zone they picked
  deliveryCharge,               // <-- the calculated charge (0 or fixed)
  paymentMethod: "COD",
  items: [...],
  total: grandTotal,            // <-- items total + delivery charge
})
```

---

## Layer 4: Backend Validation (Security)

**File:** `app/api/orders/route.ts` — the `POST` handler

> **Why validate?** A malicious user could tamper with the delivery charge. They could change Rs. 50 to Rs. 0 in the browser's DevTools. The backend must re-calculate and reject any mismatch.

### What the server does:

```ts
// 1. Extract zoneId from the request
const zoneId = Number.isInteger(payload.zoneId) ? payload.zoneId : null;
const deliveryCharge = Number(payload.deliveryCharge) || 0;

// 2. Fetch the zone from the database
const { getZoneById } = await import("@/db/services/delivery-zones");
const zone = await getZoneById(zoneId);

// 3. Check existence and activity
if (!zone || !zone.isActive) {
  return error("Selected delivery area is not available");
}

// 4. Re-calculate what the charge SHOULD be
const expectedCharge = Number(zone.deliveryCharge);
const effectiveCharge =
  zone.minOrderAmount && total >= Number(zone.minOrderAmount) ? 0 : expectedCharge;

// 5. Compare with what the frontend sent
if (Math.abs(deliveryCharge - effectiveCharge) > 0.01) {
  return error("Delivery charge mismatch");  // <-- Tampering detected!
}
```

The `0.01` tolerance allows for tiny floating-point rounding differences.

### Step 5: Save the Order

If validation passes, the order is saved:

```ts
const orderId = await createOrder({
  deliveryCharge: deliveryCharge.toFixed(2),
  total: total.toFixed(2),
  // ... other fields
});
```

This runs a database **transaction** that:
1. Inserts the order with the `delivery_charge` and `total`
2. Inserts all order items

---

## Layer 5: Superadmin Viewing Orders

**Files:** `app/(superadmin)/_components/OrdersTable.tsx`, `app/api/orders/items/route.ts`

### Displaying Delivery Charge

The `getOrdersWithDetails()` function now fetches `deliveryCharge` alongside other fields:

```ts
// In db/services/orders.ts
.select({
  id: orders.id,
  total: orders.total,
  deliveryCharge: orders.deliveryCharge,  // <-- was missing, now fixed
  // ... other fields
})
```

The admin sees a breakdown in the order table:

```
Items Subtotal    Rs. 400.00
Delivery Charge   Rs.  50.00   ← separately shown
Total             Rs. 450.00
```

### When Admin Modifies Items (Add/Remove/Change Qty)

**This was the bug.** Previously, when an admin added or removed items, the total was recalculated as:

```ts
// ❌ OLD (broken)
const newTotal = allItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
// Total = items only — delivery charge was LOST!
```

**Fixed** — now the server fetches the stored delivery charge and includes it:

```ts
// ✅ NEW (fixed)
const [order] = await db.select().from(orders).where(eq(orders.id, item.orderId)).limit(1);
const deliveryCharge = Number(order?.deliveryCharge ?? 0);
const itemsSubtotal = allItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
const newTotal = (itemsSubtotal + deliveryCharge).toFixed(2);
await db.update(orders).set({ total: newTotal });
```

This fix was applied to all three item mutation endpoints in `app/api/orders/items/route.ts`:
- **POST** (add item)
- **PATCH** (change quantity)
- **DELETE** (remove item)

---

## Visual Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN (Settings Page)                       │
│  deliveryCharge.tsx                                              │
│    │                                                             │
│    │ POST/PATCH /api/delivery-zones                              │
│    ▼                                                             │
│  delivery-zones route.ts                                         │
│    │                                                             │
│    │ db/services/delivery-zones.ts                               │
│    ▼                                                             │
│  ┌─────────────────────────────────────────┐                     │
│  │         delivery_zones table            │                     │
│  │  ┌──────┬──────────┬──────────┬──────┐  │                     │
│  │  │ id   │ landmark  │ charge   │active│  │                     │
│  │  ├──────┼──────────┼──────────┼──────┤  │                     │
│  │  │ 1    │Biratnagar│  50.00   │ true │  │                     │
│  │  │ 2    │Kathmandu │  80.00   │ true │  │                     │
│  │  └──────┴──────────┴──────────┴──────┘  │                     │
│  └─────────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
         │
         │ GET /api/delivery-zones (public)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER (Checkout Page)                       │
│  checkoutForm.tsx                                                 │
│    │                                                              │
│    │ Fetches active zones → populates dropdown                    │
│    │ User selects "Biratnagar" → charge = Rs. 50                 │
│    │ Cart total = Rs. 400 → no free delivery (min is 500)        │
│    │ grandTotal = 400 + 50 = 450                                  │
│    │                                                              │
│    │ POST /api/orders { zoneId:1, deliveryCharge:50, total:450 } │
│    ▼                                                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Order API)                             │
│  orders route.ts - POST handler                                   │
│    │                                                              │
│    │ 1. Check zoneId is valid integer                             │
│    │ 2. Fetch zone from DB (getZoneById)                          │
│    │ 3. Zone exists? Active?                                      │
│    │ 4. expectedCharge = zone.deliveryCharge (= 50)               │
│    │ 5. effectiveCharge = 50 (minOrderAmount=500, total=400 <500) │
│    │ 6. Compare: |50 - 50| <= 0.01 ✓ VALID                        │
│    │ 7. Save order with deliveryCharge=50.00, total=450.00        │
│    ▼                                                              │
│  ┌─────────────────────────────────────────────────────┐          │
│  │                  orders table                       │          │
│  │  ┌────┬──────────┬────────┬──────────────────┬────┐ │          │
│  │  │ id │ customer │ total  │ delivery_charge  │ ...│ │          │
│  │  ├────┼──────────┼────────┼──────────────────┼────┤ │          │
│  │  │ 42 │ John     │ 450.00 │ 50.00            │    │ │          │
│  │  └────┴──────────┴────────┴──────────────────┴────┘ │          │
│  └─────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Admin views order #42 in dashboard
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPERADMIN (Orders Page)                        │
│  OrdersTable.tsx                                                  │
│    │                                                              │
│    │ Delivery Charge: Rs. 50.00  ← shown separately              │
│    │ Total: Rs. 450.00                                           │
│    │                                                              │
│    │ Admin adds an item (Rs. 100) → API recalculates:            │
│    │   itemsSubtotal = 400 + 100 = 500                            │
│    │   deliveryCharge = 50 (from DB, kept as-is)                 │
│    │   newTotal = 500 + 50 = 550  ✅                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Why? |
|---|---|
| **`deliveryCharge` stored as a snapshot, not a foreign key** | If the zone's charge changes later, existing orders keep their original charge. Customer won't be surprised. |
| **Backend re-validates the charge** | Prevents tampering. A user can't edit the HTML to get free delivery. |
| **Only active zones are returned to checkout** | Simple way for admins to temporarily pause delivery to certain areas. |
| **Items subtotal vs total breakdown** | The admin needs to see exactly how much is for food vs delivery, especially when modifying orders. |

## Summary

The delivery charge is:

1. **Defined** by the superadmin in the Settings page → stored in `delivery_zones` table
2. **Fetched** by the checkout page (only active zones)
3. **Calculated** on the frontend (with free-delivery logic)
4. **Re-validated** on the backend to prevent tampering
5. **Snapshotted** into the order at creation time
6. **Displayed** in the superadmin order panel
7. **Preserved** when admins modify order items
