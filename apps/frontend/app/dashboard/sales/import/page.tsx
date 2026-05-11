"use client";

import { useSyncSales } from "@/api/sale.api";
import { Button, Card, Flex } from "antd";

export default function ScrapeSalesPage() {
  const syncAll = useSyncSales({});
  const syncLatest = useSyncSales({ syncLatestOnly: true });

  return (
    <Card
      title="Sync / Scrape Sales Data"
      style={{
        marginBottom: 24,
      }}
    >
      <Flex vertical gap={12}>
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
      </Flex>
    </Card>
  );
}
