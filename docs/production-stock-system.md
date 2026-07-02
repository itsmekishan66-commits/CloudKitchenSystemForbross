# Production Stock System — Implementation Plan

## Overview

Cloud kitchens cook in **bulk batches**, freeze/store the finished product, then **just heat & serve** on order. This system tracks that flow separately from raw inventory.

```
Raw Ingredients (inventory_items)
    ↓  PRODUCTION / COOKING  (deducts raw, adds finished stock)
Prepared / Cooked Stock (new: menu_items.preparedQuantity)
    ↓  CUSTOMER ORDER  (deducts finished stock only)
Sold
```

---

## Step 1 — Add `preparedQuantity` column to `menu_items`

**File:** `db/schemas/menu-items.ts`

Add after the `discountPercent` field:

```ts
preparedQuantity: int("prepared_quantity").notNull().default(0),
```

Full field list after edit:

```ts
export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
  title: varchar("title", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  image: varchar("image", { length: 2048 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  badge: varchar("badge", { length: 80 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviews: int("reviews").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  addons: json("addons"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
  preparedQuantity: int("prepared_quantity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
```

Also add `preparedQuantity` to the client-side `MenuItem` interface in `app/(superadmin)/dashboard/menu/client.tsx`:

```ts
interface MenuItem {
  id: number;
  title: string;
  slug: string;
  categoryId: number | null;
  price: string;
  image: string | null;
  description: string | null;
  badge: string | null;
  rating: string;
  reviews: number;
  isAvailable: boolean;
  addons: Addon[] | null;
  discountPercent: string | null;
  preparedQuantity: number;  // ← ADD THIS
}
```

---

## Step 2 — Create `production_batches` table

**File:** `db/schemas/production-batches.ts`

```ts
// this is the code for menu recipe - production batches table
import { int, mysqlTable, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";
import { menuItems } from "./menu-items";
import { recipes } from "./recipes";
import { users } from "./users";

export const productionBatches = mysqlTable("production_batches", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "restrict" }),
  recipeId: int("recipe_id").notNull().references(() => recipes.id, { onDelete: "restrict" }),
  quantity: int("quantity").notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  producedBy: int("produced_by").references(() => users.id, { onDelete: "set null" }),
  notes: varchar("notes", { length: 255 }),
  producedAt: timestamp("produced_at").notNull().defaultNow(),
});

export type ProductionBatch = typeof productionBatches.$inferSelect;
export type NewProductionBatch = typeof productionBatches.$inferInsert;
```

---

## Step 3 — Export new schema

**File:** `db/schemas/index.ts`

Add between the recipe exports and delivery-zones:

```ts
// this is the code for menu recipe - production batches
export * from "./production-batches";
```

---

## Step 4 — Production service

**File:** `db/services/production.ts`

