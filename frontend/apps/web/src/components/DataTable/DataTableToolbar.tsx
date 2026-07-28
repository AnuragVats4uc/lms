"use client";

import { memo, useEffect, useState } from "react";
import {
  Download,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Button, Input, Text, XStack, YStack } from "@repo/ui";

import { DATA_TABLE_COLORS } from "./constants";
import { DataTableFilters } from "./DataTableFilters";
import type {
  DataTableBulkAction,
  DataTableFilter,
  DataTableSearchConfig,
  DataTableToolbarAction,
} from "./types";

interface DataTableToolbarProps<TData> {
  bulkActions?: DataTableBulkAction<TData>[];
  filters: DataTableFilter<TData>[];
  loading?: boolean;
  onExport?: () => void;
  onRefresh?: () => void;
  searchConfig?: DataTableSearchConfig;
  searchValue: string;
  selectedRows: TData[];
  setFilterValue: (id: string, value: unknown) => void;
  setSearchValue: (value: string) => void;
  toolbarActions?: DataTableToolbarAction[];
}

function DataTableToolbarComponent<TData>({
  bulkActions = [],
  filters,
  loading,
  onExport,
  onRefresh,
  searchConfig,
  searchValue,
  selectedRows,
  setFilterValue,
  setSearchValue,
  toolbarActions = [],
}: DataTableToolbarProps<TData>) {
  const [draftSearch, setDraftSearch] = useState(searchValue);

  useEffect(() => {
    setDraftSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setSearchValue(draftSearch),
      searchConfig?.debounceMs ?? 300
    );

    return () => window.clearTimeout(timeout);
  }, [draftSearch, searchConfig?.debounceMs, setSearchValue]);

  const hasBulkSelection = selectedRows.length > 0;

  return (
    <YStack gap="$3">
      <XStack
        gap="$3"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          minWidth: 0,
        }}
      >
        {searchConfig?.enabled === false ? null : (
          <XStack
            gap="$3"
            px="$3"
            style={{
              alignItems: "center",
              backgroundColor: "#FCFCFD",
              borderColor: DATA_TABLE_COLORS.border,
              borderRadius: 12,
              borderWidth: 1,
              flex: "1 1 420px",
              maxWidth: 520,
              minHeight: 44,
              minWidth: 240,
            }}
          >
            <Search
              aria-hidden="true"
              color={DATA_TABLE_COLORS.muted}
              size={18}
            />
            <Input
              aria-label="Search table"
              background="transparent"
              borderWidth={0}
              disabled={loading}
              flex={1}
              height={38}
              onChangeText={setDraftSearch}
              p={0}
              placeholder={
                searchConfig?.placeholder ?? "Search..."
              }
              placeholderTextColor={DATA_TABLE_COLORS.muted as never}
              value={draftSearch}
            />
          </XStack>
        )}

        <XStack gap="$2" style={{ alignItems: "center", flexWrap: "wrap" }}>
          {hasBulkSelection
            ? bulkActions.map((action) => (
                <Button
                  aria-label={action.label}
                  background={
                    action.destructive ? "#FFFFFF" : DATA_TABLE_COLORS.green
                  }
                  borderColor={
                    action.destructive
                      ? DATA_TABLE_COLORS.red
                      : DATA_TABLE_COLORS.green
                  }
                  borderWidth={1}
                  disabled={loading || action.disabled}
                  height={40}
                  key={action.id}
                  onPress={() => action.onAction(selectedRows)}
                  rounded="$3"
                >
                  {action.icon}
                  <Button.Text
                    color={action.destructive ? DATA_TABLE_COLORS.red : "#FFFFFF"}
                    fontSize="$caption"
                    fontWeight="$button"
                  >
                    {action.label}
                  </Button.Text>
                </Button>
              ))
            : null}

          {filters.length ? (
            <Button
              aria-label="Filters"
              background="#FFFFFF"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              height={40}
              rounded="$3"
            >
              <SlidersHorizontal
                aria-hidden="true"
                color={DATA_TABLE_COLORS.text}
                size={16}
              />
              <Button.Text fontSize="$caption" fontWeight="$button">
                Filters
              </Button.Text>
            </Button>
          ) : null}

          {onRefresh ? (
            <Button
              aria-label="Refresh"
              background="#FFFFFF"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              height={40}
              onPress={onRefresh}
              rounded="$3"
            >
              <RefreshCw
                aria-hidden="true"
                color={DATA_TABLE_COLORS.text}
                size={16}
              />
            </Button>
          ) : null}

          {onExport ? (
            <Button
              aria-label="Export"
              background="#FFFFFF"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              height={40}
              onPress={onExport}
              rounded="$3"
            >
              <Download
                aria-hidden="true"
                color={DATA_TABLE_COLORS.text}
                size={16}
              />
              <Button.Text fontSize="$caption" fontWeight="$button">
                Export
              </Button.Text>
            </Button>
          ) : null}

          {toolbarActions.map((action) => (
            <Button
              aria-label={action.label}
              background="#FFFFFF"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              height={40}
              key={action.id}
              onPress={action.onPress}
              rounded="$3"
            >
              {action.icon}
              <Button.Text fontSize="$caption" fontWeight="$button">
                {action.label}
              </Button.Text>
            </Button>
          ))}
        </XStack>
      </XStack>

      <DataTableFilters filters={filters} setFilterValue={setFilterValue} />

      {hasBulkSelection ? (
        <Text
          color={DATA_TABLE_COLORS.muted}
          fontSize="$caption"
          lineHeight="$caption"
        >
          {selectedRows.length} selected
        </Text>
      ) : null}
    </YStack>
  );
}

export const DataTableToolbar = memo(
  DataTableToolbarComponent
) as typeof DataTableToolbarComponent;
