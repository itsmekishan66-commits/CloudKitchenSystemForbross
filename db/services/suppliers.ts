import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  suppliers,
  supplierProducts,
  supplierSettlements,
  type NewSupplier,
  type NewSupplierProduct,
  type NewSupplierSettlement,
} from "@/db/schemas";

// ---- Suppliers ----
export async function getSuppliers() {
  return db.select().from(suppliers).orderBy(asc(suppliers.name));
}

export async function getSupplierById(id: number) {
  const [item] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return item ?? null;
}

export async function createSupplier(data: NewSupplier) {
  const result = await db.insert(suppliers).values(data);
  return result[0].insertId;
}

export async function updateSupplier(id: number, data: Partial<NewSupplier>) {
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number) {
  await db.delete(suppliers).where(eq(suppliers.id, id));
}

// ---- Supplier Products ----
export async function getSupplierProducts(supplierId: number) {
  return db
    .select()
    .from(supplierProducts)
    .where(eq(supplierProducts.supplierId, supplierId))
    .orderBy(asc(supplierProducts.name));
}

export async function getSupplierProductById(id: number) {
  const [item] = await db.select().from(supplierProducts).where(eq(supplierProducts.id, id)).limit(1);
  return item ?? null;
}

export async function createSupplierProduct(data: NewSupplierProduct) {
  const result = await db.insert(supplierProducts).values(data);
  return result[0].insertId;
}

export async function updateSupplierProduct(id: number, data: Partial<NewSupplierProduct>) {
  await db.update(supplierProducts).set(data).where(eq(supplierProducts.id, id));
}

export async function deleteSupplierProduct(id: number) {
  await db.delete(supplierProducts).where(eq(supplierProducts.id, id));
}

// ---- Supplier Settlements ----
export async function getSupplierSettlements(supplierId: number) {
  return db
    .select()
    .from(supplierSettlements)
    .where(eq(supplierSettlements.supplierId, supplierId))
    .orderBy(desc(supplierSettlements.settlementDate));
}

export async function createSupplierSettlement(data: NewSupplierSettlement) {
  const result = await db.insert(supplierSettlements).values(data);
  return result[0].insertId;
}

export async function updateSupplierSettlement(id: number, data: Partial<NewSupplierSettlement>) {
  await db.update(supplierSettlements).set(data).where(eq(supplierSettlements.id, id));
}

export async function deleteSupplierSettlement(id: number) {
  await db.delete(supplierSettlements).where(eq(supplierSettlements.id, id));
}

// ---- All supplier products with supplier name (for stock view) ----
export async function getAllSupplierProductsWithSupplier() {
  return db
    .select({
      productId: supplierProducts.id,
      supplierId: suppliers.id,
      supplierName: suppliers.name,
      productName: supplierProducts.name,
      category: supplierProducts.category,
      productType: supplierProducts.productType,
      purchaseUnit: supplierProducts.purchaseUnit,
      unitsPerPack: supplierProducts.unitsPerPack,
      sellUnit: supplierProducts.sellUnit,
      costPrice: supplierProducts.costPrice,
      quantity: supplierProducts.quantity,
      minStockLevel: supplierProducts.minStockLevel,
      margin: supplierProducts.margin,
      sellingPrice: supplierProducts.sellingPrice,
      menuItemId: supplierProducts.menuItemId,
      inventoryItemId: supplierProducts.inventoryItemId,
    })
    .from(supplierProducts)
    .leftJoin(suppliers, eq(supplierProducts.supplierId, suppliers.id))
    .orderBy(asc(suppliers.name), asc(supplierProducts.name));
}
