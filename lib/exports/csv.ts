import { Parser } from "@json2csv/plainjs";

export function generateCSV<T extends Record<string, unknown>>(data: T[]) {
    if (!data.length) {
        return "No data found";
    }
    const parser = new Parser({});
    return parser.parse(data);
}