```ts
// this is the code for menu recipe - production service
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  inventoryItems,
  menuItems,
  productionBatches,
  recipeIngredients,
  recipes,
  type NewProductionBatch,
} from "@/db/schemas";

export type ProductionCheck = {
  canProduce: boolean;
  shortages: Array<{ name: string; available: number; needed: number; unit: string }>;
  costPerUnit: number;
  totalCost: number;
};

export async function checkProductionFeasibility(
  recipeId: number,
  quantity: number
): Promise<ProductionCheck> {
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);

  if (!recipe) {
    return { canProduce: false, shortages: [], costPerUnit: 0, totalCost: 0 };
  }

  const ingredients = await db
    .select({
      invId: inventoryItems.id,
      invName: inventoryItems.name,
      invQty: inventoryItems.quantity,
      invUnit: inventoryItems.unit,
      invPrice: inventoryItems.pricePerUnit,
      reqQty: recipeIngredients.quantity,
    })
    .from(recipeIngredients)
    .innerJoin(inventoryItems, eq(recipeIngredients.inventoryItemId, inventoryItems.id))
    .where(eq(recipeIngredients.recipeId, recipeId));

  let totalCost = 0;
  const shortages: ProductionCheck["shortages"] = [];

  for (const ing of ingredients) {
    const needed = Number(ing.reqQty) * quantity;
    const available = Number(ing.invQty);
    totalCost += needed * Number(ing.invPrice);

    if (available < needed) {
      shortages.push({
        name: ing.invName,
        available,
        needed,
        unit: ing.invUnit,
      });
    }
  }

  const costPerUnit = quantity > 0 ? totalCost / quantity : 0;

  return {
    canProduce: shortages.length === 0,
    shortages,
    costPerUnit: Math.round(costPerUnit * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

export async function getProductionBatches(menuItemId?: number) {
  const conditions: ReturnType<typeof eq>[] = [];
  if (menuItemId) conditions.push(eq(productionBatches.menuItemId, menuItemId));

  const query = db
    .select()
    .from(productionBatches)
    .orderBy(desc(productionBatches.producedAt));

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function produceBatch(
  menuItemId: number,
  recipeId: number,
  quantity: number,
  producedBy: number | null,
  notes: string | null
) {
  // 1. Check feasibility
  const check = await checkProductionFeasibility(recipeId, quantity);
  if (!check.canProduce) {
    throw new Error(
      `Insufficient inventory: ${check.shortages
        .map((s) => `${s.name} (need ${s.needed} ${s.unit}, have ${s.available})`)
        .join(", ")}`
    );
  }

  // 2. Deduct raw inventory
  const ingredients = await db
    .select({
      invId: inventoryItems.id,
      reqQty: recipeIngredients.quantity,
    })
    .from(recipeIngredients)
    .innerJoin(inventoryItems, eq(recipeIngredients.inventoryItemId, inventoryItems.id))
    .where(eq(recipeIngredients.recipeId, recipeId));

  for (const ing of ingredients) {
    const deductQty = Number(ing.reqQty) * quantity;
    const [item] = await db
      .select({ currentQty: inventoryItems.quantity })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, ing.invId))
      .limit(1);

    const newQty = Math.max(0, Number(item.currentQty) - deductQty);
    await db.update(inventoryItems).set({ quantity: String(newQty) }).where(eq(inventoryItems.id, ing.invId));
  }

  // 3. Insert batch record
  const batchData: NewProductionBatch = {
    menuItemId,
    recipeId,
    quantity,
    costPerUnit: String(check.costPerUnit),
    totalCost: String(check.totalCost),
    producedBy,
    notes,
  };

  const result = await db.insert(productionBatches).values(batchData);
  const batchId = result[0].insertId;

  // 4. Increment prepared stock
  const [menuItem] = await db
    .select({ currentPrepared: menuItems.preparedQuantity })
    .from(menuItems)
    .where(eq(menuItems.id, menuItemId))
    .limit(1);

  await db
    .update(menuItems)
    .set({ preparedQuantity: (menuItem?.currentPrepared ?? 0) + quantity })
    .where(eq(menuItems.id, menuItemId));

  return { batchId, ...check };
}
```

---

## Step 5 — Export service

**File:** `db/services/index.ts`

Add after recipe export:

```ts
// this is the code for menu recipe - production service
export * from "./production";
```

---

## Step 6 — Production API route

**File:** `app/api/superadmin/production/route.ts`

