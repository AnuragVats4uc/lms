"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Database, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, XStack, YStack } from "@repo/ui";
import type { PaginatedData } from "@repo/types";

import { AppModal } from "@/components/AppModal";
import {
  DataTable,
  type DataTableColumn,
  type DataTableRowId,
} from "@/components/DataTable";
import { userHasPermission } from "@/features/shared/access";
import { useAuthSession } from "@repo/auth";
import {
  CrudDetailPanel,
  CrudActionMenu,
  CrudActiveFilterChips,
  CrudConfirmationDialog,
  CrudFilterToolbar,
  CrudPageHeader,
  CrudStats,
  CrudToast,
  type CrudMenuAction,
  type CrudToastState,
  type CrudFilterDefinition,
  type CrudStat,
} from "./crud";

export interface ResourceQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  type?: string;
  published?: boolean;
  filters?: Record<string, string>;
}

export interface ResourceFormContext<Form> {
  error: string | null;
  form: Form;
  isEdit: boolean;
  onChange: <K extends keyof Form>(key: K, value: Form[K]) => void;
}

export interface ResourceManagementPageProps<
  Item,
  Form,
  CreatePayload,
  UpdatePayload,
> {
  title: string;
  description: string;
  entityLabel: string;
  permissionPrefix: string;
  queryKey: readonly unknown[];
  queryFn: (query: ResourceQuery) => Promise<PaginatedData<Item>>;
  columns: DataTableColumn<Item>[];
  getRowId: (item: Item) => DataTableRowId;
  getDisplayName: (item: Item) => string;
  initialForm: Form;
  toForm: (item: Item) => Form;
  toCreatePayload: (form: Form) => CreatePayload;
  toUpdatePayload: (form: Form) => UpdatePayload;
  validate?: (form: Form, isEdit: boolean) => string | null;
  renderForm: (context: ResourceFormContext<Form>) => ReactNode;
  renderDetails?: (item: Item) => ReactNode;
  create?: (payload: CreatePayload) => Promise<Item>;
  update?: (id: number, payload: UpdatePayload) => Promise<Item>;
  remove?: (id: number) => Promise<Item>;
  statusOptions?: Array<{ label: string; value: string }>;
  typeOptions?: Array<{ label: string; value: string }>;
  publishedOptions?: Array<{ label: string; value: string }>;
  filterDefinitions?: CrudFilterDefinition[];
  clientFilterRows?: (rows: Item[], filters: Record<string, string>) => Item[];
  rowActions?: CrudMenuAction<Item>[];
  additionalRowActions?: CrudMenuAction<Item>[];
  selectable?: boolean;
  selectedRowIds?: DataTableRowId[];
  selectedItems?: Item[];
  onSelectionChange?: (ids: DataTableRowId[], selectedRows: Item[]) => void;
  selectedItem?: Item | null;
  onSelectedItemChange?: (item: Item | null) => void;
  renderDetailPanel?: (item: Item | null, isLoading: boolean) => ReactNode;
  renderBulkActions?: (
    items: Item[],
    clear: () => void,
    refresh: () => Promise<unknown>,
  ) => ReactNode;
  showActiveFilterChips?: boolean;
  filterActions?: ReactNode;
  initialFilters?: Record<string, string>;
  initialPage?: number;
  initialPageSize?: number;
  syncUrl?: boolean;
  urlFilterDefaults?: Record<string, string>;
  getStats?: (context: {
    isLoading: boolean;
    rows: Item[];
    total: number;
  }) => CrudStat[];
  searchPlaceholder?: string;
  createLabel?: string;
  context?: ReactNode;
  enabled?: boolean;
  emptyDescription?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function ResourceManagementPage<
  Item extends { id: number },
  Form,
  CreatePayload,
  UpdatePayload,
>({
  title,
  description,
  entityLabel,
  permissionPrefix,
  queryKey,
  queryFn,
  columns,
  getRowId,
  getDisplayName,
  initialForm,
  toForm,
  toCreatePayload,
  toUpdatePayload,
  validate,
  renderForm,
  renderDetails,
  create,
  update,
  remove,
  statusOptions,
  typeOptions,
  publishedOptions,
  filterDefinitions: extraFilterDefinitions,
  clientFilterRows,
  rowActions,
  additionalRowActions,
  selectable = false,
  selectedRowIds: controlledSelectedRowIds,
  selectedItems: controlledSelectedItems,
  onSelectionChange,
  selectedItem: controlledSelectedItem,
  onSelectedItemChange,
  renderDetailPanel,
  renderBulkActions,
  showActiveFilterChips = false,
  filterActions,
  initialFilters,
  initialPage = 1,
  initialPageSize = 10,
  syncUrl = false,
  urlFilterDefaults = {},
  getStats,
  searchPlaceholder,
  createLabel,
  context,
  enabled = true,
  emptyDescription,
}: ResourceManagementPageProps<Item, Form, CreatePayload, UpdatePayload>) {
  const { currentUser } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();
  const canCreate =
    Boolean(create) &&
    userHasPermission(currentUser, permissionPrefix + ".create");
  const canUpdate =
    Boolean(update) &&
    userHasPermission(currentUser, permissionPrefix + ".update");
  const canDelete =
    Boolean(remove) &&
    userHasPermission(currentUser, permissionPrefix + ".delete");
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState(initialFilters?.search ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    initialFilters?.search ?? "",
  );
  const [status, setStatus] = useState(initialFilters?.status ?? "");
  const [typeFilter, setTypeFilter] = useState(initialFilters?.type ?? "");
  const [publishedFilter, setPublishedFilter] = useState(
    initialFilters?.published ?? "",
  );
  const [customFilters, setCustomFilters] = useState<Record<string, string>>(
    () => {
      const values = { ...(initialFilters ?? {}) };
      delete values.status;
      delete values.type;
      delete values.published;
      return values;
    },
  );
  const [selected, setSelected] = useState<Item | null>(null);
  const [internalSelectedRowIds, setInternalSelectedRowIds] = useState<
    DataTableRowId[]
  >([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<Form>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState<Item | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [toast, setToast] = useState<CrudToastState | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!syncUrl) return;

    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("limit", String(pageSize));
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (typeFilter) params.set("type", typeFilter);
    if (publishedFilter) params.set("published", publishedFilter);
    Object.entries(customFilters).forEach(([key, value]) => {
      if (value && value !== "ALL" && value !== urlFilterDefaults[key]) {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [
    customFilters,
    page,
    pageSize,
    pathname,
    publishedFilter,
    router,
    search,
    status,
    syncUrl,
    typeFilter,
    urlFilterDefaults,
  ]);

  const query = useQuery({
    enabled,
    queryFn: () =>
      queryFn({
        limit: pageSize,
        page,
        search: debouncedSearch || undefined,
        status: status || undefined,
        type: typeFilter || undefined,
        published:
          publishedFilter === "" ? undefined : publishedFilter === "true",
        filters: customFilters,
      }),
    queryKey: [
      ...queryKey,
      page,
      pageSize,
      debouncedSearch,
      status,
      typeFilter,
      publishedFilter,
      customFilters,
    ],
    staleTime: 30_000,
  });
  const createMutation = useMutation({
    mutationFn: (payload: CreatePayload) => create?.(payload) as Promise<Item>,
  });
  const updateMutation = useMutation({
    mutationFn: (input: { id: number; payload: UpdatePayload }) =>
      update?.(input.id, input.payload) as Promise<Item>,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove?.(id) as Promise<Item>,
  });
  const rawRows = query.data?.items ?? [];
  const filterValues = {
    ...customFilters,
    published: publishedFilter || "ALL",
    status: status || "ALL",
    type: typeFilter || "ALL",
  };
  const rows = clientFilterRows
    ? clientFilterRows(rawRows, filterValues)
    : rawRows;
  const total = query.data?.meta.total ?? 0;
  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const filterDefinitions = useMemo<CrudFilterDefinition[]>(
    () => [
      ...(statusOptions?.length
        ? [{ id: "status", label: "Status", options: statusOptions }]
        : []),
      ...(typeOptions?.length
        ? [{ id: "type", label: "Type", options: typeOptions }]
        : []),
      ...(publishedOptions?.length
        ? [{ id: "published", label: "Published", options: publishedOptions }]
        : []),
      ...(extraFilterDefinitions ?? []),
    ],
    [extraFilterDefinitions, publishedOptions, statusOptions, typeOptions],
  );

  const selectedItem =
    controlledSelectedItem !== undefined ? controlledSelectedItem : selected;
  const selectedRowIds = controlledSelectedRowIds ?? internalSelectedRowIds;
  const selectedItems =
    controlledSelectedItems ??
    rows.filter((row) => selectedRowIds.includes(getRowId(row)));
  const setSelectedItem = useCallback(
    (item: Item | null) => {
      setSelected(item);
      onSelectedItemChange?.(item);
    },
    [onSelectedItemChange],
  );

  const stats = getStats?.({ isLoading: query.isLoading, rows, total }) ?? [
    {
      icon: <Database aria-hidden="true" color="#059669" size={20} />,
      label: `Total ${entityLabel}s`,
      value: total,
    },
  ];

  const showToast = (
    titleText: string,
    message: string,
    tone: "success" | "error",
  ) => {
    setToast({ id: Date.now(), title: titleText, message, tone });
  };
  const closeForm = () => {
    if (!isSubmitting) {
      setCreateOpen(false);
      setEditing(null);
      setFormError(null);
    }
  };
  const openCreate = () => {
    setForm(initialForm);
    setFormError(null);
    setCreateOpen(true);
  };
  const openEdit = useCallback(
    (item: Item) => {
      setForm(toForm(item));
      setFormError(null);
      setEditing(item);
    },
    [toForm],
  );
  const onChange = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError(null);
  };
  const handleFilterChange = (id: string, value: string) => {
    const nextValue = value === "ALL" ? "" : value;
    if (id === "status") setStatus(nextValue);
    if (id === "type") setTypeFilter(nextValue);
    if (id === "published") setPublishedFilter(nextValue);
    if (id !== "status" && id !== "type" && id !== "published") {
      setCustomFilters((current) => ({ ...current, [id]: value }));
    }
    setPage(1);
  };
  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setTypeFilter("");
    setPublishedFilter("");
    setCustomFilters({});
    setPage(1);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate?.(form, Boolean(editing));
    if (validationError) {
      setFormError(validationError);
      showToast("Invalid form", validationError, "error");
      return;
    }
    try {
      if (editing && update) {
        const item = await updateMutation.mutateAsync({
          id: editing.id,
          payload: toUpdatePayload(form),
        });
        setSelectedItem(item);
        showToast(
          entityLabel + " updated",
          getDisplayName(item) + " was updated successfully.",
          "success",
        );
      } else if (!editing && create) {
        const item = await createMutation.mutateAsync(toCreatePayload(form));
        setSelectedItem(item);
        showToast(
          entityLabel + " created",
          getDisplayName(item) + " was created successfully.",
          "success",
        );
      }
      closeForm();
      await query.refetch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The request could not be completed.";
      setFormError(message);
      showToast("Request failed", message, "error");
    }
  };
  const confirmDelete = async () => {
    if (!confirmItem || !remove) return;
    try {
      await deleteMutation.mutateAsync(confirmItem.id);
      setConfirmItem(null);
      setConfirmError(null);
      setSelectedItem(null);
      showToast(
        entityLabel + " deleted",
        getDisplayName(confirmItem) + " was deleted successfully.",
        "success",
      );
      await query.refetch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The delete request could not be completed.";
      setConfirmError(message);
      showToast("Delete failed", message, "error");
    }
  };
  const permittedActions = useMemo(
    () =>
      (
        rowActions ?? [
          ...(renderDetails
            ? [
                {
                  id: "view",
                  label: "View",
                  icon: ExternalLink,
                  onAction: (item: Item) => setSelectedItem(item),
                },
              ]
            : []),
          ...(canUpdate
            ? [
                {
                  id: "edit",
                  label: "Edit",
                  icon: Pencil,
                  onAction: (item: Item) => openEdit(item),
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  id: "delete",
                  label: "Delete",
                  icon: Trash2,
                  destructive: true,
                  onAction: (item: Item) => {
                    setConfirmItem(item);
                    setConfirmError(null);
                  },
                },
              ]
            : []),
        ]
      )
        .concat(additionalRowActions ?? [])
        .filter(
          (action) =>
            !action.permission ||
            userHasPermission(currentUser, action.permission),
        )
        .map((action) => ({
          ...action,
          onAction: async (item: Item) => {
            await action.onAction(item);
            await query.refetch();
          },
        })),
    [
      canDelete,
      canUpdate,
      currentUser,
      openEdit,
      query,
      renderDetails,
      rowActions,
      additionalRowActions,
      setSelectedItem,
    ],
  );

  const tableColumns = useMemo<DataTableColumn<Item>[]>(
    () => [
      ...columns,
      {
        align: "center",
        cell: ({ row }) => (
          <CrudActionMenu
            actions={permittedActions}
            getItemLabel={getDisplayName}
            item={row}
          />
        ),
        header: "Actions",
        id: "__actions",
        meta: { stickyEnd: true },
        width: 76,
      },
    ],
    [columns, getDisplayName, permittedActions],
  );

  const formTitle = editing ? "Edit " + entityLabel : "Add " + entityLabel;
  const submitForm = () => {
    const formElement = document.getElementById("resource-management-form");
    if (formElement instanceof HTMLFormElement) formElement.requestSubmit();
  };

  return (
    <YStack
      className="lms-organizations-page"
      gap="$5"
      style={{ width: "100%" }}
    >
      <CrudPageHeader
        canCreate={canCreate}
        createLabel={createLabel ?? `Add ${entityLabel}`}
        description={description}
        isFetching={query.isFetching}
        onCreate={openCreate}
        onRefresh={() => void query.refetch()}
        title={title}
      />
      <CrudStats isLoading={query.isLoading} stats={stats} />
      {context}
      <CrudFilterToolbar
        actions={filterActions}
        entityLabel={entityLabel}
        filters={filterDefinitions}
        onClear={clearFilters}
        onFilterChange={handleFilterChange}
        onRefresh={() => void query.refetch()}
        onSearch={setSearch}
        searchPlaceholder={searchPlaceholder}
        searchValue={search}
        values={filterValues}
      />
      {showActiveFilterChips ? (
        <CrudActiveFilterChips
          filters={filterDefinitions}
          onClear={clearFilters}
          onRemove={(id) => {
            if (id === "status") setStatus("");
            else if (id === "type") setTypeFilter("");
            else if (id === "published") setPublishedFilter("");
            else setCustomFilters((current) => ({ ...current, [id]: "ALL" }));
            setPage(1);
          }}
          values={filterValues}
        />
      ) : null}
      <XStack
        className={[
          "lms-organization-management-grid",
          selectedItem && (renderDetails || renderDetailPanel)
            ? "is-side-panel-open"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        gap="$4"
        style={{ alignItems: "flex-start", width: "100%" }}
      >
        <YStack gap="$3" style={{ flex: 1, minWidth: 0 }}>
          {renderBulkActions?.(
            selectedItems,
            () => {
              setInternalSelectedRowIds([]);
              onSelectionChange?.([], []);
            },
            query.refetch,
          )}
          <DataTable<Item>
            columns={tableColumns}
            data={rows}
            emptyState={{
              description:
                emptyDescription ??
                "No " +
                  entityLabel.toLowerCase() +
                  " records match the current filters.",
              title: "No " + entityLabel.toLowerCase() + " found",
            }}
            error={
              query.error
                ? {
                    description:
                      query.error instanceof Error
                        ? query.error.message
                        : "The list could not be loaded.",
                    onRetry: () => void query.refetch(),
                    retryLabel: "Retry",
                    title: "Unable to load " + entityLabel.toLowerCase(),
                  }
                : null
            }
            getRowId={getRowId}
            loading={query.isLoading}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            onRowClick={setSelectedItem}
            onSelectionChange={(ids, selectedRows) => {
              setInternalSelectedRowIds(ids);
              onSelectionChange?.(ids, selectedRows);
            }}
            pagination={{
              entityLabel: entityLabel.toLowerCase(),
              mode: "server",
              page,
              pageSize,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              total,
              totalPages: query.data?.meta.totalPages ?? 1,
            }}
            renderToolbar={() => null}
            searchable={false}
            selectable={selectable}
            selectedRowIds={selectedRowIds}
            stickyFirstColumn
            stickyHeader
          />
        </YStack>
        {renderDetailPanel ? (
          renderDetailPanel(
            selectedItem,
            query.isLoading && Boolean(selectedItem),
          )
        ) : renderDetails ? (
          <CrudDetailPanel
            getDisplayName={getDisplayName}
            isLoading={query.isLoading && Boolean(selectedItem)}
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            renderDetails={renderDetails}
          />
        ) : null}
      </XStack>
      <AppModal
        className="lms-organization-create-modal"
        description="Save the form and refresh the current list."
        isOpen={isCreateOpen || Boolean(editing)}
        onClose={closeForm}
        title={formTitle}
        footer={
          <XStack gap="$2" style={{ justifyContent: "flex-end" }}>
            <Button
              background="#FFFFFF"
              borderColor="#D8E1EC"
              borderWidth={1}
              disabled={isSubmitting}
              onPress={closeForm}
              rounded="$3"
            >
              <Button.Text>Cancel</Button.Text>
            </Button>
            <Button
              background="#059669"
              borderColor="#059669"
              borderWidth={1}
              disabled={isSubmitting}
              onPress={submitForm}
              rounded="$3"
            >
              <Button.Text color="#FFFFFF">
                {isSubmitting ? "Saving..." : editing ? "Update" : "Create"}
              </Button.Text>
            </Button>
          </XStack>
        }
      >
        <form id="resource-management-form" onSubmit={submit}>
          {renderForm({
            error: formError,
            form,
            isEdit: Boolean(editing),
            onChange,
          })}
        </form>
      </AppModal>
      <CrudConfirmationDialog
        confirmLabel="Delete"
        description="This action cannot be undone from the application."
        destructive
        detail={
          confirmItem ? "Delete " + getDisplayName(confirmItem) + "?" : ""
        }
        error={confirmError ?? undefined}
        isOpen={Boolean(confirmItem)}
        isSubmitting={deleteMutation.isPending}
        onClose={() => {
          if (!deleteMutation.isPending) setConfirmItem(null);
        }}
        onConfirm={() => void confirmDelete()}
        subject={confirmItem ? getDisplayName(confirmItem) : ""}
        title={"Delete " + entityLabel}
      />
      <CrudToast onDismiss={() => setToast(null)} toast={toast} />
    </YStack>
  );
}
