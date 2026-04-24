"use client";

import { Input, Select, Row, Col } from "antd";
import { ReactNode } from "react";

type Option = {
  label: string;
  value: string;
};

interface TableFilterProps<T> {
  query: T;
  setQuery: (updater: (prev: T) => T) => void;

  // 🔍 search
  searchKey?: keyof T;
  searchPlaceholder?: string;

  // 🏷️ select filters
  filters?: {
    key: keyof T;
    placeholder: string;
    options: Option[];
  }[];

  // 🔧 extra (button, etc)
  extra?: ReactNode;
}

export default function TableFilter<T extends Record<string, any>>({
  query,
  setQuery,
  searchKey,
  searchPlaceholder = "Search...",
  filters = [],
  extra,
}: TableFilterProps<T>) {
  return (
    <Row gutter={12} style={{ marginBottom: 16 }}>
      {/* 🔍 SEARCH */}
      {searchKey && (
        <Col span={8}>
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            value={query[searchKey]}
            onChange={(e) =>
              setQuery((prev) => ({
                ...prev,
                [searchKey]: e.target.value,
                page: 1,
              }))
            }
          />
        </Col>
      )}

      {/* 🏷️ FILTERS */}
      {filters.map((f) => (
        <Col span={6} key={String(f.key)}>
          <Select
            placeholder={f.placeholder}
            allowClear
            style={{ width: "100%" }}
            value={query[f.key] || undefined}
            onChange={(value) =>
              setQuery((prev) => ({
                ...prev,
                [f.key]: value,
                page: 1,
              }))
            }
            options={f.options}
          />
        </Col>
      ))}

      {/* ➕ EXTRA */}
      {extra && <Col>{extra}</Col>}
    </Row>
  );
}