import PDFDocument from "pdfkit";

function capitalize(str: string): string {
    return str
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (s) => s.toUpperCase());
}

interface Column {
    header: string;
    key: string;
    width: number;
}

function cleanData<T extends Record<string, unknown>>(data: T[]) {
    return data.map((row) => {
        const copy = { ...row };

        // Remove unwanted fields
        delete copy.createdAt;
        delete copy.updatedAt;
        delete copy._id;
        delete copy.id;
        delete copy.__v;

        return copy;
    });
}

function calculateColumns<T extends Record<string, unknown>>(data: T[], availableWidth: number):
    Column[] {
    const keys = Object.keys(data[0]);
    const minWidth = 60;

    // Equal width to guarantee fit
    const width = Math.floor(availableWidth / keys.length);
    return keys.map((key) => ({ header: capitalize(key), key, width: Math.max(minWidth, width) }));
}

export async function generatePDF<T extends Record<string, unknown>>(rawData: T[]) {
    const data = cleanData(rawData);
    const doc = new PDFDocument({
        size: "A4", layout: "landscape", // important
        margin: 30
    });
    const buffers: Buffer[] = [];

    doc.on("data", (b) => buffers.push(b));

    const pdfPromise = new Promise<Buffer>((resolve) => {
        doc.on("end", () => {
            resolve(Buffer.concat(buffers));
        });
    });

    if (!data.length) {
        doc.fontSize(16).text("No data available", { align: "center" });
        doc.end();
        return pdfPromise;
    }
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
    const columns = calculateColumns(data, pageWidth);
    const padding = 5;
    const headerHeight = 28;

    let y = doc.page.margins.top;
    function drawHeader() {
        let x = doc.page.margins.left;

        doc.rect(x, y, pageWidth, headerHeight).fill("#2563eb");
        doc.fillColor("white").font("Helvetica-Bold").fontSize(9);

        columns.forEach((col) => {
            doc.text(col.header, x + padding, y + 8, { width: col.width - padding * 2, align: "left" });
            x += col.width;
        });
        y += headerHeight;
    }

    function getRowHeight(row: Record<string, unknown>) {
        let maxHeight = 25;
        columns.forEach((col) => {
            const text = String(row[col.key] ?? "");
            const height = doc.heightOfString(text, { width: col.width - padding * 2 });
            maxHeight = Math.max(maxHeight, height + 10);
        });

        return maxHeight;
    }

    function addPageIfNeeded(rowHeight: number) {
        if (y + rowHeight > pageHeight) {
            addFooter();
            doc.addPage();
            y = doc.page.margins.top;
            drawHeader();
        }
    }

    function addFooter() {
        doc.fontSize(8).fillColor("gray").text(`Page ${doc.bufferedPageRange().count}`, 0,
            doc.page.height - 20, { width: doc.page.width, align: "center" });
    }

    // Title
    doc.fontSize(18).fillColor("black").font("Helvetica-Bold").text("Report", { align: "center" });
    doc.moveDown();
    y = doc.y;
    drawHeader();
    data.forEach((row, index) => {

        const rowHeight = getRowHeight(row);

        addPageIfNeeded(rowHeight);
        if (index % 2) { doc.rect(doc.page.margins.left, y, pageWidth, rowHeight).fill("#f8fafc"); }

        let x = doc.page.margins.left;
        doc.fillColor("black").fontSize(8).font("Helvetica");

        columns.forEach((col) => {
            const text = String(row[col.key] ?? "");

            doc.text(text, x + padding, y + padding, { width: col.width - padding * 2 });
            x += col.width;
        });
        y += rowHeight;
    });

    addFooter();
    doc.end();
    return pdfPromise;
}