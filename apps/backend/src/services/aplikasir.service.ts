import { SaleModel } from "src/models/sale.model";
import { mapSales } from "../../../shared/types/sale.type";
import authService from "./auth.service";

const BASE_URL = "https://app.aplikasir.com/a/app/sales_data?278311db8";
const PAGE_SIZE = 50;
export const sync = async ({ syncLatestOnly = false }: { syncLatestOnly?: boolean }) => {
    const currentCookie = await authService.getCookie();
    const cookie = currentCookie?.cookie;

    if (!cookie) {
        throw new Error("Cookie tidak ditemukan")
    }

    let start = 0;
    let total = 0;
    let allData: any[] = [];

    const meta = {
        inserted: 0,
        updated: 0,
    };

    do {
        const body = new URLSearchParams({
            draw: "1",
            start: String(start),
            length: String(PAGE_SIZE),
            "search[value]": "",
            "search[regex]": "false",
        });

        const response = await fetch(BASE_URL, {
            method: "POST",
            headers: {
                accept: "application/json, text/javascript, */*; q=0.01",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "x-requested-with": "XMLHttpRequest",
                cookie,
            },
            body,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json: any = await response.json();


        total = json.recordsTotal;
        const rows = json.data || [];

        console.log(`Fetch ${start} → ${start + rows.length}`);

        allData.push(...rows);
        start += PAGE_SIZE;

        const cleanedRows = rows.map(mapSales);

        const operations = cleanedRows.map((item: any) => ({
            updateOne: {
                filter: {
                    externalId: item.externalId,
                },
                update: {
                    $set: item,
                },
                upsert: true,
            },
        }));

        const result = await SaleModel.bulkWrite(operations);

        meta.inserted += result.upsertedCount;
        meta.updated += result.modifiedCount;

        await new Promise((r) => setTimeout(r, 200));
    } while (!syncLatestOnly && allData.length < total);

    return {
        total: allData.length,
        ...meta,
    }
};




export default {
    sync,

}