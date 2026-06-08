import { SaleDB } from "src/models/sale.model";
import { mapSales, SaleSyncItem } from "../../../shared/types/sale.type";
import { delay } from "../../../shared/utils/promise.util";
import authService from "./auth.service";
import { AplikasirSaleDetailItem } from "src/models/aplikasir.model";

const BASE_URL = "https://app.aplikasir.com/a/app/sales_data?278311db8";

const PAGE_SIZE = 50;
export const sync = async ({ syncLatestOnly = false }: { syncLatestOnly?: boolean }) => {
    const cookie = await authService.getCookie();

    let start = 0;
    let total = 0;
    let allData: any[] = [];
    let currentData = start;

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

        const cleanedRows: SaleSyncItem[] = [];

        for (const row of rows) {
            currentData++;
            console.log('currentData', currentData)
            const detail = await syncDetail({ id: row.id, cookie });
            const mapped = mapSales(row, detail);
            cleanedRows.push(mapped)
        }

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

        const result = await SaleDB.bulkWrite(operations);

        meta.inserted += result.upsertedCount;
        meta.updated += result.modifiedCount;

        await new Promise((r) => setTimeout(r, 200));
    } while (!syncLatestOnly || allData.length < total);

    return {
        total: allData.length,
        ...meta,
    }
};
const DETAIL_URL = "https://app.aplikasir.com/a/app/history_detailajax";


export const syncDetail = async ({ id, cookie }: { id: string, cookie: string }) => {

    const detailResponse = await fetch(
        `${DETAIL_URL}/${id}?278311db8`,
        {
            method: "GET",
            headers: {
                accept: "application/json, text/javascript, */*; q=0.01",
                "x-requested-with": "XMLHttpRequest",
                cookie,
            },
        }
    );

    if (!detailResponse.ok) {
        throw new Error(`Detail HTTP ${detailResponse.status}`);
    }

    const detail = await detailResponse.json();

    return detail as AplikasirSaleDetailItem[];
}


export default {
    sync,

    syncDetail,
}