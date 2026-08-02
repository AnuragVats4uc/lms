"use client";

import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Database, Power } from "lucide-react";
import { organizationsApi } from "@repo/api";
import type {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from "@repo/types";
import { Text, YStack } from "@repo/ui";

import {
  CrudManagementPage,
  type CrudFormContext,
} from "../../components/crud/CrudManagementPage";
import { CrudBulkActionBar } from "../../components/crud";
import { getOrganizations, toOrganizationRow } from "../services";
import { OrganizationFormFields } from "../forms/OrganizationFormFields";
import { DEFAULT_FORM } from "../forms/defaults";
import type {
  AddOrganizationFormState,
  CreatedDateFilter,
  OrganizationTableRow,
  SortOption,
} from "../types";
import { toCreatePayload, toOrganizationForm, toUpdatePayload } from "../utils";
import {
  createdDateOptions,
  sortOptions,
  statusOptions,
  syncStatusOptions,
} from "../constants";
import { isWithinCreatedDate, sortRows } from "../utils";

const OrganizationForm = ({
  error,
  form,
  onChange,
}: CrudFormContext<AddOrganizationFormState>) => (
  <YStack className="lms-organization-form" gap="$3">
    <OrganizationFormFields form={form} onChange={onChange} />
    {error ? (
      <Text color="#DC2626" fontSize="$caption" lineHeight="$caption">
        {error}
      </Text>
    ) : null}
  </YStack>
);

const parsePositiveInteger = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const OrganizationsPage = () => {
  const searchParams = useSearchParams();
  const bulkStatusMutation = useMutation({
    mutationFn: async (input: {
      active: boolean;
      items: OrganizationTableRow[];
    }) =>
      Promise.all(
        input.items.map((organization) =>
          organizationsApi.update(organization.id, {
            isActive: input.active,
            status: input.active ? "ACTIVE" : "INACTIVE",
          }),
        ),
      ),
  });
  const bulkDeleteMutation = useMutation({
    mutationFn: async (items: OrganizationTableRow[]) =>
      Promise.all(
        items.map((organization) => organizationsApi.remove(organization.id)),
      ),
  });
  const params = new URLSearchParams(searchParams.toString());
  const initialFilters = {
    createdDate: params.get("createdDate") ?? "all",
    search: params.get("search") ?? "",
    sort: params.get("sort") ?? "newest",
    status: params.get("status") ?? "ALL",
    syncStatus: params.get("syncStatus") ?? "ALL",
  };

  return (
    <CrudManagementPage<
      OrganizationTableRow,
      AddOrganizationFormState,
      CreateOrganizationRequest,
      UpdateOrganizationRequest
    >
      clientFilterRows={(rows, filters) => {
        const syncStatus = filters.syncStatus ?? "ALL";
        const createdDate = (filters.createdDate ?? "all") as CreatedDateFilter;
        const filtered = rows.filter(
          (row) =>
            (syncStatus === "ALL" || row.syncStatus === syncStatus) &&
            isWithinCreatedDate(row.createdAt, createdDate),
        );
        return sortRows(filtered, (filters.sort ?? "newest") as SortOption);
      }}
      additionalRowActions={[
        {
          icon: Power,
          id: "toggle",
          label: "Activate / Deactivate",
          permission: "organizations.update",
          onAction: async (organization) => {
            if (!window.confirm(`Change the status of ${organization.name}?`))
              return;
            const active = !organization.isActive;
            await organizationsApi.update(organization.id, {
              isActive: active,
              status: active ? "ACTIVE" : "INACTIVE",
            });
          },
        },
      ]}
      columns={[
        {
          cell: ({ row }) => (
            <YStack gap="$1">
              <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button">
                {row.name}
              </Text>
              <Text color="#52627A" fontSize="$caption">
                {row.code}
              </Text>
            </YStack>
          ),
          header: "Organization",
          id: "organization",
          sticky: true,
          width: 280,
        },
        {
          cell: ({ row }) => (
            <Text color="#52627A" fontSize="$caption">
              {row.primaryAdministrator?.name ?? "Not assigned"}
            </Text>
          ),
          header: "Primary Administrator",
          id: "administrator",
          width: 240,
        },
        {
          cell: ({ row }) => (
            <Text color="#52627A" fontSize="$caption">
              {row.email ?? "-"}
            </Text>
          ),
          header: "Email",
          id: "email",
          width: 240,
        },
        {
          cell: ({ row }) => (
            <Text
              color={row.isActive ? "#047857" : "#64748B"}
              fontSize="$caption"
            >
              {row.isActive ? "Active" : "Inactive"}
            </Text>
          ),
          header: "Status",
          id: "status",
          width: 120,
        },
      ]}
      create={async (payload) =>
        toOrganizationRow(await organizationsApi.create(payload))
      }
      createLabel="Add Organization"
      description="Manage tenant organizations, administrators, access readiness, and LMS tenancy configuration from one role-aware workspace."
      emptyDescription="Create your first tenant organization to start managing LMS data."
      entityLabel="Organization"
      filterDefinitions={[
        { id: "status", label: "Status", options: statusOptions },
        { id: "syncStatus", label: "Sync", options: syncStatusOptions },
        { id: "createdDate", label: "Created", options: createdDateOptions },
        { id: "sort", label: "Sort", options: sortOptions },
      ]}
      getDisplayName={(organization) => organization.name}
      getRowId={(organization) => organization.id}
      getStats={({ rows, total }) => [
        {
          icon: <Database color="#059669" size={20} />,
          label: "Total Organizations",
          value: total,
        },
        {
          icon: <Database color="#059669" size={20} />,
          label: "Active Organizations",
          value: rows.filter((row) => row.isActive).length,
        },
        {
          icon: <Database color="#DC2626" size={20} />,
          label: "Inactive Organizations",
          value: rows.filter((row) => !row.isActive).length,
        },
      ]}
      initialFilters={initialFilters}
      initialPage={parsePositiveInteger(params.get("page"), 1)}
      initialPageSize={parsePositiveInteger(params.get("limit"), 10)}
      initialForm={DEFAULT_FORM}
      permissionPrefix="organizations"
      queryFn={async (query) => {
        const result = await getOrganizations({
          limit: query.limit,
          page: query.page,
          search: query.search,
          status:
            query.status === "ACTIVE" || query.status === "INACTIVE"
              ? query.status
              : undefined,
        });
        return { ...result, items: result.items.map(toOrganizationRow) };
      }}
      queryKey={["admin", "organizations"]}
      renderForm={(context) => <OrganizationForm {...context} />}
      renderDetails={(organization) => (
        <YStack gap="$2">
          <Text color="#52627A" fontSize="$caption">
            Website: {organization.website ?? "-"}
          </Text>
          <Text color="#52627A" fontSize="$caption">
            Created: {organization.createdAt}
          </Text>
          <Text color="#52627A" fontSize="$caption">
            Updated: {organization.updatedAt}
          </Text>
        </YStack>
      )}
      searchPlaceholder="Search name, code, email, phone, website..."
      renderBulkActions={(items, clear, refresh) => (
        <CrudBulkActionBar
          count={items.length}
          onClear={clear}
          onDelete={() => {
            if (
              !window.confirm(`Delete ${items.length} selected organizations?`)
            )
              return;
            void bulkDeleteMutation.mutateAsync(items).then(() => {
              clear();
              return refresh();
            });
          }}
          onSetActive={(active) => {
            void bulkStatusMutation.mutateAsync({ active, items }).then(() => {
              clear();
              return refresh();
            });
          }}
        />
      )}
      remove={async (id) =>
        toOrganizationRow(await organizationsApi.remove(id))
      }
      selectable
      showActiveFilterChips
      statusOptions={[]}
      syncUrl
      title="Organizations"
      toCreatePayload={toCreatePayload}
      toForm={toOrganizationForm}
      toUpdatePayload={toUpdatePayload}
      update={async (id, payload) =>
        toOrganizationRow(await organizationsApi.update(id, payload))
      }
      urlFilterDefaults={{
        createdDate: "all",
        sort: "newest",
        syncStatus: "ALL",
      }}
      validate={(form) =>
        form.name.trim() && form.code.trim()
          ? null
          : "Organization name and code are required."
      }
    />
  );
};

export default OrganizationsPage;
