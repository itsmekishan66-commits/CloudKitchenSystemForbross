# Adding Landmark Name to Superadmin Orders

**Approach:** Snapshot — store `landmark_name` directly on the `orders` table at creation time.

---

## Step 1 — Add `landmarkName` column to the schema

**File:** `db/schemas/orders.ts`

Add after `deliveryCharge`:

```ts
deliveryCharge: decimal("delivery_charge", { precision: 10, scale: 2 }).notNull().default("0"),
landmarkName: varchar("landmark_name", { length: 200 }),
```

Nullable — existing orders get `NULL` and simply won't display a landmark.

---

## Step 2 — Generate & run the database migration

```bash
npm run db:generate
npm run db:migrate
```

This produces a new `.sql` file in `drizzle/` (e.g. `0010_xxx.sql`):

```sql
ALTER TABLE `orders` ADD `landmark_name` varchar(200);
```

Then applies it to MySQL.

---

## Step 3 — Save the landmark name at order creation

**File:** `app/api/orders/route.ts` (~line 160)

The `zone` object is already fetched at line 121 and contains `zone.landmarkName`. Pass it to `createOrder()`:

```ts
const orderId = await createOrder({
  userId,
  customerName,
  phone,
  address,
  paymentMethod,
  deliveryCharge: deliveryCharge.toFixed(2),
  total: total.toFixed(2),
  landmarkName: zone.landmarkName,   // ← add this
  items: items.map((item) => ({
    menuItemId: null,
    title: item.title,
    quantity: item.quantity,
    price: item.price.toFixed(2),
    meta: { image: item.image, clientId: item.id },
  })),
});
```

---

## Step 4 — Include `landmarkName` in the admin order query

**File:** `db/services/orders.ts` (~line 33)

Add to the SELECT object in `getOrdersWithDetails()`:

```ts
deliveryCharge: orders.deliveryCharge,
landmarkName: orders.landmarkName,   // ← add this
paymentSettled: orders.paymentSettled,
```

---

## Step 5 — Add `landmarkName` to the frontend `Order` interfaces

### `app/(superadmin)/dashboard/orders/client.tsx`

```ts
interface Order {
  // ... existing fields
  deliveryCharge: string;
  landmarkName?: string;    // ← add this
  status: string;
  // ...
}
```

### `app/(superadmin)/_components/OrdersTable.tsx`

```ts
interface Order {
  // ... existing fields
  deliveryCharge: string;
  landmarkName?: string;    // ← add this
  status: string;
  // ...
}
```

---

## Step 6 — Display the landmark in the admin order card

**File:** `app/(superadmin)/_components/OrdersTable.tsx` (~line 254-258)

Inside the Customer Details block, add:

```tsx
<p><span className="text-gray-400">Address:</span> {order.address}</p>
{order.landmarkName && (
  <p><span className="text-gray-400">Landmark:</span> {order.landmarkName}</p>
)}
{order.userEmail && <p><span className="text-gray-400">Email:</span> {order.userEmail}</p>}
```

---

## Summary

| # | File | Change |
|---|------|--------|
| 1 | `db/schemas/orders.ts` | Add `landmarkName` column (nullable varchar) |
| 2 | *(auto)* `drizzle/0010_xxx.sql` | Migration file |
| 3 | `app/api/orders/route.ts` | Pass `zone.landmarkName` to `createOrder()` |
| 4 | `db/services/orders.ts` | Add `landmarkName` to SELECT query |
| 5 | `app/(superadmin)/dashboard/orders/client.tsx` | Add `landmarkName?: string` to interface |
| 6 | `app/(superadmin)/_components/OrdersTable.tsx` | Add `landmarkName?: string` + render it |