```ts
// this is the code for menu recipe - production API
import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  checkProductionFeasibility,
  produceBatch,
  getProductionBatches,
} from "@/db/services/production";
import { createActivityLog } from "@/db/services/activity-logs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_INVENTORY);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { menuItemId, recipeId, quantity, notes } = body;

    if (!menuItemId || !recipeId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "menuItemId, recipeId, and quantity > 0 are required" },
        { status: 400 }
      );
    }

    const check = await checkProductionFeasibility(recipeId, quantity);
    if (!check.canProduce) {
      return NextResponse.json(
        { error: "Insufficient inventory", shortages: check.shortages },
        { status: 400 }
      );
    }

    const result = await produceBatch(menuItemId, recipeId, quantity, user.id, notes || null);

    await createActivityLog({
      userId: user.id,
      action: `Produced ${quantity} × menu item #${menuItemId}`,
      entityType: "production_batch",
      entityId: result.batchId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Production failed", error);
    return NextResponse.json({ error: "Production failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_INVENTORY);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get("menuItemId");

    const batches = await getProductionBatches(
      menuItemId ? Number(menuItemId) : undefined
    );

    return NextResponse.json({ batches });
  } catch (error) {
    console.error("Failed to load batches", error);
    return NextResponse.json({ error: "Unable to load batches" }, { status: 500 });
  }
}
```

---

## Step 7 — Migration

Run these commands to create the new table and column:

```bash
npm run db:generate -- --name=add_production_stock
npm run db:push
```

---

## Step 8 — UI Changes in Menu Page

**File:** `app/(superadmin)/dashboard/menu/client.tsx`

### A. Add "Cook" button in table header (next to "+ Add menu recipe"):

```tsx
{can("UPDATE_INVENTORY") && (
  <button onClick={() => { setProductionModalOpen(true); setProductionMenuItemId(null); }}
    className="rounded-xl bg-purple-600 px-5 py-3 text-white font-semibold hover:bg-purple-700"
  >
    + Cook Stock
  </button>
)}
```

### B. Add "Prepared Stock" column to table (after Status column):

Head:
```tsx
<th className="p-4 text-left">Prepared Stock</th>
```

Body:
```tsx
<td className="p-4">
  <span className={`rounded-full px-3 py-1 text-sm font-medium ${
    item.preparedQuantity >= 20 ? "bg-green-100 text-green-700" :
    item.preparedQuantity >= 5  ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700"
  }`}>
    {item.preparedQuantity} pcs
  </span>
