import { getApiErrorMessage } from "@repo/api";
import type { Session } from "@repo/types";
import {
  DataTable,
  DataTableAvatarCell,
  DataTableBadgeCell,
  DataTableDateCell,
  DataTableTextCell,
  type DataTableColumn,
  type DataTableRowId,
  type DataTableSort,
} from "@/components/DataTable";
import type { SessionRowActionHandlers } from "../types";
import { SessionActionsCell } from "./SessionActionsCell";

function statusTone(session: Session) {
  if (session.status === "ARCHIVED" || !session.isActive)
    return "gray" as const;
  if (session.status === "COMPLETED") return "blue" as const;
  if (session.status === "ACTIVE") return "green" as const;
  return "orange" as const;
}

function createColumns(
  handlers: SessionRowActionHandlers,
): DataTableColumn<Session>[] {
  return [
    {
      cell: ({ row }) => (
        <DataTableAvatarCell
          label={row.name}
          subtitle={row.code ?? "No code"}
        />
      ),
      header: "Session",
      id: "name",
      sortable: true,
      sticky: true,
      width: 260,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.status}
          secondary={row.isActive ? "Active record" : "Inactive record"}
        />
      ),
      header: "Status",
      id: "status",
      sortable: false,
      width: 130,
    },
    {
      cell: ({ row }) => (
        <DataTableDateCell
          options={{
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }}
          value={row.startDate}
        />
      ),
      header: "Starts",
      id: "startDate",
      sortable: true,
      width: 180,
    },
    {
      cell: ({ row }) => (
        <DataTableDateCell
          options={{
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }}
          value={row.endDate}
        />
      ),
      header: "Ends",
      id: "endDate",
      sortable: true,
      width: 180,
    },
    {
      cell: ({ row }) => (
        <DataTableBadgeCell
          label={
            row.status === "ARCHIVED"
              ? "Archived"
              : row.status.charAt(0) + row.status.slice(1).toLowerCase()
          }
          tone={statusTone(row)}
        />
      ),
      header: "Lifecycle",
      id: "lifecycle",
      width: 122,
    },
    {
      cell: ({ row }) => <DataTableDateCell value={row.createdAt} />,
      header: "Created",
      id: "createdAt",
      sortable: true,
      width: 126,
    },
    {
      cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
      header: "Updated",
      id: "updatedAt",
      sortable: true,
      width: 126,
    },
    {
      align: "center",
      cell: ({ row }) => (
        <SessionActionsCell handlers={handlers} session={row} />
      ),
      header: "Actions",
      id: "actions",
      meta: { stickyEnd: true },
      width: 76,
    },
  ];
}

export function SessionTable({
  data,
  error,
  hasFilters,
  loading,
  onPageChange,
  onPageSizeChange,
  onRetry,
  onRowClick,
  onSelectionChange,
  pagination,
  selectedRowIds,
  sorting,
  onSort,
  actions,
}: {
  actions: SessionRowActionHandlers;
  data: Session[];
  error: unknown;
  hasFilters: boolean;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRetry: () => void;
  onRowClick: (session: Session) => void;
  onSelectionChange: (ids: DataTableRowId[]) => void;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  selectedRowIds: DataTableRowId[];
  sorting: DataTableSort[];
  onSort: (sorting: DataTableSort[]) => void;
}) {
  return (
    <DataTable<Session>
      columns={createColumns(actions)}
      data={data}
      emptyState={{
        description: hasFilters
          ? "No sessions match the current search or filter criteria."
          : "Create the first session for this organization to begin scheduling.",
        primaryAction: null,
        title: hasFilters ? "No matching sessions" : "No sessions found",
      }}
      error={
        error
          ? {
              description: getApiErrorMessage(
                error,
                "The session list could not be loaded.",
              ),
              onRetry,
              retryLabel: "Retry",
              title: "Unable to load sessions",
            }
          : null
      }
      getRowId={(session) => session.id}
      loading={loading}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onRowClick={onRowClick}
      onSelectionChange={(ids) => onSelectionChange(ids)}
      onSort={onSort}
      pagination={{
        entityLabel: "sessions",
        mode: "server",
        page: pagination.page,
        pageSize: pagination.pageSize,
        pageSizeOptions: [10, 25, 50, 100],
        total: pagination.total,
        totalPages: pagination.totalPages,
      }}
      renderToolbar={() => null}
      searchable={false}
      selectable
      selectedRowIds={selectedRowIds}
      sorting={sorting}
      stickyFirstColumn
      stickyHeader
    />
  );
}
