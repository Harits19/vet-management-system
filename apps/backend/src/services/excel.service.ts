import * as XLSX from "xlsx";

export function readExcelFile<T>(file: Buffer) {
    const workbook = XLSX.read(file, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: T[] = XLSX.utils.sheet_to_json(sheet);

    return data;
}
