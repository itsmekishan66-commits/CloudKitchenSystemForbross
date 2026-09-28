import PDFDocument from "pdfkit";

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface KitchenReceiptOrder {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  landmarkName?: string;
  notes?: string;
  createdAt: Date | string;
  company: CompanyInfo;
  items: {
    title: string;
    quantity: number;
    meta?: {
      addons?: { name: string; quantity?: number | null }[];
    };
  }[];
}

const RECEIPT_WIDTH = 220;
const MARGIN = 10;
const CONTENT_WIDTH = RECEIPT_WIDTH - MARGIN * 2;

export function generateKitchenReceipt(order: KitchenReceiptOrder): Promise<Buffer> {
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

  // Header
  doc.fontSize(14).font("Helvetica-Bold").fillColor("black");
  doc.text(order.company.name, MARGIN, y, { width: CONTENT_WIDTH, align: "center" });
  y = doc.y + 4;

  doc.fontSize(9).font("Helvetica-Bold").fillColor("black");
  doc.text("KITCHEN ORDER", MARGIN, y, { width: CONTENT_WIDTH, align: "center" });
  y = doc.y + 4;

  doc.fontSize(8).font("Helvetica").fillColor("#666");
  doc.text(`${dateStr}  ${timeStr}`, MARGIN, y, { width: CONTENT_WIDTH, align: "center" });
  y = doc.y + 4;

  doc.moveTo(MARGIN, y).lineTo(RECEIPT_WIDTH - MARGIN, y).strokeColor("#999").lineWidth(0.5).stroke();
  y += 6;

  // Order info
  doc.fontSize(10).font("Helvetica-Bold").fillColor("black");
  doc.text(`Order #${order.id}`, MARGIN, y, { width: CONTENT_WIDTH });
  y = doc.y + 2;

  doc.fontSize(8).font("Helvetica").fillColor("#333");
  doc.text(`Customer: ${order.customerName}`, MARGIN, y, { width: CONTENT_WIDTH });
  y = doc.y + 2;

  doc.text(`Phone: ${order.phone}`, MARGIN, y, { width: CONTENT_WIDTH });
  y = doc.y + 2;

  if (order.landmarkName) {
    doc.text(`Area: ${order.landmarkName}`, MARGIN, y, { width: CONTENT_WIDTH });
    y = doc.y + 2;
  }

  y += 2;
  doc.moveTo(MARGIN, y).lineTo(RECEIPT_WIDTH - MARGIN, y).strokeColor("#999").lineWidth(0.5).stroke();
  y += 6;

  // Items header
  doc.fontSize(9).font("Helvetica-Bold").fillColor("black");
  doc.text("ITEMS", MARGIN, y, { width: CONTENT_WIDTH, align: "center" });
  y = doc.y + 4;

  doc.moveTo(MARGIN, y).lineTo(RECEIPT_WIDTH - MARGIN, y).strokeColor("#999").lineWidth(0.5).stroke();
  y += 4;

  // Items
  doc.font("Helvetica").fillColor("black");
  for (const item of order.items) {
    if (y > doc.page.height - 50) {
      doc.addPage({ size: [RECEIPT_WIDTH, 600] });
      y = MARGIN;
    }

    doc.fontSize(9).font("Helvetica-Bold");
    doc.text(`${item.quantity}x  ${item.title}`, MARGIN, y, { width: CONTENT_WIDTH });
    y = doc.y + 1;

    if (item.meta?.addons && item.meta.addons.length > 0) {
      doc.fontSize(7).font("Helvetica").fillColor("#555");
      for (const addon of item.meta.addons) {
        doc.text(`    + ${addon.name}`, MARGIN, y, { width: CONTENT_WIDTH });
        y = doc.y + 1;
      }
      doc.fillColor("black");
    }

    y += 2;
  }

  y += 2;
  doc.moveTo(MARGIN, y).lineTo(RECEIPT_WIDTH - MARGIN, y).strokeColor("#999").lineWidth(0.5).stroke();
  y += 6;

  // Notes
  if (order.notes) {
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#c00");
    doc.text("NOTES:", MARGIN, y, { width: CONTENT_WIDTH });
    y = doc.y + 2;
    doc.fontSize(8).font("Helvetica").fillColor("#c00");
    doc.text(order.notes, MARGIN, y, { width: CONTENT_WIDTH });
    y = doc.y + 6;
    doc.moveTo(MARGIN, y).lineTo(RECEIPT_WIDTH - MARGIN, y).strokeColor("#999").lineWidth(0.5).stroke();
    y += 6;
  }

  // Footer
  doc.fontSize(7).font("Helvetica").fillColor("#999");
  doc.text(`Total Items: ${order.items.reduce((s, i) => s + i.quantity, 0)}`, MARGIN, y, {
    width: CONTENT_WIDTH,
    align: "center",
  });

  doc.end();
  return pdfPromise;
}
