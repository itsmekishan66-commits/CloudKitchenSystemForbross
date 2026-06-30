import { NextResponse } from "next/server";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts,
  getSupplierProductById,
  createSupplierProduct,
  updateSupplierProduct,
  deleteSupplierProduct,
  getSupplierSettlements,
  createSupplierSettlement,
  deleteSupplierSettlement,
  updateSupplierSettlement,
} from "@/db/services/suppliers";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "@/db/services/menu-items";
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/db/services/inventory";
import { createActivityLog } from "@/db/services/activity-logs";
import { getDues, createDue, updateDue } from "@/db/services/payments";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { dues, type NewSupplier, type NewSupplierProduct, type NewSupplierSettlement } from "@/db/schemas";
import { db } from "@/db";

export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function syncSupplierDue(supplierId: number) {
  const supplier = await getSupplierById(supplierId);
  if (!supplier) return;
  const settlements = await getSupplierSettlements(supplierId);
  let totalPurchases = 0, totalPayments = 0;
  for (const s of settlements) {
    const amt = Number(s.amount);
    if (s.type === "purchase") totalPurchases += amt;
    else totalPayments += amt;
  }
  const remaining = totalPurchases - totalPayments;
  const status: "pending" | "partial" | "paid" = remaining <= 0 ? "paid" : totalPayments > 0 ? "partial" : "pending";

  const existingDues = await db.select().from(dues).where(eq(dues.personName, supplier.name));
  const dueRecord = existingDues.find((d) => d.role === "supplier");

  if (dueRecord) {
    await updateDue(dueRecord.id, {
      totalDue: totalPurchases.toFixed(2),
      paid: totalPayments.toFixed(2),
      remaining: Math.max(0, remaining).toFixed(2),
      status,
    });
  } else {
    await createDue({
      id: uuidv4(),
      personName: supplier.name,
      role: "supplier",
      totalDue: totalPurchases.toFixed(2),
      paid: totalPayments.toFixed(2),
      remaining: Math.max(0, remaining).toFixed(2),
      status,
    });
  }
}

// ---- SUPPLIERS CRUD ----

