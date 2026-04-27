"use client";

import { Table, type TableColumnsType, type TablePaginationConfig } from "antd";
import { useMemo } from "react";
import Card from "@/components/common/card/Card";

export type DataTableColumn = {
  label: string;
  key: string;
};

type DataTableProps<T extends Record<string, unknown>> = {
  columns: DataTableColumn[];
  data: T[];
  renderers?: Partial<
    Record<string, (row: T, value: unknown) => React.ReactNode>
  >;
  stickyHeader?: boolean;
  emptyMessage?: string;
  enablePagination?: boolean;
  pageSize?: number;
};

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  renderers,
  stickyHeader = true,
  emptyMessage = "No data",
  enablePagination = true,
  pageSize = 5,
}: DataTableProps<T>) {
  const tableColumns = useMemo<TableColumnsType<T>>(
    () =>
      columns.map((column) => ({
        title: column.label,
        dataIndex: column.key,
        key: column.key,
        onHeaderCell: () => ({
          className: "px-6 py-4 text-xs font-semibold uppercase text-gray-500",
        }),
        onCell: () => ({
          className: "px-6 py-4 text-sm text-gray-700",
        }),
        render: (_value: unknown, row: T) => {
          const value = row[column.key];
          const cellRenderer = renderers?.[column.key];
          return cellRenderer ? cellRenderer(row, value) : String(value ?? "-");
        },
      })),
    [columns, renderers],
  );

  const pagination = useMemo<TablePaginationConfig | false>(
    () =>
      enablePagination
        ? {
            pageSize,
            showSizeChanger: false,
            hideOnSinglePage: true,
          }
        : false,
    [enablePagination, pageSize],
  );

  return (
    <Card
      variant="surface"
      padding="none"
      className="w-full !flex-col !items-stretch !justify-start"
    >
      <Table<T>
        className="w-full"
        rowKey={(row) =>
          String((row as { id?: string | number }).id ?? JSON.stringify(row))
        }
        columns={tableColumns}
        dataSource={data}
        tableLayout="fixed"
        pagination={pagination}
        sticky={stickyHeader}
        locale={{ emptyText: emptyMessage }}
        scroll={{ x: true }}
      />
    </Card>
  );
}
