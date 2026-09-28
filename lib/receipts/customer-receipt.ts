import PDFDocument from "pdfkit";

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface CustomerReceiptOrder {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: string;
  total: string;
  deliveryCharge: string;
  discountAmount?: string | null;
  previousDues?: number;
  userCreditBalance?: number;
  isGuest: boolean;
  landmarkName?: string;
  createdAt: Date | string;
  company: CompanyInfo;
  minOrderAmountForFreeDelivery?: number;
  items: {
    title: string;
    quantity: number;
    price: string;
    meta?: {
      addons?: { name: string; price: number }[];
      originalPrice?: number;
      discountPercent?: number;
    };
  }[];
}

const RECEIPT_WIDTH = 204;
const MARGIN = 8;
const CONTENT_WIDTH = RECEIPT_WIDTH - MARGIN * 2;

function drawLine(doc: PDFKit.PDFDocument, y: number) {
  doc.moveTo(MARGIN, y).lineTo(RECEIPT_WIDTH - MARGIN, y).strokeColor("#999").lineWidth(0.5).stroke();
}

export function generateCustomerReceipt(order: CustomerReceiptOrder): Promise<Buffer> {
  const doc = new PDFDocument({
    size: [RECEIPT_WIDTH, 600],
    margin: MARGIN,
    autoFirstPage: true,
  });

  const buffers: Buffer[] = [];
  doc.on("data", (b: Buffer) => buffers.push(b));

  const pdfPromise = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });

  const now = new Date(order.createdAt);
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  let y = MARGIN;

  // Restaurant header
  doc.fontSize(14).font("Helvetica-Bold").fillColor("black");
  doc.text(order.company.name, MARGIN, y, { width: CONTENT_WIDTH, align: "center" });
  y = doc.y + 3;

  doc.fontSize(6).font("Helvetica").fillColor("#555");
  doc.text(order.company.address, MARGIN, y, { width: CONTENT_WIDTH, align: "center" });
  y = doc.y + 1;
  doc.text(`Ph: ${order.company.phone}`, MARGIN, y, { width: CONTENT_WIDTH, align: "center" });
  y = doc.y + 1;
  doc.text(order.company.email, MARGIN, y, { width: CONTENT_WIDTH, align: "center" });
  y = doc.y + 3;

  drawLine(doc, y);
  y += 6;

  // Order info
  doc.fontSize(8).font("Helvetica-Bold").fillColor("black");
  doc.text(`Order #${order.id}`, MARGIN, y, { width: CONTENT_WIDTH });
  y = doc.y + 1;

  doc.fontSize(7).font("Helvetica").fillColor("#666");
  doc.text(`${dateStr}  ${timeStr}`, MARGIN, y, { width: CONTENT_WIDTH });
  y = doc.y + 4;

  // Customer info
  doc.fontSize(8).font("Helvetica-Bold").fillColor("black");
  doc.text(`Name: ${order.customerName}`, MARGIN, y, { width: CONTENT_WIDTH });
  y = doc.y + 1;

  doc.fontSize(7).font("Helvetica").fillColor("#333");
  doc.text(`Phone: ${order.phone}`, MARGIN, y, { width: CONTENT_WIDTH });
  y = doc.y + 1;

  doc.text(`Address: ${order.address}`, MARGIN, y, { width: CONTENT_WIDTH });
  y = doc.y + 1;

  if (order.landmarkName) {
    doc.text(`Area: ${order.landmarkName}`, MARGIN, y, { width: CONTENT_WIDTH });
    y = doc.y + 1;
  }

  y += 2;
  drawLine(doc, y);
  y += 6;

  // Items header
  doc.fontSize(8).font("Helvetica-Bold").fillColor("black");
  doc.text("ITEM", MARGIN, y, { width: CONTENT_WIDTH * 0.5 });
  doc.text("QTY", MARGIN + CONTENT_WIDTH * 0.5, y, { width: CONTENT_WIDTH * 0.2, align: "center" });
  doc.text("PRICE", MARGIN + CONTENT_WIDTH * 0.7, y, { width: CONTENT_WIDTH * 0.3, align: "right" });
  y = doc.y + 4;

  drawLine(doc, y);
  y += 4;

  // Items
  doc.font("Helvetica").fillColor("black");
  for (const item of order.items) {
    if (y > doc.page.height - 100) {
      doc.addPage({ size: [RECEIPT_WIDTH, 600] });
      y = MARGIN;
    }

    doc.fontSize(8).font("Helvetica-Bold");
    doc.text(item.title, MARGIN, y, { width: CONTENT_WIDTH * 0.5 });
    const titleEndY = doc.y;

    doc.fontSize(8).font("Helvetica");
    doc.text(String(item.quantity), MARGIN + CONTENT_WIDTH * 0.5, y, { width: CONTENT_WIDTH * 0.2, align: "center" });
    doc.text(`Rs.${(Number(item.price) * item.quantity).toFixed(2)}`, MARGIN + CONTENT_WIDTH * 0.7, y, { width: CONTENT_WIDTH * 0.3, align: "right" });

    y = titleEndY + 1;

    // Addons
    if (item.meta?.addons && item.meta.addons.length > 0) {
      doc.fontSize(6).font("Helvetica").fillColor("#555");
      for (const addon of item.meta.addons) {
        doc.text(`  + ${addon.name} (Rs.${Number(addon.price).toFixed(2)})`, MARGIN, y, { width: CONTENT_WIDTH });
        y = doc.y;
      }
      doc.fillColor("black");
    }

    y += 2;
  }

  y += 2;
  drawLine(doc, y);
  y += 6;

  // Totals
  const itemsSubtotal = order.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  doc.fontSize(7).font("Helvetica").fillColor("#333");
  doc.text("Items Subtotal", MARGIN, y, { width: CONTENT_WIDTH * 0.7 });
  doc.text(`Rs.${itemsSubtotal.toFixed(2)}`, MARGIN + CONTENT_WIDTH * 0.7, y, { width: CONTENT_WIDTH * 0.3, align: "right" });
  y = doc.y + 1;

  const hasFreeDelivery = order.minOrderAmountForFreeDelivery != null && Number(order.total) >= Number(order.minOrderAmountForFreeDelivery);

  if (hasFreeDelivery) {
    doc.fontSize(7).font("Helvetica").fillColor("#16a34a");
    doc.text("Free Delivery (above Rs." + order.minOrderAmountForFreeDelivery + ")", MARGIN, y, { width: CONTENT_WIDTH * 0.7 });
    doc.text("Rs.0.00", MARGIN + CONTENT_WIDTH * 0.7, y, { width: CONTENT_WIDTH * 0.3, align: "right" });
    y = doc.y + 1;
    doc.fillColor("#333");
  } else if (Number(order.deliveryCharge) > 0) {
    doc.text("Delivery Charge", MARGIN, y, { width: CONTENT_WIDTH * 0.7 });
    doc.text(`Rs.${Number(order.deliveryCharge).toFixed(2)}`, MARGIN + CONTENT_WIDTH * 0.7, y, { width: CONTENT_WIDTH * 0.3, align: "right" });
    y = doc.y + 1;
  }

  if (Number(order.discountAmount || 0) > 0) {
    doc.fillColor("#16a34a");
    doc.text("Coupon Discount", MARGIN, y, { width: CONTENT_WIDTH * 0.7 });
    doc.text(`- Rs.${Number(order.discountAmount).toFixed(2)}`, MARGIN + CONTENT_WIDTH * 0.7, y, { width: CONTENT_WIDTH * 0.3, align: "right" });
    y = doc.y + 1;
    doc.fillColor("#333");
  }

  if (Number(order.previousDues || 0) > 0) {
    doc.fillColor("#d97706");
    doc.text("Previous Dues", MARGIN, y, { width: CONTENT_WIDTH * 0.7 });
    doc.text(`Rs.${Number(order.previousDues).toFixed(2)}`, MARGIN + CONTENT_WIDTH * 0.7, y, { width: CONTENT_WIDTH * 0.3, align: "right" });
    y = doc.y + 1;
    doc.fillColor("#333");
  }

  const grandTotal = Number(order.total) + Number(order.previousDues || 0);

  y += 2;
  drawLine(doc, y);
  y += 4;

  doc.fontSize(9).font("Helvetica-Bold").fillColor("black");
  doc.text("TOTAL", MARGIN, y, { width: CONTENT_WIDTH * 0.7 });
  doc.text(`Rs.${grandTotal.toFixed(2)}`, MARGIN + CONTENT_WIDTH * 0.7, y, { width: CONTENT_WIDTH * 0.3, align: "right" });
  y = doc.y + 2;

  // Credit info
  if (!order.isGuest && Number(order.userCreditBalance || 0) > 0) {
    doc.fontSize(7).font("Helvetica").fillColor("#16a34a");
    doc.text(`Credit Applied: Rs.${Number(order.userCreditBalance).toFixed(2)}`, MARGIN, y, { width: CONTENT_WIDTH });
    y = doc.y + 2;
  }

  // Payment method
  doc.fontSize(7).font("Helvetica").fillColor("#333");
  doc.text(`Payment: ${order.paymentMethod === "COD" ? "Cash on Delivery" : "Online"}`, MARGIN, y, { width: CONTENT_WIDTH });
  y = doc.y + 6;

  drawLine(doc, y);
  y += 6;

  // Footer
  doc.fontSize(7).font("Helvetica").fillColor("#999");
  doc.text("Thank you for dining with us!", MARGIN, y, { width: CONTENT_WIDTH, align: "center" });
  y = doc.y + 2;
  doc.text("Visit us again!", MARGIN, y, { width: CONTENT_WIDTH, align: "center" });

  doc.end();
  return pdfPromise;
}
