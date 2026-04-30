"use client";

import { Table, type TableColumnsType, type TablePaginationConfig } from "antd";
import { useMemo } from "react";
import Card from "@/components/common/card/Card";
import { cn } from "@/lib/utils";

export type DataTableColumn = {
  label: string;
  key: string;
};

export type DataTableVisualVariant = "default" | "employee";

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
  /** Ant Design pagination: allow changing page size (e.g. 10 / 20 / 50). */
  showPaginationSizeChanger?: boolean;
  paginationPageSizeOptions?: number[];
  /** When set, that row gets a light background (notification deep-link). */
  highlightRowId?: string | null;
  /**
   * When `true` (default), pagination is hidden if everything fits one page.
   * Set `false` to always show the pager (e.g. work tracking).
   */
  paginationHideOnSinglePage?: boolean;
  /** Match employee task table: gray header row, body typography, row hover. */
  visualVariant?: DataTableVisualVariant;
  cardClassName?: string;
};

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  renderers,
  stickyHeader = true,
  emptyMessage = "No data",
  enablePagination = true,
  pageSize = 5,
  showPaginationSizeChanger = false,
  paginationPageSizeOptions = [10, 20, 50],
  highlightRowId = null,
  paginationHideOnSinglePage = true,
  visualVariant = "default",
  cardClassName,
}: DataTableProps<T>) {
  const tableColumns = useMemo<TableColumnsType<T>>(
    () =>
      columns.map((column) => ({
        title: column.label,
        dataIndex: column.key,
        key: column.key,
        onHeaderCell: () => ({
          className:
            visualVariant === "employee"
              ? "px-4 py-4 text-sm font-semibold text-gray-800 !bg-gray-50/95 border-b border-gray-200"
              : "px-6 py-4 text-xs font-semibold uppercase text-gray-500",
        }),
        onCell: () => ({
          className:
            visualVariant === "employee"
              ? "px-4 py-4 align-middle text-sm text-gray-800 border-b border-gray-100"
              : "px-6 py-4 align-top text-sm text-gray-700 whitespace-normal break-words",
        }),
        render: (_value: unknown, row: T) => {
          const value = row[column.key];
          const cellRenderer = renderers?.[column.key];
          return cellRenderer ? cellRenderer(row, value) : String(value ?? "-");
        },
      })),
    [columns, renderers, visualVariant],
  );

  const pagination = useMemo<TablePaginationConfig | false>(
    () =>
      enablePagination
        ? {
            pageSize,
            showSizeChanger: showPaginationSizeChanger,
            pageSizeOptions: paginationPageSizeOptions.map(String),
            hideOnSinglePage: paginationHideOnSinglePage,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
          }
        : false,
    [
      enablePagination,
      pageSize,
      showPaginationSizeChanger,
      paginationPageSizeOptions,
      paginationHideOnSinglePage,
    ],
  );

  return (
    <Card
      variant="surface"
      padding="none"
      className={cn(
        "w-full !flex-col !items-stretch !justify-start",
        cardClassName,
      )}
    >
      <Table<T>
        className={cn(
          "w-full",
          visualVariant === "employee" &&
            "[&_.ant-table-thead>tr>th]:!bg-gray-50/95 [&_.ant-table-thead>tr>th]:before:!hidden",
        )}
        rowKey={(row) =>
          String((row as { id?: string | number }).id ?? JSON.stringify(row))
        }
        rowClassName={(row) => {
          const id = String((row as { id?: string | number }).id ?? "");
          const hl =
            id && highlightRowId && id === highlightRowId
              ? "!bg-sky-100/90 transition-colors duration-300"
              : "";
          const hover =
            visualVariant === "employee" ? "hover:!bg-gray-50/60" : "";
          return [hl, hover].filter(Boolean).join(" ");
        }}
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
