import type {
  DataTableColumn,
  DataTableFilter,
  DataTableRowId,
  DataTableSort,
} from "../types";

export const getRowValue = <TData>(
  row: TData,
  column: DataTableColumn<TData>,
): unknown => {
  if (column.accessorFn) {
    return column.accessorFn(row);
  }

  if (column.accessorKey) {
    return (row as Record<string, unknown>)[column.accessorKey];
  }

  return undefined;
};

export const defaultGetRowId = <TData>(
  row: TData,
  index: number,
): DataTableRowId => {
  const record = row as Record<string, unknown>;
  const id = record.id ?? record.uuid;

  return typeof id === "string" || typeof id === "number" ? id : index;
};

export const stringifyCellValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

export const applyClientSearch = <TData>(
  data: TData[],
  columns: DataTableColumn<TData>[],
  searchValue: string,
): TData[] => {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return data;
  }

  const searchableColumns = columns.filter(
    (column) => column.searchable !== false,
  );

  return data.filter((row) =>
    searchableColumns.some((column) =>
      stringifyCellValue(getRowValue(row, column))
        .toLowerCase()
        .includes(normalizedSearch),
    ),
  );
};

export const applyClientFilters = <TData>(
  data: TData[],
  columns: DataTableColumn<TData>[],
  filters: DataTableFilter<TData>[],
): TData[] => {
  const activeFilters = filters.filter(
    (filter) =>
      filter.value !== undefined &&
      filter.value !== null &&
      filter.value !== "",
  );

  if (!activeFilters.length) {
    return data;
  }

  return data.filter((row) =>
    activeFilters.every((filter) => {
      const column = columns.find((item) => item.id === filter.id);
      const value = column ? getRowValue(row, column) : undefined;

      if (filter.type === "checkbox" && Array.isArray(filter.value)) {
        return filter.value.includes(value);
      }

      if (filter.type === "boolean") {
        return Boolean(value) === Boolean(filter.value);
      }

      if (filter.type === "date-range") {
        const [from, to] = Array.isArray(filter.value)
          ? filter.value
          : [undefined, undefined];
        const dateValue = value ? new Date(String(value)).getTime() : 0;
        const fromTime = from ? new Date(String(from)).getTime() : undefined;
        const toTime = to ? new Date(String(to)).getTime() : undefined;

        return (
          (!fromTime || dateValue >= fromTime) &&
          (!toTime || dateValue <= toTime)
        );
      }

      return stringifyCellValue(value)
        .toLowerCase()
        .includes(String(filter.value).toLowerCase());
    }),
  );
};

export const applyClientSorting = <TData>(
  data: TData[],
  columns: DataTableColumn<TData>[],
  sorting: DataTableSort[],
): TData[] => {
  if (!sorting.length) {
    return data;
  }

  return [...data].sort((left, right) => {
    for (const sort of sorting) {
      const column = columns.find((item) => item.id === sort.id);

      if (!column) {
        continue;
      }

      const leftValue = getRowValue(left, column);
      const rightValue = getRowValue(right, column);
      const comparison = stringifyCellValue(leftValue).localeCompare(
        stringifyCellValue(rightValue),
        undefined,
        { numeric: true, sensitivity: "base" },
      );

      if (comparison !== 0) {
        return sort.direction === "asc" ? comparison : -comparison;
      }
    }

    return 0;
  });
};

export const getPageNumbers = (
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);

  if (currentPage > 1) {
    pages.add(currentPage - 1);
  }

  if (currentPage < totalPages) {
    pages.add(currentPage + 1);
  }

  const sorted = [...pages].sort((left, right) => left - right);
  const result: Array<number | "ellipsis"> = [];

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];

    if (previous && page - previous > 1) {
      result.push("ellipsis");
    }

    result.push(page);
  });

  return result;
};
