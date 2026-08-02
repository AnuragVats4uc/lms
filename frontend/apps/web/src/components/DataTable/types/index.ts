import type { ReactNode } from "react";

export type DataTableRowId = string | number;
export type DataTableAlign = "left" | "center" | "right";
export type DataTableSortDirection = "asc" | "desc";
export type DataTablePaginationMode = "client" | "server";
export type DataTableSelectionMode = "single" | "multiple";
export type DataTableDensity = "comfortable" | "compact";

export interface DataTableSort {
  id: string;
  direction: DataTableSortDirection;
}

export interface DataTableColumnContext<TData, TValue = unknown> {
  column: DataTableColumn<TData, TValue>;
}

export interface DataTableCellContext<
  TData,
  TValue = unknown,
> extends DataTableColumnContext<TData, TValue> {
  row: TData;
  rowIndex: number;
  value: TValue;
}

export interface DataTableColumn<TData, TValue = unknown> {
  id: string;
  header:
    ReactNode | ((context: DataTableColumnContext<TData, TValue>) => ReactNode);
  accessorKey?: keyof TData & string;
  accessorFn?: (row: TData) => TValue;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  visible?: boolean;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: DataTableAlign;
  sticky?: boolean;
  cell?: (context: DataTableCellContext<TData, TValue>) => ReactNode;
  headerCell?: (context: DataTableColumnContext<TData, TValue>) => ReactNode;
  footerCell?: (context: DataTableColumnContext<TData, TValue>) => ReactNode;
  meta?: Record<string, unknown>;
}

export type DataTableFilterType =
  | "text"
  | "select"
  | "checkbox"
  | "date-range"
  | "status"
  | "boolean"
  | "custom";

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface DataTableFilter<TData> {
  id: string;
  label: string;
  type: DataTableFilterType;
  value?: unknown;
  options?: DataTableFilterOption[];
  render?: (context: DataTableFilterRenderContext<TData>) => ReactNode;
}

export interface DataTableFilterRenderContext<TData> {
  filter: DataTableFilter<TData>;
  setFilterValue: (id: string, value: unknown) => void;
}

export interface DataTableAction<TData> {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean | ((row: TData) => boolean);
  destructive?: boolean;
  onAction: (row: TData) => void;
}

export interface DataTableBulkAction<TData> {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onAction: (rows: TData[]) => void;
}

export interface DataTableToolbarAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onPress: () => void;
}

export interface DataTableSearchConfig {
  enabled?: boolean;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  debounceMs?: number;
  mode?: DataTablePaginationMode;
}

export interface DataTablePaginationConfig {
  enabled?: boolean;
  mode?: DataTablePaginationMode;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  defaultPageSize?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  pageSizeOptions?: number[];
  entityLabel?: string;
}

export interface DataTableEmptyState {
  icon?: ReactNode;
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}

export interface DataTableErrorState {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export interface DataTableColumnVisibility {
  enabled?: boolean;
  value?: Record<string, boolean>;
  onChange?: (visibility: Record<string, boolean>) => void;
}

export interface DataTableProps<TData> {
  data: TData[];
  columns: DataTableColumn<TData>[];
  getRowId?: (row: TData, index: number) => DataTableRowId;
  title?: string;
  subtitle?: string;
  pagination?: DataTablePaginationConfig;
  sorting?: DataTableSort[];
  defaultSorting?: DataTableSort[];
  filters?: DataTableFilter<TData>[];
  loading?: boolean;
  error?: DataTableErrorState | null;
  selectable?: boolean;
  selectionMode?: DataTableSelectionMode;
  selectedRowIds?: DataTableRowId[];
  searchable?: boolean | DataTableSearchConfig;
  actions?: DataTableAction<TData>[];
  bulkActions?: DataTableBulkAction<TData>[];
  toolbarActions?: DataTableToolbarAction[];
  emptyState?: DataTableEmptyState;
  columnVisibility?: DataTableColumnVisibility;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  enableRowExpansion?: boolean;
  getRowExpandedContent?: (row: TData) => ReactNode;
  density?: DataTableDensity;
  responsiveMode?: "scroll" | "cards";
  footer?: ReactNode;
  renderToolbar?: (context: DataTableRenderContext<TData>) => ReactNode;
  renderFooter?: (context: DataTableRenderContext<TData>) => ReactNode;
  onRowClick?: (row: TData) => void;
  onSearch?: (value: string) => void;
  onSort?: (sorting: DataTableSort[]) => void;
  onFilterChange?: (filters: DataTableFilter<TData>[]) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSelectionChange?: (
    selectedIds: DataTableRowId[],
    selectedRows: TData[],
  ) => void;
  onRefresh?: () => void;
  onExport?: () => void;
}

export interface DataTableState<TData> {
  rows: TData[];
  visibleColumns: DataTableColumn<TData>[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  searchValue: string;
  sorting: DataTableSort[];
  filters: DataTableFilter<TData>[];
  selectedIds: DataTableRowId[];
  selectedRows: TData[];
  allPageRowsSelected: boolean;
  somePageRowsSelected: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface DataTableRenderContext<TData> {
  state: DataTableState<TData>;
  setSearchValue: (value: string) => void;
  setFilterValue: (id: string, value: unknown) => void;
  toggleSort: (columnId: string, multi?: boolean) => void;
  toggleRowSelected: (row: TData, index: number) => void;
  toggleAllPageRows: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  clearSelection: () => void;
}
