import { Parser } from "@json2csv/plainjs";

export function generateCSV<T extends Record<string, unknown>>(data: T[]) {
    if (!data.length) {
        return "No data found";
    }

    // Prevent CSV/formula injection: prefix cells that start with a formula
    // trigger (=, +, -, @) with a single quote so spreadsheets treat them as text.
    const sanitized = data.map((row) => {
        const out: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
            if (typeof value === "string" && /^[-=+@]/.test(value)) {
                out[key] = `'${value}`;
            } else {
                out[key] = value;
            }
        }
        return out as T;
    });

    const parser = new Parser({});
    return parser.parse(sanitized);
}
