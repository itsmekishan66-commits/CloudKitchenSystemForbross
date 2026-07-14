import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cookedFoodStock, inventoryItems, menuItems, recipeIngredients, recipes, type NewCookedFoodStock } from "@/db/schemas";

export async function getCookedFoodStock() {
  return db
    .select({
      id: cookedFoodStock.id,
      menuItemId: cookedFoodStock.menuItemId,
      quantity: cookedFoodStock.quantity,
      minStockLevel: cookedFoodStock.minStockLevel,
      description: cookedFoodStock.description,
      createdAt: cookedFoodStock.createdAt,
      updatedAt: cookedFoodStock.updatedAt,
      foodName: menuItems.title,
    })
    .from(cookedFoodStock)
    .leftJoin(menuItems, eq(cookedFoodStock.menuItemId, menuItems.id))
    .orderBy(desc(cookedFoodStock.createdAt));
}

export async function getCookedFoodStockById(id: number) {
  const [item] = await db
    .select()
    .from(cookedFoodStock)
    .where(eq(cookedFoodStock.id, id))
    .limit(1);
  return item ?? null;
}

export async function createCookedFoodStock(item: NewCookedFoodStock) {
  const result = await db.insert(cookedFoodStock).values(item);
  return result[0].insertId;
}

export async function updateCookedFoodStock(id: number, item: Partial<NewCookedFoodStock>) {
  await db.update(cookedFoodStock).set(item).where(eq(cookedFoodStock.id, id));
}

export async function deleteCookedFoodStock(id: number) {
  await db.delete(cookedFoodStock).where(eq(cookedFoodStock.id, id));
}

export async function cookRecipe(recipeId: number, batchCount: number = 1) {
  const recipe = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  if (!recipe[0]) throw new Error("Recipe not found");

  const ingredients = await db
    .select({
      id: recipeIngredients.id,
      inventoryItemId: recipeIngredients.inventoryItemId,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
      inventoryName: inventoryItems.name,
      inventoryQty: inventoryItems.quantity,
    })
    .from(recipeIngredients)
    .innerJoin(inventoryItems, eq(recipeIngredients.inventoryItemId, inventoryItems.id))
    .where(eq(recipeIngredients.recipeId, recipeId));

  return db.transaction(async (tx) => {
    for (const ing of ingredients) {
      const needed = Number(ing.quantity) * batchCount;
      const available = Number(ing.inventoryQty);
      if (available < needed) {
        throw new Error(
          `Insufficient inventory: need ${needed} ${ing.unit} of ${ing.inventoryName}, but only ${available} available`
        );
      }
      await tx
        .update(inventoryItems)
        .set({ quantity: String(available - needed) })
        .where(eq(inventoryItems.id, ing.inventoryItemId));
    }

    const totalServings = (recipe[0].servings ?? 1) * batchCount;
    const menuItemId = recipe[0].menuItemId;

    const existing = await tx
      .select()
      .from(cookedFoodStock)
      .where(eq(cookedFoodStock.menuItemId, menuItemId))
      .limit(1);

    if (existing[0]) {
      const newQty = Number(existing[0].quantity) + totalServings;
      await tx
        .update(cookedFoodStock)
        .set({ quantity: String(newQty) })
        .where(eq(cookedFoodStock.id, existing[0].id));
    } else {
      await tx.insert(cookedFoodStock).values({
        menuItemId,
        quantity: String(totalServings),
        minStockLevel: "0",
        description: `Cooked from recipe: ${recipe[0].title}`,
      });
    }

    return { menuItemId, quantityProduced: totalServings };
  });
}

export async function deductCookedStock(menuItemId: number, quantity: number) {
  const [stock] = await db
    .select()
    .from(cookedFoodStock)
    .where(eq(cookedFoodStock.menuItemId, menuItemId))
    .limit(1);

  if (!stock) {
    throw new Error(`No cooked stock found for menu item #${menuItemId}`);
  }

  const current = Number(stock.quantity);
  if (current < quantity) {
    throw new Error(`Insufficient cooked stock for menu item #${menuItemId}: have ${current}, need ${quantity}`);
  }

  await db
    .update(cookedFoodStock)
    .set({ quantity: String(current - quantity) })
    .where(eq(cookedFoodStock.id, stock.id));
}

export async function restoreCookedStock(menuItemId: number, quantity: number) {
  const [stock] = await db
    .select()
    .from(cookedFoodStock)
    .where(eq(cookedFoodStock.menuItemId, menuItemId))
    .limit(1);

  if (!stock) return;

  await db
    .update(cookedFoodStock)
    .set({ quantity: String(Number(stock.quantity) + quantity) })
    .where(eq(cookedFoodStock.id, stock.id));
}
