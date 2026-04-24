
import * as fs from "fs";
const BASE_URL = "https://app.aplikasir.com/a/app/sales_data?278311db8";

const HEADERS: Record<string, string> = {
  accept: "application/json, text/javascript, */*; q=0.01",
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  "x-requested-with": "XMLHttpRequest",

  // 🔥 isi dari browser kamu
  cookie:
    "sess=ikuce7nsbb0980upd6p3ftsj0l4l87ie; storename3=wedianimalcare; cf_clearance=6bVnm2qvpKaaV7GF_VkYwy7rixeLrWyx8wzwMzOFUgs-1777004972-1.2.1.1-_czqoQzl8IW.DY.j93oRvg0IB8sNeg9L6uuJFaczFt6xBLZObp2eW6XgwMzjaUaPvIVasd0UjNp4Y2oDIfBAzSBVtHXtrMLrQNPyUM.E3r4htlWdAPhoI2J_89L5x1WAcfNDfiTLSSPsamk643PYGkyoL3ptbH9vfADkZ24RF38rOiLn8DW33pRVVWe9noeqhVdqzwwKYlzBHZ4ZETOnEmwKXXDm00U32uq3IDEQMR53C15sykbp.lSZjLR6c7y0nM2ISMS3s2diPGUqgxI6gZXE905ZPwcjgQvJ8ypNQo2q4W7SNDhxU8QjY1q9ZCBP9ER61Ppjlb2VI9ujr0pz_A",
};

const PAGE_SIZE = 50;

async function fetchAllData() {
  let start = 0;
  let total = 0;
  let allData: any[] = [];

  do {
    const body = new URLSearchParams({
      draw: "1",
      start: String(start),
      length: String(PAGE_SIZE),
      "search[value]": "",
      "search[regex]": "false",
    });

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: HEADERS,
      body,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json: any = await res.json();

    total = json.recordsTotal;
    const rows = json.data || [];

    console.log(`Fetch ${start} → ${start + rows.length}`);

    allData.push(...rows);
    start += PAGE_SIZE;

    // optional delay
    await new Promise((r) => setTimeout(r, 300));
  } while (allData.length < total);

  return allData;
}

(async () => {
  try {
    const data = await fetchAllData();

    console.log("TOTAL:", data.length);

    fs.writeFileSync(
      "sales.json",
      JSON.stringify(data, null, 2), // 🔥 pretty JSON
      "utf-8"
    );

    console.log("✅ JSON saved: sales.json");
  } catch (err) {
    console.error(err);
  }
})();