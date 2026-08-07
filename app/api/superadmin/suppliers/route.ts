import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/cache-tags";
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
  getSupplierSettlementById,
  createSupplierSettlement,
  deleteSupplierSettlement,
  updateSupplierSettlement,
} from "@/db/services/suppliers";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "@/db/services/menu-items";
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/db/services/inventory";
import { createActivityLog } from "@/db/services/activity-logs";
import { createDue, updateDue, createTransaction, getTransactionByRef, updateTransaction, deleteTransaction } from "@/db/services/payments";
// import { getDues} from "@/db/services/payments";
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

function mapPaymentMethod(method: string): "cash" | "bank" | "esewa" | "khalti" | "fonepay" | "card" {
  const m = (method || "").toLowerCase().trim();
  if (m.includes("khalti")) return "khalti";
  if (m.includes("esewa")) return "esewa";
  if (m.includes("fonepay")) return "fonepay";
  if (m.includes("card")) return "card";
  if (m.includes("bank") || m.includes("net")) return "bank";
  return "cash";
}

async function recordSupplierPaymentTransaction(
  supplierName: string,
  amount: number,
  paymentMethod: string,
  settlementId: number | null,
  notes: string | null,
  accountId: string | null = null
) {
  const mappedMethod = mapPaymentMethod(paymentMethod);
  await createTransaction({
    id: uuidv4(),
    type: mappedMethod === "cash" ? "cash_paid" : "online_paid",
    amount: amount.toFixed(2),
    paidTo: supplierName,
    paymentMethod: mappedMethod,
    transactionId: settlementId ? `SUPPLIER-SETTLE-${settlementId}` : null,
    accountId: accountId || null,
    notes: notes || null,
  });
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

      const conversionUnit = cleanText(data.conversionUnit);
      const conversionValue = Number(data.conversionValue) || 1;

      let menuItemId: number | null = null;
      let inventoryItemId: number | null = null;

      const createInvItem = (qtyPacks: number) => {
        const totalPieces = qtyPacks * unitsPerPack;
        const useConversion = conversionUnit && conversionValue > 0;
        const invUnit = useConversion ? conversionUnit : (cleanText(data.sellUnit) || "pcs");
        const invQuantity = useConversion ? (totalPieces * conversionValue) : totalPieces;
        const minPacks = Number(data.minStockLevel) || 0;
        const minInv = useConversion ? (minPacks * unitsPerPack * conversionValue) : (minPacks * unitsPerPack);
        return {
          name,
          category: cleanText(data.category) || "Supplier",
          quantity: invQuantity.toString(),
          unit: invUnit,
          minStockLevel: minInv.toString(),
          pricePerUnit: useConversion ? (costPerPiece / conversionValue).toFixed(4) : costPerPiece.toFixed(2),
          conversionUnit: useConversion ? conversionUnit : null,
          conversionValue: useConversion ? conversionValue.toString() : null,
          kitchenId: null,
        };
      };

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
        const qtyPacks = Number(data.quantity) || 0;
        inventoryItemId = await createInventoryItem(createInvItem(qtyPacks));
      }

      if (data.productType === "inventory") {
        const qtyPacks = Number(data.quantity) || 0;
        inventoryItemId = await createInventoryItem(createInvItem(qtyPacks));
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
        conversionUnit: conversionUnit || null,
        conversionValue: conversionValue > 0 ? conversionValue.toString() : "1",
        inventoryItemId: inventoryItemId ?? undefined,
      });

      await createActivityLog({
        userId: user.id,
        action: `Created supplier product: ${name} (${data.productType})`,
        entityType: "supplier_product",
        entityId: productId,
      });

      revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
      return NextResponse.json({ productId }, { status: 201 });
    }

    if (actionType === "settlement") {
      const data = body as NewSupplierSettlement & { paidNow?: string; paymentAccountId?: string | null };
      if (!supplierId || !data.amount) {
        return NextResponse.json({ error: "Supplier ID and amount are required" }, { status: 400 });
      }
      const sid = Number(supplierId);
      const paidNow = data.type === "purchase" ? (Number(data.paidNow) || 0) : 0;
      const supplier = await getSupplierById(sid);

      const settlementId = await createSupplierSettlement({
        supplierId: sid,
        amount: data.amount.toString(),
        type: data.type,
        paymentMethod: data.type === "payment" ? (cleanText(data.paymentMethod) || null) : null,
        transactionId: data.type === "payment" ? (cleanText(data.transactionId) || null) : null,
        notes: cleanText(data.notes) || null,
      });

      if (supplier && data.type === "payment") {
        await recordSupplierPaymentTransaction(
          supplier.name,
          Number(data.amount),
          data.paymentMethod || "",
          settlementId,
          cleanText(data.notes) || null,
          data.paymentAccountId || null
        );
      }

      let partialSettlementId: number | null = null;
      if (paidNow > 0) {
        partialSettlementId = await createSupplierSettlement({
          supplierId: sid,
          amount: paidNow.toString(),
          type: "payment",
          paymentMethod: cleanText(data.paymentMethod) || null,
          transactionId: null,
          notes: "Partial payment on purchase",
        });
        if (supplier) {
          await recordSupplierPaymentTransaction(
            supplier.name,
            paidNow,
            data.paymentMethod || "",
            partialSettlementId,
            "Partial payment on purchase",
            data.paymentAccountId || null
          );
        }
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

      revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
      revalidateTag(CACHE_TAGS.TRIAL_BALANCE, "max");
      revalidateTag(CACHE_TAGS.INCOME_STATEMENT, "max");
      revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
      revalidateTag(CACHE_TAGS.CASH_FLOW, "max");
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

    revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
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
      const marginPercent = Number(body.margin) || Number(existing.margin) || 0;
      const sellingPricePerPiece = costPerPiece * (1 + marginPercent / 100);

      const conversionUnit = body.conversionUnit ?? existing.conversionUnit;
      const conversionValue = Number(body.conversionValue ?? existing.conversionValue) || 1;

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
        conversionUnit: conversionUnit || null,
        conversionValue: conversionValue > 0 ? conversionValue.toString() : "1",
      });

      if (existing.menuItemId) {
        await updateMenuItem(existing.menuItemId, {
          price: sellingPricePerPiece.toFixed(2),
          title: body.name,
        });
      }

      if (existing.inventoryItemId) {
        const qtyPacks = Number(body.quantity) || Number(existing.quantity) || 0;
        const minPacks = Number(body.minStockLevel) || Number(existing.minStockLevel) || 0;
        const useConversion = conversionUnit && conversionValue > 0;
        const invUnit = useConversion ? conversionUnit : (body.sellUnit || existing.sellUnit || "pcs");
        const invQuantity = useConversion ? (qtyPacks * unitsPerPack * conversionValue) : (qtyPacks * unitsPerPack);
        const minInv = useConversion ? (minPacks * unitsPerPack * conversionValue) : (minPacks * unitsPerPack);
        await updateInventoryItem(existing.inventoryItemId, {
          name: body.name,
          quantity: invQuantity.toString(),
          unit: invUnit,
          minStockLevel: minInv.toString(),
          pricePerUnit: useConversion ? (costPerPiece / conversionValue).toFixed(4) : costPerPiece.toFixed(2),
          conversionUnit: useConversion ? conversionUnit : null,
          conversionValue: useConversion ? conversionValue.toString() : null,
        });
      }

      revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
      return NextResponse.json({ ok: true });
    }

    if (type === "settlement") {
      const updates: Record<string, string | null> = {};
      if (body.amount) updates.amount = body.amount.toString();
      if (body.paymentMethod !== undefined) updates.paymentMethod = cleanText(body.paymentMethod) || null;
      if (body.transactionId !== undefined) updates.transactionId = cleanText(body.transactionId) || null;
      if (body.notes !== undefined) updates.notes = cleanText(body.notes) || null;
      if (body.settlementType) updates.type = body.settlementType;

      const supplierId = body.supplierId;
      if (!supplierId) {
        return NextResponse.json({ error: "supplierId is required for settlement updates" }, { status: 400 });
      }

      const existing = await getSupplierSettlementById(Number(id));
      await updateSupplierSettlement(Number(id), updates);
      await syncSupplierDue(Number(supplierId));

      const isPayment = (updates.type ?? existing?.type) === "payment";
      const linkedRef = `SUPPLIER-SETTLE-${id}`;
      const linkedTx = await getTransactionByRef(linkedRef);
      if (isPayment) {
        const newAmount = Number(updates.amount ?? existing?.amount) || 0;
        const method = mapPaymentMethod(cleanText(updates.paymentMethod ?? existing?.paymentMethod) || "cash");
        const accountId = body.paymentAccountId !== undefined ? (cleanText(body.paymentAccountId) || null) : null;
        if (linkedTx) {
          await updateTransaction(linkedTx.id, {
            type: method === "cash" ? "cash_paid" : "online_paid",
            amount: newAmount.toFixed(2),
            paidTo: existing?.supplierId ? (await getSupplierById(existing.supplierId))?.name || null : null,
            paymentMethod: method,
            accountId,
            notes: updates.notes !== undefined ? updates.notes : (existing?.notes ?? null),
          });
        } else {
          const supplier = await getSupplierById(Number(supplierId));
          await recordSupplierPaymentTransaction(
            supplier?.name || "Supplier",
            newAmount,
            cleanText(updates.paymentMethod ?? existing?.paymentMethod) || "cash",
            Number(id),
            updates.notes !== undefined ? updates.notes : (existing?.notes ?? null),
            accountId
          );
        }
      } else if (linkedTx) {
        await deleteTransaction(linkedTx.id);
      }

      revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
      revalidateTag(CACHE_TAGS.TRIAL_BALANCE, "max");
      revalidateTag(CACHE_TAGS.INCOME_STATEMENT, "max");
      revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
      revalidateTag(CACHE_TAGS.CASH_FLOW, "max");
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

    revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
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
      revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
      return NextResponse.json({ ok: true });
    }

    if (type === "settlement") {
      const settlementSupplierId = Number(searchParams.get("supplierId"));
      const existing = await getSupplierSettlementById(id);
      await deleteSupplierSettlement(id);
      if (existing?.type === "payment") {
        const linkedTx = await getTransactionByRef(`SUPPLIER-SETTLE-${id}`);
        if (linkedTx) await deleteTransaction(linkedTx.id);
      }
      if (Number.isInteger(settlementSupplierId)) {
        await syncSupplierDue(settlementSupplierId);
      }
      revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
      revalidateTag(CACHE_TAGS.TRIAL_BALANCE, "max");
      revalidateTag(CACHE_TAGS.INCOME_STATEMENT, "max");
      revalidateTag(CACHE_TAGS.BALANCE_SHEET, "max");
      revalidateTag(CACHE_TAGS.CASH_FLOW, "max");
      return NextResponse.json({ ok: true });
    }

    const supplier = await getSupplierById(id);
    await deleteSupplier(id);
    if (supplier) {
      const existingDues = await db.select().from(dues).where(eq(dues.personName, supplier.name));
      const dueRecord = existingDues.find((d) => d.role === "supplier");
      if (dueRecord) await db.delete(dues).where(eq(dues.id, dueRecord.id));
    }
    revalidateTag(CACHE_TAGS.ACCOUNTING_OVERVIEW, "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete", error);
    return NextResponse.json({ error: "Unable to delete" }, { status: 500 });
  }
}