export async function GET(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_SUPPLIERS);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (id && type === "product") {
      const item = await getSupplierProductById(Number(id));
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ item });
    }

    if (id && type === "settlement") {
      const settlements = await getSupplierSettlements(Number(id));
      return NextResponse.json({ settlements });
    }

    if (id && type === "products") {
      const products = await getSupplierProducts(Number(id));
      return NextResponse.json({ products });
    }

    if (id) {
      const supplier = await getSupplierById(Number(id));
      if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ supplier });
    }

    const suppliers = await getSuppliers();
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Failed to load suppliers", error);
    return NextResponse.json({ error: "Unable to load suppliers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.CREATE_SUPPLIERS);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { type, requestType, supplierId } = body;
    const actionType = requestType || type;

    if (actionType === "product") {
      const data = body as NewSupplierProduct;
      const name = cleanText(data.name);
      if (!name) return NextResponse.json({ error: "Product name is required" }, { status: 400 });
      if (!supplierId) return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });

      const unitsPerPack = Number(data.unitsPerPack) || 1;
      const costPricePerPack = Number(data.costPrice) || 0;
      const costPerPiece = costPricePerPack / unitsPerPack;
      const marginPercent = Number(data.margin) || 0;
      const sellingPricePerPiece = costPerPiece * (1 + marginPercent / 100);

      let menuItemId: number | null = null;
      let inventoryItemId: number | null = null;

      if (data.productType === "direct_sellable") {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
        menuItemId = await createMenuItem({
          title: name,
          slug,
          price: sellingPricePerPiece.toFixed(2),
          categoryId: null,
          description: `Supplied by supplier #${supplierId} | ${cleanText(data.purchaseUnit) || "Carton"} × ${unitsPerPack} ${cleanText(data.sellUnit) || "Piece"}(s) | Cost/Pack: Rs.${costPricePerPack.toFixed(2)}`,
          isAvailable: true,
        });
        const minPacksDir = Number(data.minStockLevel) || 0;
        const qtyPacks = Number(data.quantity) || 0;
        const totalPieces = qtyPacks * unitsPerPack;
        inventoryItemId = await createInventoryItem({
          name,
          category: cleanText(data.category) || "Supplier",
          quantity: totalPieces.toString(),
          unit: cleanText(data.sellUnit) || "pcs",
          minStockLevel: (minPacksDir * unitsPerPack).toString(),
          pricePerUnit: costPerPiece.toFixed(2),
          kitchenId: null,
        });
      }

      if (data.productType === "inventory") {
        const qtyPacks = Number(data.quantity) || 0;
        const totalPieces = qtyPacks * unitsPerPack;
        const minPacks = Number(data.minStockLevel) || 0;
        inventoryItemId = await createInventoryItem({
          name,
          category: cleanText(data.category) || "Supplier",
          quantity: totalPieces.toString(),
          unit: cleanText(data.sellUnit) || "pcs",
          minStockLevel: (minPacks * unitsPerPack).toString(),
          pricePerUnit: costPerPiece.toFixed(2),
          kitchenId: null,
        });
      }

      const productId = await createSupplierProduct({
        supplierId: Number(supplierId),
        name,
        category: cleanText(data.category) || "Other",
        purchaseUnit: cleanText(data.purchaseUnit) || "Carton",
        unitsPerPack,
        sellUnit: cleanText(data.sellUnit) || "Piece",
        productType: data.productType,
        costPrice: costPricePerPack.toFixed(2),
        margin: marginPercent.toFixed(2),
        sellingPrice: sellingPricePerPiece.toFixed(2),
        menuItemId: menuItemId ?? undefined,
        quantity: data.quantity?.toString() || "0",
        unit: cleanText(data.unit) || "pcs",
        minStockLevel: data.minStockLevel?.toString() || "0",
        inventoryItemId: inventoryItemId ?? undefined,
      });

      await createActivityLog({
        userId: user.id,
        action: `Created supplier product: ${name} (${data.productType})`,
        entityType: "supplier_product",
        entityId: productId,
      });

      return NextResponse.json({ productId }, { status: 201 });
    }

    if (actionType === "settlement") {
      const data = body as NewSupplierSettlement & { paidNow?: string };
      if (!supplierId || !data.amount) {
        return NextResponse.json({ error: "Supplier ID and amount are required" }, { status: 400 });
      }
      const sid = Number(supplierId);
      const paidNow = data.type === "purchase" ? (Number(data.paidNow) || 0) : 0;

      const settlementId = await createSupplierSettlement({
        supplierId: sid,
        amount: data.amount.toString(),
        type: data.type,
        paymentMethod: data.type === "payment" ? (cleanText(data.paymentMethod) || null) : null,
        transactionId: data.type === "payment" ? (cleanText(data.transactionId) || null) : null,
        notes: cleanText(data.notes) || null,
      });

      if (paidNow > 0) {
        await createSupplierSettlement({
          supplierId: sid,
          amount: paidNow.toString(),
          type: "payment",
          paymentMethod: cleanText(data.paymentMethod) || null,
          transactionId: cleanText(data.transactionId) || null,
          notes: "Partial payment on purchase",
        });
      }

      await syncSupplierDue(sid);

      await createActivityLog({
        userId: user.id,
        action: paidNow > 0
          ? `Added purchase of ${data.amount} with partial payment ${paidNow} for supplier #${supplierId}`
          : `Added ${data.type} of ${data.amount} for supplier #${supplierId}`,
        entityType: "supplier_settlement",
        entityId: settlementId,
      });

      return NextResponse.json({ settlementId }, { status: 201 });
    }

    const data = body as NewSupplier;
    const name = cleanText(data.name);
    if (!name) return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });

    const supplierIdResult = await createSupplier({
      ...data,
      name,
      contactPerson: cleanText(data.contactPerson) || null,
      email: cleanText(data.email) || null,
      phone: cleanText(data.phone) || null,
      address: cleanText(data.address) || null,
      vatNumber: cleanText(data.vatNumber) || null,
      paymentTerms: cleanText(data.paymentTerms) || null,
      notes: cleanText(data.notes) || null,
    });

    await createActivityLog({
      userId: user.id,
      action: `Created supplier: ${name}`,
      entityType: "supplier",
      entityId: supplierIdResult,
    });

    return NextResponse.json({ supplierId: supplierIdResult }, { status: 201 });
  } catch (error) {
    console.error("Failed to create", error);
    return NextResponse.json({ error: "Unable to create" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.UPDATE_SUPPLIERS);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const { type, id } = body;

    if (!id) return NextResponse.json({ error: "Valid id is required" }, { status: 400 });

    if (type === "product") {
      const existing = await getSupplierProductById(Number(id));
      if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

      const unitsPerPack = Number(body.unitsPerPack) || Number(existing.unitsPerPack) || 1;
      const costPricePerPack = Number(body.costPrice) || Number(existing.costPrice) || 0;
      const costPerPiece = costPricePerPack / unitsPerPack;
      const marginPercent = Number(body.margin) ?? Number(existing.margin) ?? 0;
      const sellingPricePerPiece = costPerPiece * (1 + marginPercent / 100);

      await updateSupplierProduct(Number(id), {
        name: body.name,
        category: body.category,
        purchaseUnit: body.purchaseUnit,
        unitsPerPack,
        sellUnit: body.sellUnit,
        costPrice: costPricePerPack.toFixed(2),
        margin: marginPercent.toFixed(2),
        sellingPrice: sellingPricePerPiece.toFixed(2),
        quantity: body.quantity?.toString(),
        unit: body.unit,
        minStockLevel: body.minStockLevel?.toString(),
      });

      if (existing.menuItemId) {
        await updateMenuItem(existing.menuItemId, {
          price: sellingPricePerPiece.toFixed(2),
          title: body.name,
        });
      }

      if (existing.inventoryItemId) {
        const qtyPacks = Number(body.quantity) || 0;
        const minPacks = Number(body.minStockLevel) || 0;
        await updateInventoryItem(existing.inventoryItemId, {
          name: body.name,
          quantity: (qtyPacks * unitsPerPack).toString(),
          unit: body.sellUnit || "pcs",
          minStockLevel: (minPacks * unitsPerPack).toString(),
          pricePerUnit: costPerPiece.toFixed(2),
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (type === "settlement") {
      const updates: Record<string, any> = {};
      if (body.amount) updates.amount = body.amount.toString();
      if (body.paymentMethod !== undefined) updates.paymentMethod = cleanText(body.paymentMethod) || null;
      if (body.transactionId !== undefined) updates.transactionId = cleanText(body.transactionId) || null;
      if (body.notes !== undefined) updates.notes = cleanText(body.notes) || null;
      if (body.settlementType) updates.type = body.settlementType;

      await updateSupplierSettlement(Number(id), updates);

      // Find supplierId to resync dues
      const existingSettlements = await getSupplierSettlements(0); // we need a dedicated getter
      // Instead, get supplierId from the request
      if (body.supplierId) {
        await syncSupplierDue(Number(body.supplierId));
      }

      return NextResponse.json({ ok: true });
    }

    await updateSupplier(Number(id), {
      name: body.name,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      address: body.address,
      vatNumber: body.vatNumber,
      paymentTerms: body.paymentTerms,
      status: body.status,
      notes: body.notes,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update", error);
    return NextResponse.json({ error: "Unable to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.DELETE_SUPPLIERS);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const type = searchParams.get("type");

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    if (type === "product") {
      const existing = await getSupplierProductById(id);
      if (existing) {
        if (existing.menuItemId) await deleteMenuItem(existing.menuItemId);
        if (existing.inventoryItemId) await deleteInventoryItem(existing.inventoryItemId);
        await deleteSupplierProduct(id);
      }
      return NextResponse.json({ ok: true });
    }

    if (type === "settlement") {
      const settlementSupplierId = Number(searchParams.get("supplierId"));
      await deleteSupplierSettlement(id);
      if (Number.isInteger(settlementSupplierId)) {
        await syncSupplierDue(settlementSupplierId);
      }
      return NextResponse.json({ ok: true });
    }

    const supplier = await getSupplierById(id);
    await deleteSupplier(id);
    if (supplier) {
      const existingDues = await db.select().from(dues).where(eq(dues.personName, supplier.name));
      const dueRecord = existingDues.find((d) => d.role === "supplier");
      if (dueRecord) await db.delete(dues).where(eq(dues.id, dueRecord.id));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete", error);
    return NextResponse.json({ error: "Unable to delete" }, { status: 500 });
  }
}