</td>
```

Also add the `colSpan` update on the empty state row (add 1 for the new column).

### C. Add "Produce" button per table row:

```tsx
{can("UPDATE_INVENTORY") && (
  <button onClick={() => openProduction(item.id, item.title)}
    className="mr-2 rounded bg-purple-600 px-3 py-1 text-white text-sm hover:bg-purple-700"
  >
    Cook
  </button>
)}
```

### D. Add state variables (with existing recipe state):

```ts
// this is the code for menu recipe - production state
const [productionModalOpen, setProductionModalOpen] = useState(false);
const [productionMenuItemId, setProductionMenuItemId] = useState<number | null>(null);
const [productionMenuItemTitle, setProductionMenuItemTitle] = useState("");
const [productionRecipeId, setProductionRecipeId] = useState<number | null>(null);
const [productionQuantity, setProductionQuantity] = useState("50");
const [productionNotes, setProductionNotes] = useState("");
const [productionCheck, setProductionCheck] = useState<ProductionCheckResult | null>(null);
const [productionSaving, setProductionSaving] = useState(false);
const [productionMessage, setProductionMessage] = useState("");
```

### E. Add openProduction function:

```ts
// this is the code for menu recipe - open production modal
function openProduction(menuItemId: number, menuItemTitle: string) {
  setProductionMenuItemId(menuItemId);
  setProductionMenuItemTitle(menuItemTitle);
  setProductionRecipeId(null);
  setProductionQuantity("50");
  setProductionNotes("");
  setProductionCheck(null);
  setProductionMessage("");
  setProductionModalOpen(true);
}
```

### F. Add ProductionCheckResult type:

```ts
// this is the code for menu recipe - production types
type ProductionCheckResult = {
  canProduce: boolean;
  shortages: Array<{ name: string; available: number; needed: number; unit: string }>;
  costPerUnit: number;
  totalCost: number;
};
```

### G. Add production modal JSX (before the closing `</div>` of the page):

```tsx
{/* this is the code for menu recipe - production modal */}
{productionModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-8 py-6 rounded-t-3xl">
        <h2 className="text-2xl font-bold text-slate-800">
          {productionMenuItemTitle
            ? `Cook ${productionMenuItemTitle}`
            : "Cook Stock"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Produce finished goods from raw inventory using a recipe.
        </p>
      </div>

      {/* Body */}
      <div className="p-8 space-y-6">
        {productionMessage && (
          <div className={`rounded-xl p-3 text-sm ${
            productionMessage.startsWith("✅")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}>
            {productionMessage}
          </div>
        )}

        {/* Menu Item selector (shown when opened from top-level button) */}
        {!productionMenuItemId && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Menu Item</label>
            <select
              value={productionMenuItemId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                const item = items.find((i) => i.id === id);
                setProductionMenuItemId(id || null);
                setProductionMenuItemTitle(item?.title ?? "");
                setProductionRecipeId(null);
                setProductionCheck(null);
                setProductionMessage("");
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-purple-500"
            >
              <option value="">-- Select --</option>
              {items.filter((i) => i.isAvailable).map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Recipe selector */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Recipe</label>
          <select
            value={productionRecipeId ?? ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              setProductionRecipeId(id || null);
              setProductionCheck(null);
              setProductionMessage("");
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-purple-500"
          >
            <option value="">-- Select recipe --</option>
            {recipes
              .filter((r) => r.menuItemId === productionMenuItemId && r.isActive)
              .map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
          </select>
          {productionMenuItemId && recipes.filter(
            (r) => r.menuItemId === productionMenuItemId && r.isActive
          ).length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No active recipes for this item. Create one first.
            </p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Quantity to Produce (in units)
          </label>
          <input
            type="number"
            min="1"
            value={productionQuantity}
            onChange={(e) => {
              setProductionQuantity(e.target.value);
              setProductionCheck(null);
              setProductionMessage("");
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-purple-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={productionNotes}
            onChange={(e) => setProductionNotes(e.target.value)}
            placeholder="e.g. Batch #3, frozen at 2 PM"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-purple-500"
          />
        </div>

        {/* Check & Cost Preview */}
        {productionMenuItemId && productionRecipeId && Number(productionQuantity) > 0 && (
          <div>
            <button
              type="button"
              onClick={async () => {
                setProductionMessage("");
                try {
                  const res = await fetch("/api/superadmin/production/check", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      recipeId: productionRecipeId,
                      quantity: Number(productionQuantity),
                    }),
                  });
                  const data = await res.json();
                  setProductionCheck(data);
                } catch {
                  setProductionMessage("Failed to check inventory");
                }
              }}
              className="rounded-xl border border-purple-300 px-5 py-2.5 text-purple-700 font-medium hover:bg-purple-50"
            >
              Check Inventory & Cost
            </button>

            {productionCheck && (
              <div className="mt-4 space-y-3">
                {/* Cost Summary */}
                <div className="rounded-2xl bg-purple-50 border border-purple-200 p-4">
                  <div className="flex gap-6 text-sm">
                    <span className="font-semibold text-slate-700">
                      Cost per unit: <span className="text-purple-700">Rs.{productionCheck.costPerUnit}</span>
                    </span>
                    <span className="font-semibold text-slate-700">
                      Total cost: <span className="text-purple-700">Rs.{productionCheck.totalCost}</span>
                    </span>
                  </div>
                </div>

                {/* Inventory Check */}
                {productionCheck.shortages.length > 0 ? (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                    <h4 className="font-semibold text-red-700 mb-2">
                      ❌ Insufficient Inventory
                    </h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      {productionCheck.shortages.map((s, i) => (
                        <li key={i}>
                          {s.name}: need {s.needed} {s.unit}, have {s.available} {s.unit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
                    <p className="text-sm text-green-700 font-medium">
                      ✅ All ingredients available in stock
                    </p>
                    <ul className="mt-2 text-xs text-green-600 space-y-1">
                      {recipes
                        .find((r) => r.id === productionRecipeId)
                        ?.ingredients.map((ing, i) => (
                          <li key={i}>
                            {ing.inventoryItemName}: {Number(ing.quantity) * Number(productionQuantity)} {ing.unit}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-white px-8 py-5 flex justify-end gap-3 rounded-b-3xl">
        <button
          onClick={() => { setProductionModalOpen(false); setProductionCheck(null); setProductionMessage(""); }}
          className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            if (!productionMenuItemId || !productionRecipeId) {
              setProductionMessage("Select menu item and recipe");
              return;
            }
            setProductionSaving(true);
            setProductionMessage("");
            try {
              const res = await fetch("/api/superadmin/production", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  menuItemId: productionMenuItemId,
                  recipeId: productionRecipeId,
                  quantity: Number(productionQuantity),
                  notes: productionNotes || null,
                }),
              });
              const data = await res.json();
              if (data.error) {
                setProductionMessage(data.error);
                if (data.shortages) {
                  setProductionCheck(data);
                }
                return;
              }
              setProductionMessage(`✅ Successfully produced ${productionQuantity} units`);
              await loadData();
              setProductionCheck(null);
            } catch {
              setProductionMessage("Production failed");
            } finally {
              setProductionSaving(false);
            }
          }}
          disabled={productionSaving || !productionCheck?.canProduce}
          className="rounded-xl bg-purple-600 px-5 py-2.5 text-white font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          {productionSaving ? "Cooking..." : "Cook & Deduct from Inventory"}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Step 9 — Production Check API

**File:** `app/api/superadmin/production/check/route.ts`

```ts
// this is the code for menu recipe - production check API
import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { checkProductionFeasibility } from "@/db/services/production";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_INVENTORY);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { recipeId, quantity } = body;

    if (!recipeId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "recipeId and quantity > 0 are required" },
        { status: 400 }
      );
    }

    const check = await checkProductionFeasibility(recipeId, quantity);
    return NextResponse.json(check);
  } catch (error) {
    console.error("Production check failed", error);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
```

---

## Step 10 (Future) — Order Deduction from Prepared Stock

When an order status changes to `"Preparing"`, deduct from `preparedQuantity` instead of raw inventory.

**Add to** `db/services/orders.ts`:

```ts
// this is the code for menu recipe - deduct prepared stock on preparing
export async function deductPreparedStock(orderId: number) {
  const orderItemsList = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  for (const item of orderItemsList) {
    if (!item.menuItemId) continue;
    const [menuItem] = await db
      .select({ currentPrepared: menuItems.preparedQuantity })
      .from(menuItems)
      .where(eq(menuItems.id, item.menuItemId))
      .limit(1);

    const newQty = Math.max(0, (menuItem?.currentPrepared ?? 0) - item.quantity);
    await db
      .update(menuItems)
      .set({ preparedQuantity: newQty })
      .where(eq(menuItems.id, item.menuItemId));
  }
}

export async function restorePreparedStock(orderId: number) {
  const orderItemsList = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  for (const item of orderItemsList) {
    if (!item.menuItemId) continue;
    await db
      .update(menuItems)
      .set({
        preparedQuantity: sql`${menuItems.preparedQuantity} + ${item.quantity}`,
      })
      .where(eq(menuItems.id, item.menuItemId));
  }
}
```

**In** `app/api/orders/route.ts` (PATCH handler), add after the status update:

```ts
// this is the code for menu recipe - handle prepared stock on status change
if (status === "Preparing") {
  await deductPreparedStock(id);
} else if (status === "Cancelled") {
  // Check previous status from DB before updating
  // If previous was "Preparing", restore stock
  const currentOrder = await getOrderById(id);
  if (currentOrder?.status === "Preparing") {
    await restorePreparedStock(id);
  }
}
```

**Also fix the checkout to pass `menuItemId`** — currently set to `null` on line 179:

```ts
menuItemId: null,  // ← Change this to look up menuItemId by title
```

For now, you can look up the menu item ID by title:

```ts
// Find menuItemId by title
const menuItemsList = await (await import("@/db/services/menu-items")).getMenuItems();
const matchedItem = menuItemsList.find(
  (mi) => mi.title.toLowerCase() === item.title.toLowerCase()
);
menuItemId: matchedItem?.id ?? null,
```

---

## Summary

| File | Action |
|------|--------|
| `db/schemas/menu-items.ts` | Add `preparedQuantity` column |
| `db/schemas/production-batches.ts` | **New** — batch history table |
| `db/schemas/index.ts` | Export new schema |
| `db/services/production.ts` | **New** — production logic + feasibility check |
| `db/services/index.ts` | Export production service |
| `db/services/orders.ts` | **Future** — add `deductPreparedStock` / `restorePreparedStock` |
| `app/api/superadmin/production/route.ts` | **New** — POST (produce), GET (batches) |
| `app/api/superadmin/production/check/route.ts` | **New** — POST (feasibility check only) |
| `app/api/orders/route.ts` | **Future** — trigger deduction on status change |
| `app/(superadmin)/dashboard/menu/client.tsx` | Add column, buttons, production modal |
| `app/(root)/checkout/_components/checkoutForm.tsx` | **Future** — pass `menuItemId` in cart items |

### To run after all changes:

```bash
npm run db:generate -- --name=add_production_stock
npm run db:push
```
