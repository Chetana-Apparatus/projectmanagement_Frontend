"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    if (!enablePagination || data.length === 0) return 1;
    return Math.max(1, Math.ceil(data.length / pageSize));
  }, [data.length, enablePagination, pageSize]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedData = useMemo(() => {
    if (!enablePagination) return data;
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [currentPage, data, enablePagination, pageSize]);

  return (
    <Card variant="surface" padding="none" className="flex flex-col">
      {/* ✅ TABLE SCROLL AREA */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-left border-collapse">
          <thead
            className={cn(
              "z-10 bg-white border-b",
              stickyHeader && "sticky top-0",
            )}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-xs font-semibold uppercase text-gray-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={String((row as { id?: string | number }).id ?? rowIndex)}
                >
                  {columns.map((column) => {
                    const value = row[column.key];
                    const cellRenderer = renderers?.[column.key];

                    return (
                      <td
                        key={column.key}
                        className="px-6 py-4 text-sm text-gray-700"
                      >
                        {cellRenderer
                          ? cellRenderer(row, value)
                          : String(value ?? "-")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ PAGINATION BELOW TABLE */}
      {enablePagination && data.length > pageSize && (
        <div className="flex items-center justify-between border-t px-6 py-4 bg-white">
          <p className="text-xs text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, data.length)} of {data.length}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <span className="text-xs text-gray-500">
              Page {currentPage} / {totalPages}
            </span>

            <Button
              variant="secondary"
              className="h-8 px-3 text-xs"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
