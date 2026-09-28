import { NextResponse } from "next/server";
import { getOrderWithDetailsById } from "@/db/services/orders";
import { getSiteSettings } from "@/db/services/site-settings";
import { getActiveZones } from "@/db/services/delivery-zones";
import apiRequirePermissions from "@/lib/apiRequirePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { generateKitchenReceipt } from "@/lib/receipts/kitchen-receipt";
import { generateCustomerReceipt } from "@/lib/receipts/customer-receipt";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await apiRequirePermissions(PERMISSIONS.VIEW_ORDERS);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "kitchen";

    if (type !== "kitchen" && type !== "customer") {
      return NextResponse.json({ error: "Invalid receipt type" }, { status: 400 });
    }

    const order = await getOrderWithDetailsById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const site = await getSiteSettings();
    const company = {
      name: site?.siteName || "Cloud Kitchen",
      email: site?.contactEmail || "hello@example.com",
      phone: site?.contactPhone || "+977 9800000000",
      address: site?.location || "Biratnagar, Nepal",
    };

    const zones = await getActiveZones();
    const minOrderAmountForFreeDelivery = zones.length > 0 ? Number(zones[0].minOrderAmount ?? 0) : 0;

    let pdfBuffer: Buffer;

    if (type === "kitchen") {
      pdfBuffer = await generateKitchenReceipt({
        id: order.id,
        customerName: order.customerName,
        phone: order.phone ?? "",
        address: order.address ?? "",
        landmarkName: order.landmarkName ?? undefined,
        notes: order.notes ?? undefined,
        createdAt: order.createdAt,
        company,
        items: order.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          meta: item.meta as { addons?: { name: string; quantity?: number | null }[] } | undefined,
        })),
      });
    } else {
      pdfBuffer = await generateCustomerReceipt({
        id: order.id,
        customerName: order.customerName,
        phone: order.phone ?? "",
        address: order.address ?? "",
        paymentMethod: order.paymentMethod,
        total: order.total,
        deliveryCharge: order.deliveryCharge,
        discountAmount: order.discountAmount,
        previousDues: Number(order.previousDues ?? 0),
        userCreditBalance: Number(order.userCreditBalance ?? 0),
        isGuest: order.isGuest ?? false,
        landmarkName: order.landmarkName ?? undefined,
        createdAt: order.createdAt,
        company,
        minOrderAmountForFreeDelivery,
        items: order.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          meta: item.meta as
            | {
                addons?: { name: string; price: number }[];
                originalPrice?: number;
                discountPercent?: number;
              }
            | undefined,
        })),
      });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${type}-order-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate receipt", error);
    return NextResponse.json(
      { error: "Unable to generate receipt" },
      { status: 500 }
    );
  }
}
