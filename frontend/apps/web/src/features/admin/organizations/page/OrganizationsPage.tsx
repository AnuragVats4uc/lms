"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  AtSign,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Power,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { organizationsApi } from "@repo/api";
import { organizationSchema } from "@repo/validation";
import type {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from "@repo/types";
import { Text, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";

import {
  CrudBulkActionBar,
  CrudBadge,
  CrudDetailField,
  CrudDetailSection,
  CrudStatusConfirmationDialog,
} from "../../components/crud";
import {
  CrudManagementPage,
  type CrudFormContext,
} from "../../components/crud/CrudManagementPage";
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
}: CrudFormContext<AddOrganizationFormState>) => (
  <YStack className="lms-organization-form" gap="$3">
    <OrganizationFormFields />
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

const formatOrganizationDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

const OrganizationTableValue = ({
  children,
  muted = true,
}: {
  children: ReactNode;
  muted?: boolean;
}) => (
  <Text
    color={muted ? "#52627A" : "#0F1D3A"}
    fontSize="$caption"
    numberOfLines={2}
  >
    {children || "-"}
  </Text>
);

interface OrganizationStatusConfirmation {
  active: boolean;
  clearSelection?: () => void;
  items: OrganizationTableRow[];
}

export const OrganizationsPage = () => {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [statusConfirmation, setStatusConfirmation] =
    useState<OrganizationStatusConfirmation | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

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

  const requestStatusChange = (
    items: OrganizationTableRow[],
    active: boolean,
    clearSelection?: () => void,
  ) => {
    setStatusError(null);
    setStatusConfirmation({ active, clearSelection, items });
  };

  const confirmStatusChange = async () => {
    if (!statusConfirmation) return;

    try {
      await bulkStatusMutation.mutateAsync({
        active: statusConfirmation.active,
        items: statusConfirmation.items,
      });
      statusConfirmation.clearSelection?.();
      await queryClient.invalidateQueries({
        queryKey: ["admin", "organizations"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin-dashboard"],
      });
      setStatusConfirmation(null);
      setStatusError(null);
    } catch {
      setStatusError("The organization status could not be updated.");
    }
  };

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
      additionalDialogs={
        <CrudStatusConfirmationDialog
          active={statusConfirmation?.active ?? true}
          count={statusConfirmation?.items.length ?? 0}
          entityLabel="Organization"
          error={statusError ?? undefined}
          isOpen={Boolean(statusConfirmation)}
          isSubmitting={bulkStatusMutation.isPending}
          onClose={() => {
            if (!bulkStatusMutation.isPending) {
              setStatusConfirmation(null);
              setStatusError(null);
            }
          }}
          onConfirm={() => void confirmStatusChange()}
        />
      }
      additionalRowActions={[
        {
          icon: Power,
          id: "toggle",
          label: "Activate / Deactivate",
          permission: "organizations.update",
          onAction: async (organization) =>
            requestStatusChange([organization], !organization.isActive),
        },
      ]}
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
            <OrganizationTableValue>{row.description}</OrganizationTableValue>
          ),
          header: "Description",
          id: "description",
          width: 260,
        },
        {
          cell: ({ row }) => (
            <OrganizationTableValue>{row.logo}</OrganizationTableValue>
          ),
          header: "Logo",
          id: "logo",
          width: 220,
        },
        {
          cell: ({ row }) => (
            <OrganizationTableValue>{row.website}</OrganizationTableValue>
          ),
          header: "Website",
          id: "website",
          width: 220,
        },
        {
          cell: ({ row }) => (
            <OrganizationTableValue>{row.email}</OrganizationTableValue>
          ),
          header: "Email",
          id: "email",
          width: 240,
        },
        {
          cell: ({ row }) => (
            <OrganizationTableValue>{row.phone}</OrganizationTableValue>
          ),
          header: "Phone",
          id: "phone",
          width: 160,
        },
        {
          cell: ({ row }) => (
            <OrganizationTableValue>{row.address}</OrganizationTableValue>
          ),
          header: "Address",
          id: "address",
          width: 240,
        },
        {
          cell: ({ row }) => (
            <CrudBadge tone={row.status === "ACTIVE" ? "success" : "danger"}>
              {row.status}
            </CrudBadge>
          ),
          header: "Status",
          id: "status",
          width: 110,
        },
        {
          cell: ({ row }) => (
            <OrganizationTableValue>
              {formatOrganizationDate(row.createdAt)}
            </OrganizationTableValue>
          ),
          header: "Created",
          id: "createdAt",
          width: 170,
        },
        {
          cell: ({ row }) => (
            <OrganizationTableValue>
              {formatOrganizationDate(row.updatedAt)}
            </OrganizationTableValue>
          ),
          header: "Updated",
          id: "updatedAt",
          width: 170,
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
        {
          icon: <CalendarDays color="#059669" size={20} />,
          label: "Recently Created",
          value: rows.filter(
            (row) =>
              Date.now() - new Date(row.createdAt).getTime() <=
              30 * 24 * 60 * 60 * 1000,
          ).length,
        },
      ]}
      initialFilters={initialFilters}
      initialPage={parsePositiveInteger(params.get("page"), 1)}
      initialPageSize={parsePositiveInteger(params.get("limit"), 10)}
      initialForm={DEFAULT_FORM}
      formResolver={zodResolver(organizationSchema)}
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
        <YStack gap="$3">
          <AppCard
            background="#EAF7F3"
            borderColor="#B7E4CB"
            borderWidth={1}
            p="$3"
            rounded="$4"
          >
            <XStack gap="$3" style={{ alignItems: "center" }}>
              <XStack
                background="#FFFFFF"
                height={48}
                justify="center"
                rounded="$4"
                width={48}
                style={{ alignItems: "center" }}
              >
                <Building2 color="#059669" size={24} />
              </XStack>
              <YStack gap="$1" minW={0} style={{ flex: 1 }}>
                <Text
                  color="#047857"
                  fontSize="$label"
                  fontWeight="$heading"
                  numberOfLines={2}
                >
                  {organization.name}
                </Text>
                <Text color="#52627A" fontSize="$caption">
                  {organization.code} · {organization.domain ?? "No domain"}
                </Text>
              </YStack>
            </XStack>
          </AppCard>
          <CrudDetailSection
            icon={<ShieldCheck color="#059669" size={15} />}
            title="Status"
          >
            <CrudDetailField
              icon={
                <CheckCircle2
                  color={organization.isActive ? "#059669" : "#DC2626"}
                  size={15}
                />
              }
              label="Status"
              value={`${organization.status} · ${organization.isActive ? "Active" : "Inactive"}`}
            />
          </CrudDetailSection>
          <CrudDetailSection
            icon={<AtSign color="#059669" size={15} />}
            title="Contact information"
          >
            <CrudDetailField
              icon={<Mail color="#059669" size={15} />}
              label="Email"
              value={organization.email}
            />
            <CrudDetailField
              icon={<Phone color="#059669" size={15} />}
              label="Phone"
              value={organization.phone}
            />
            <CrudDetailField
              icon={<Globe2 color="#059669" size={15} />}
              label="Website"
              value={organization.website}
            />
            <CrudDetailField
              icon={<MapPin color="#059669" size={15} />}
              label="Address"
              value={organization.address}
            />
          </CrudDetailSection>
          <CrudDetailSection
            icon={<UserRound color="#059669" size={15} />}
            title="Administration"
          >
            <CrudDetailField
              icon={<UserRound color="#059669" size={15} />}
              label="Primary administrator"
              value={
                organization.primaryAdministrator
                  ? `${organization.primaryAdministrator.name} · ${organization.primaryAdministrator.email}`
                  : "Not assigned"
              }
            />
            <CrudDetailField
              icon={<ExternalLink color="#059669" size={15} />}
              label="Logo URL"
              value={organization.logo}
            />
            <CrudDetailField
              icon={<Activity color="#059669" size={15} />}
              label="Description"
              value={organization.description}
            />
          </CrudDetailSection>
          <CrudDetailSection
            icon={<CalendarDays color="#059669" size={15} />}
            title="Record history"
          >
            <CrudDetailField
              icon={<CalendarDays color="#059669" size={15} />}
              label="Created"
              value={formatOrganizationDate(organization.createdAt)}
            />
            <CrudDetailField
              icon={<Clock3 color="#059669" size={15} />}
              label="Last updated"
              value={formatOrganizationDate(organization.updatedAt)}
            />
          </CrudDetailSection>
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
            ) {
              return;
            }
            void bulkDeleteMutation.mutateAsync(items).then(() => {
              clear();
              return Promise.all([
                refresh(),
                queryClient.invalidateQueries({
                  queryKey: ["admin-dashboard"],
                }),
              ]);
            });
          }}
          onSetActive={(active) => requestStatusChange(items, active, clear)}
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
    />
  );
};

export default OrganizationsPage;
