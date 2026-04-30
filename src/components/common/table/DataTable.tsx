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
          className:
            "px-6 py-4 align-top text-sm text-gray-700 whitespace-normal break-words",
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
      className="w-full !flex-col !items-stretch !justify-start"
    >
      <Table<T>
        className="w-full"
        rowKey={(row) =>
          String((row as { id?: string | number }).id ?? JSON.stringify(row))
        }
        rowClassName={(row) => {
          const id = String((row as { id?: string | number }).id ?? "");
          return id && highlightRowId && id === highlightRowId
            ? "!bg-sky-100/90 transition-colors duration-300"
            : "";
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
