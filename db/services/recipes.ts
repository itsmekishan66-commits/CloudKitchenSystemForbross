// this is the code for menu recipe - recipes service layer
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { inventoryItems, recipeIngredients, recipes, type NewRecipe, type NewRecipeIngredient } from "@/db/schemas";

export type RecipeWithCost = {
  id: number;
  menuItemId: number;
  title: string;
  description: string | null;
  instructions: string | null;
  prepTime: string | null;
  cookTime: string | null;
  servings: number;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalCost: number;
  costPerServing: number;
  ingredients: Array<{
    id: number;
    inventoryItemId: number;
    inventoryItemName: string;
    quantity: string;
    unit: string;
    notes: string | null;
    pricePerUnit: string;
  }>;
};

function mapRecipeWithCost(row: Record<string, unknown>, ingredientRows: Record<string, unknown>[]): RecipeWithCost {
  const totalCost = ingredientRows.reduce((acc, ing) => {
    const qty = Number(ing.ing_quantity ?? 0);
    const price = Number(ing.ing_price_per_unit ?? 0);
    return acc + qty * price;
  }, 0);

  const servings = Number(row.servings ?? 1);

  return {
    id: Number(row.id),
    menuItemId: Number(row.menuItemId),
    title: String(row.title ?? ""),
    description: row.description ? String(row.description) : null,
    instructions: row.instructions ? String(row.instructions) : null,
    prepTime: row.prepTime ? String(row.prepTime) : null,
    cookTime: row.cookTime ? String(row.cookTime) : null,
    servings,
    image: row.image ? String(row.image) : null,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerServing: Math.round((totalCost / servings) * 100) / 100,
    ingredients: ingredientRows.map((ing) => ({
      id: Number(ing.id),
      inventoryItemId: Number(ing.inventoryItemId),
      inventoryItemName: String(ing.inventory_name ?? ""),
      quantity: String(ing.ing_quantity ?? "0"),
      unit: String(ing.unit ?? ""),
      notes: ing.notes ? String(ing.notes) : null,
      pricePerUnit: String(ing.ing_price_per_unit ?? "0"),
    })),
  };
}

export async function getRecipes(menuItemId?: number) {
  const conditions = [];
  if (menuItemId !== undefined) {
    conditions.push(eq(recipes.menuItemId, menuItemId));
  }

  const recipeRows = await db
    .select()
    .from(recipes)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(recipes.title));

  const results: RecipeWithCost[] = [];

  for (const recipe of recipeRows) {
    const ingredientRows = await db
      .select({
        id: recipeIngredients.id,
        recipeId: recipeIngredients.recipeId,
        inventoryItemId: recipeIngredients.inventoryItemId,
        ing_quantity: recipeIngredients.quantity,
        unit: recipeIngredients.unit,
        notes: recipeIngredients.notes,
        inventory_name: inventoryItems.name,
        ing_price_per_unit: inventoryItems.pricePerUnit,
      })
      .from(recipeIngredients)
      .innerJoin(inventoryItems, eq(recipeIngredients.inventoryItemId, inventoryItems.id))
      .where(eq(recipeIngredients.recipeId, recipe.id));

    results.push(mapRecipeWithCost(recipe as unknown as Record<string, unknown>, ingredientRows as unknown as Record<string, unknown>[]));
  }

  return results;
}

export async function getRecipeById(id: number) {
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!recipe) return null;

  const ingredientRows = await db
    .select({
      id: recipeIngredients.id,
      recipeId: recipeIngredients.recipeId,
      inventoryItemId: recipeIngredients.inventoryItemId,
      ing_quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
      notes: recipeIngredients.notes,
      inventory_name: inventoryItems.name,
      ing_price_per_unit: inventoryItems.pricePerUnit,
    })
    .from(recipeIngredients)
    .innerJoin(inventoryItems, eq(recipeIngredients.inventoryItemId, inventoryItems.id))
    .where(eq(recipeIngredients.recipeId, recipe.id));

  return mapRecipeWithCost(recipe as unknown as Record<string, unknown>, ingredientRows as unknown as Record<string, unknown>[]);
}

export async function createRecipe(
  data: NewRecipe & { ingredients: Array<Omit<NewRecipeIngredient, "recipeId">> }
) {
  const { ingredients, ...recipeData } = data;

  const result = await db.insert(recipes).values(recipeData);
  const recipeId = result[0].insertId;

  if (ingredients.length > 0) {
    await db.insert(recipeIngredients).values(
      ingredients.map((ing) => ({ ...ing, recipeId }))
    );
  }

  return recipeId;
}

export async function updateRecipe(
  id: number,
  data: Partial<NewRecipe> & { ingredients?: Array<{ id?: number } & Omit<NewRecipeIngredient, "recipeId">> }
) {
  const { ingredients, ...recipeData } = data;

  if (Object.keys(recipeData).length > 0) {
    await db.update(recipes).set(recipeData).where(eq(recipes.id, id));
  }

  if (ingredients) {
    const existingIngs = await db
      .select({ id: recipeIngredients.id })
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, id));

    const existingIds = new Set(existingIngs.map((i) => i.id));
    const incomingIds = new Set(ingredients.filter((i) => i.id).map((i) => i.id!));

    const toDelete = [...existingIds].filter((eid) => !incomingIds.has(eid));
    if (toDelete.length > 0) {
      for (const delId of toDelete) {
        await db.delete(recipeIngredients).where(eq(recipeIngredients.id, delId));
      }
    }

    for (const ing of ingredients) {
      if (ing.id && existingIds.has(ing.id)) {
        const { id: ingId, ...updateData } = ing;
        await db.update(recipeIngredients).set(updateData).where(eq(recipeIngredients.id, ingId));
      } else if (!ing.id) {
        await db.insert(recipeIngredients).values({
          inventoryItemId: ing.inventoryItemId,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
          recipeId: id,
        });
      }
    }
  }
}

export async function deleteRecipe(id: number) {
  await db.delete(recipes).where(eq(recipes.id, id));
}

export async function getInventoryItemsForSelect() {
  return db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      unit: inventoryItems.unit,
      pricePerUnit: inventoryItems.pricePerUnit,
    })
    .from(inventoryItems)
    .orderBy(asc(inventoryItems.name));
}
