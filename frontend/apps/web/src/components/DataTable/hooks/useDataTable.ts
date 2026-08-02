import { useCallback, useMemo, useState } from "react";

import {
  DATA_TABLE_DEFAULT_PAGE_SIZE,
  DATA_TABLE_PAGE_SIZE_OPTIONS,
} from "../constants";
import type {
  DataTableFilter,
  DataTableProps,
  DataTableRowId,
  DataTableSort,
  DataTableSortDirection,
  DataTableState,
} from "../types";
import {
  applyClientFilters,
  applyClientSearch,
  applyClientSorting,
  defaultGetRowId,
} from "../utils";

export const useDataTable = <TData>(props: DataTableProps<TData>) => {
  const {
    columnVisibility,
    columns,
    data,
    defaultSorting = [],
    filters = [],
    getRowId = defaultGetRowId,
    onFilterChange,
    onPageChange,
    onPageSizeChange,
    onSearch,
    onSelectionChange,
    onSort,
    pagination,
    searchable,
    selectedRowIds,
    selectionMode = "multiple",
    sorting,
  } = props;

  const searchConfig = typeof searchable === "object" ? searchable : undefined;
  const searchEnabled =
    typeof searchable === "boolean"
      ? searchable
      : searchConfig?.enabled !== false;
  const searchMode = searchConfig?.mode ?? pagination?.mode ?? "client";
  const paginationMode = pagination?.mode ?? "client";

  const [internalSearch, setInternalSearch] = useState(
    searchConfig?.defaultValue ?? "",
  );
  const [internalSorting, setInternalSorting] =
    useState<DataTableSort[]>(defaultSorting);
  const [internalFilters, setInternalFilters] =
    useState<DataTableFilter<TData>[]>(filters);
  const [internalPage, setInternalPage] = useState(
    pagination?.defaultPage ?? 1,
  );
  const [internalPageSize, setInternalPageSize] = useState(
    pagination?.defaultPageSize ??
      pagination?.pageSize ??
      DATA_TABLE_DEFAULT_PAGE_SIZE,
  );
  const [internalSelectedIds, setInternalSelectedIds] = useState<
    DataTableRowId[]
  >([]);

  const page = pagination?.page ?? internalPage;
  const pageSize = pagination?.pageSize ?? internalPageSize;
  const searchValue = searchConfig?.value ?? internalSearch;
  const activeSorting = sorting ?? internalSorting;
  const activeFilters = onFilterChange ? filters : internalFilters;
  const activeSelectedIds = selectedRowIds ?? internalSelectedIds;

  const visibleColumns = useMemo(
    () =>
      columns.filter((column) => {
        const explicitVisible = column.visible !== false;
        const controlledVisible = columnVisibility?.value?.[column.id] ?? true;

        return explicitVisible && controlledVisible;
      }),
    [columnVisibility?.value, columns],
  );

  const processedRows = useMemo(() => {
    if (paginationMode === "server" || searchMode === "server") {
      return data;
    }

    const searched = searchEnabled
      ? applyClientSearch(data, visibleColumns, searchValue)
      : data;
    const filtered = applyClientFilters(
      searched,
      visibleColumns,
      activeFilters,
    );

    return applyClientSorting(filtered, visibleColumns, activeSorting);
  }, [
    activeFilters,
    activeSorting,
    data,
    paginationMode,
    searchEnabled,
    searchMode,
    searchValue,
    visibleColumns,
  ]);

  const total = pagination?.total ?? processedRows.length;
  const totalPages =
    pagination?.totalPages ??
    Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));

  const pageRows = useMemo(() => {
    if (paginationMode === "server") {
      return processedRows;
    }

    const start = (page - 1) * pageSize;

    return processedRows.slice(start, start + pageSize);
  }, [page, pageSize, paginationMode, processedRows]);

  const selectedRows = useMemo(
    () =>
      data.filter((row, index) =>
        activeSelectedIds.includes(getRowId(row, index)),
      ),
    [activeSelectedIds, data, getRowId],
  );

  const pageRowIds = useMemo(
    () => pageRows.map((row, index) => getRowId(row, index)),
    [getRowId, pageRows],
  );

  const allPageRowsSelected =
    pageRowIds.length > 0 &&
    pageRowIds.every((id) => activeSelectedIds.includes(id));
  const somePageRowsSelected =
    pageRowIds.some((id) => activeSelectedIds.includes(id)) &&
    !allPageRowsSelected;

  const updateSelectedIds = useCallback(
    (nextIds: DataTableRowId[]) => {
      if (!selectedRowIds) {
        setInternalSelectedIds(nextIds);
      }

      const nextRows = data.filter((row, index) =>
        nextIds.includes(getRowId(row, index)),
      );

      onSelectionChange?.(nextIds, nextRows);
    },
    [data, getRowId, onSelectionChange, selectedRowIds],
  );

  const setSearchValue = useCallback(
    (value: string) => {
      if (searchConfig?.value === undefined) {
        setInternalSearch(value);
      }

      onSearch?.(value);
    },
    [onSearch, searchConfig?.value],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const normalizedPage = Math.min(Math.max(nextPage, 1), totalPages);

      if (pagination?.page === undefined) {
        setInternalPage(normalizedPage);
      }

      onPageChange?.(normalizedPage);
    },
    [onPageChange, pagination?.page, totalPages],
  );

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      if (pagination?.pageSize === undefined) {
        setInternalPageSize(nextPageSize);
        setInternalPage(1);
      }

      onPageSizeChange?.(nextPageSize);
    },
    [onPageSizeChange, pagination?.pageSize],
  );

  const toggleSort = useCallback(
    (columnId: string, multi = false) => {
      const current = activeSorting.find((item) => item.id === columnId);
      const nextDirection: DataTableSortDirection =
        current?.direction === "asc" ? "desc" : "asc";
      const nextSort = { id: columnId, direction: nextDirection };
      const nextSorting = multi
        ? [...activeSorting.filter((item) => item.id !== columnId), nextSort]
        : [nextSort];

      if (!sorting) {
        setInternalSorting(nextSorting);
      }

      onSort?.(nextSorting);
    },
    [activeSorting, onSort, sorting],
  );

  const setFilterValue = useCallback(
    (id: string, value: unknown) => {
      const nextFilters = activeFilters.map((filter) =>
        filter.id === id ? { ...filter, value } : filter,
      );

      if (!onFilterChange) {
        setInternalFilters(nextFilters);
      }

      onFilterChange?.(nextFilters);
    },
    [activeFilters, onFilterChange],
  );

  const toggleRowSelected = useCallback(
    (row: TData, index: number) => {
      const id = getRowId(row, index);
      const isSelected = activeSelectedIds.includes(id);
      const nextIds =
        selectionMode === "single"
          ? isSelected
            ? []
            : [id]
          : isSelected
            ? activeSelectedIds.filter((item) => item !== id)
            : [...activeSelectedIds, id];

      updateSelectedIds(nextIds);
    },
    [activeSelectedIds, getRowId, selectionMode, updateSelectedIds],
  );

  const toggleAllPageRows = useCallback(() => {
    if (allPageRowsSelected) {
      updateSelectedIds(
        activeSelectedIds.filter((id) => !pageRowIds.includes(id)),
      );
      return;
    }

    updateSelectedIds([...new Set([...activeSelectedIds, ...pageRowIds])]);
  }, [activeSelectedIds, allPageRowsSelected, pageRowIds, updateSelectedIds]);

  const clearSelection = useCallback(
    () => updateSelectedIds([]),
    [updateSelectedIds],
  );

  const state: DataTableState<TData> = {
    allPageRowsSelected,
    filters: activeFilters,
    hasNext: pagination?.hasNext ?? page < totalPages,
    hasPrevious: pagination?.hasPrevious ?? page > 1,
    page,
    pageSize,
    rows: pageRows,
    searchValue,
    selectedIds: activeSelectedIds,
    selectedRows,
    somePageRowsSelected,
    sorting: activeSorting,
    total,
    totalPages,
    visibleColumns,
  };

  return {
    clearSelection,
    pageSizeOptions:
      pagination?.pageSizeOptions ?? Array.from(DATA_TABLE_PAGE_SIZE_OPTIONS),
    setFilterValue,
    setPage,
    setPageSize,
    setSearchValue,
    state,
    toggleAllPageRows,
    toggleRowSelected,
    toggleSort,
  };
};
