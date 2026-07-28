"use client";

import { memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Text, XStack } from "@repo/ui";

import { DATA_TABLE_COLORS } from "./constants";
import type { DataTablePaginationConfig } from "./types";
import { getPageNumbers } from "./utils";

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  pagination?: DataTablePaginationConfig;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  total: number;
  totalPages: number;
}

export const DataTablePagination = memo(function DataTablePagination({
  page,
  pageSize,
  pageSizeOptions,
  pagination,
  setPage,
  setPageSize,
  total,
  totalPages,
}: DataTablePaginationProps) {
  if (pagination?.enabled === false) {
    return null;
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const entityLabel = pagination?.entityLabel ?? "items";

  return (
    <XStack
      px="$4"
      py="$3"
      style={{
        alignItems: "center",
        borderTopColor: DATA_TABLE_COLORS.divider,
        borderTopWidth: 1,
        justifyContent: "space-between",
        minWidth: 0,
      }}
    >
      <Text color={DATA_TABLE_COLORS.muted} fontSize="$caption">
        Showing {start}-{end} of {total} {entityLabel}
      </Text>

      <XStack gap="$2" style={{ alignItems: "center" }}>
        <Button
          aria-label="Previous page"
          background="#FFFFFF"
          borderColor={DATA_TABLE_COLORS.border}
          borderWidth={1}
          disabled={page <= 1}
          height={36}
          onPress={() => setPage(page - 1)}
          rounded="$3"
        >
          <ChevronLeft aria-hidden="true" size={15} />
          <Button.Text fontSize="$caption" fontWeight="$button">
            Previous
          </Button.Text>
        </Button>

        {getPageNumbers(page, totalPages).map((pageNumber, index) =>
          pageNumber === "ellipsis" ? (
            <Text
              color={DATA_TABLE_COLORS.muted}
              fontSize="$caption"
              key={`ellipsis-${index}`}
              px="$2"
            >
              ...
            </Text>
          ) : (
            <Button
              aria-label={`Page ${pageNumber}`}
              background={
                pageNumber === page ? DATA_TABLE_COLORS.greenSoft : "#FFFFFF"
              }
              borderColor={
                pageNumber === page ? DATA_TABLE_COLORS.green : DATA_TABLE_COLORS.border
              }
              borderWidth={1}
              height={36}
              key={pageNumber}
              onPress={() => setPage(pageNumber)}
              rounded="$3"
              width={36}
            >
              <Button.Text
                color={
                  pageNumber === page
                    ? DATA_TABLE_COLORS.green
                    : DATA_TABLE_COLORS.text
                }
                fontSize="$caption"
                fontWeight="$button"
              >
                {pageNumber}
              </Button.Text>
            </Button>
          )
        )}

        <Button
          aria-label="Next page"
          background="#FFFFFF"
          borderColor={DATA_TABLE_COLORS.border}
          borderWidth={1}
          disabled={page >= totalPages}
          height={36}
          onPress={() => setPage(page + 1)}
          rounded="$3"
        >
          <Button.Text fontSize="$caption" fontWeight="$button">
            Next
          </Button.Text>
          <ChevronRight aria-hidden="true" size={15} />
        </Button>
      </XStack>

      <XStack gap="$2" style={{ alignItems: "center" }}>
        <Text color={DATA_TABLE_COLORS.muted} fontSize="$caption">
          Rows per page
        </Text>
        <select
          aria-label="Rows per page"
          onChange={(event) => setPageSize(Number(event.target.value))}
          style={{
            background: "#FFFFFF",
            border: `1px solid ${DATA_TABLE_COLORS.border}`,
            borderRadius: 10,
            color: DATA_TABLE_COLORS.text,
            height: 36,
            padding: "0 12px",
          }}
          value={pageSize}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </XStack>
    </XStack>
  );
});
