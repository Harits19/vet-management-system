"use client";

import { useSyncSales } from "@/api/sale.api";
import { Button, Card } from "antd";

export default function ScrapeSalesPage() {
  const syncAll = useSyncSales({});
  const syncLatest = useSyncSales({ syncLatestOnly: true });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Card title="Sync / Scrape Sales Data" style={{ marginBottom: 24 }}>
        <Button
          type="primary"
          onClick={() => syncAll.mutate({})}
          loading={syncAll.loading}
          block
        >
          🚀 Sync Data
        </Button>
        <Button
          type="primary"
          onClick={() =>
            syncLatest.mutate({
              body: {
                syncLatestOnly: true,
              },
            })
          }
          loading={syncLatest.loading}
          block
        >
          🚀 Sync Latest Data Only
        </Button>
      </Card>
    </div>
  );
}
