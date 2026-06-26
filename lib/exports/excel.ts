import * as XLSX from "xlsx";

export async function generateExcel<T extends Record<string, unknown>>(data: T[], sheetName: string) {
    const workbook = XLSX.utils.book_new();

    if (!data.length) {
        return XLSX.write(XLSX.utils.book_new(), {
            bookType: "xlsx",
            type: "buffer",
            bookSST: false,
        });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);

    const cols = Object.keys(data[0]);
    const colWidths = cols.map((key) => {
        const maxLen = Math.max(
            key.length,
            ...data.map((row) => String(row[key] ?? "").length),
        );
        return { wch: Math.min(maxLen + 3, 60) };
    });
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    return XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
        bookSST: false,
    });
}
