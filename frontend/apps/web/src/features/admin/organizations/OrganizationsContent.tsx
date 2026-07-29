"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { Button, Input, Text, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";
import { organizationsApi } from "@repo/api";
import type { Organization, OrganizationStatus } from "@repo/types";

import { DataTable, type DataTableRowId } from "@/components/DataTable";

import {
  createOrganizationColumns,
  OrganizationHeaderAction,
  type OrganizationRowActionHandlers,
  type OrganizationSyncStatus,
  type OrganizationTableRow,
} from "./organizationTable.columns";

type CreatedDateFilter = "all" | "today" | "7d" | "30d" | "90d" | "custom";
type SortOption = "newest" | "oldest" | "name-asc" | "name-desc" | "updated";
type AvailabilityFilter =
  | "website"
  | "email"
  | "phone"
  | "logo"
  | "administrator"
  | "courses"
  | "students";

interface OrganizationFiltersState {
  availability: AvailabilityFilter[];
  createdBy: string;
  createdDate: CreatedDateFilter;
  search: string;
  sort: SortOption;
  status: "ALL" | OrganizationStatus;
  syncStatus: "ALL" | OrganizationSyncStatus;
  updatedBy: string;
}

interface OrganizationStat {
  icon: ReactNode;
  label: string;
  value: number;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_FILTERS: OrganizationFiltersState = {
  availability: [],
  createdBy: "",
  createdDate: "all",
  search: "",
  sort: "newest",
  status: "ALL",
  syncStatus: "ALL",
  updatedBy: "",
};

const availabilityOptions: Array<{ label: string; value: AvailabilityFilter }> =
  [
    { label: "Website Available", value: "website" },
    { label: "Email Available", value: "email" },
    { label: "Phone Available", value: "phone" },
    { label: "Has Logo", value: "logo" },
    { label: "Has Administrator Assigned", value: "administrator" },
    { label: "Has Active Courses", value: "courses" },
    { label: "Has Active Students", value: "students" },
  ];

function parseInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getDomain(organization: Organization) {
  const fromWebsite = organization.website
    ?.replace(/^https?:\/\//u, "")
    .split("/")[0];
  const fromEmail = organization.email?.split("@")[1];

  return fromWebsite || fromEmail || null;
}

function getAdministrator(organization: Organization) {
  if (!organization.email) {
    return null;
  }

  const name = organization.email
    .split("@")[0]
    .split(/[._-]/u)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

  return {
    email: organization.email,
    name: name || "Primary Administrator",
  };
}

function getSyncStatus(organization: Organization): OrganizationSyncStatus {
  if (!organization.isActive) {
    return "PENDING";
  }

  return "SYNCED";
}

function toOrganizationRow(organization: Organization): OrganizationTableRow {
  return {
    ...organization,
    domain: getDomain(organization),
    metrics: {
      courses: 0,
      resources: 0,
      storageLimitGb: 0,
      storageUsedGb: 0,
      students: 0,
      users: 0,
    },
    primaryAdministrator: getAdministrator(organization),
    syncStatus: getSyncStatus(organization),
  };
}

function isWithinCreatedDate(value: string, filter: CreatedDateFilter) {
  if (filter === "all" || filter === "custom") {
    return true;
  }

  const createdAt = new Date(value);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const now = new Date();
  const start = new Date(now);

  if (filter === "today") {
    start.setHours(0, 0, 0, 0);
  }

  if (filter === "7d") {
    start.setDate(now.getDate() - 7);
  }

  if (filter === "30d") {
    start.setDate(now.getDate() - 30);
  }

  if (filter === "90d") {
    start.setDate(now.getDate() - 90);
  }

  return createdAt >= start;
}

function applyAvailabilityFilters(
  rows: OrganizationTableRow[],
  availability: AvailabilityFilter[],
) {
  if (!availability.length) {
    return rows;
  }

  return rows.filter((row) =>
    availability.every((filter) => {
      if (filter === "website") return Boolean(row.website);
      if (filter === "email") return Boolean(row.email);
      if (filter === "phone") return Boolean(row.phone);
      if (filter === "logo") return Boolean(row.logo);
      if (filter === "administrator") return Boolean(row.primaryAdministrator);
      if (filter === "courses") return row.metrics.courses > 0;
      if (filter === "students") return row.metrics.students > 0;

      return true;
    }),
  );
}

function sortRows(rows: OrganizationTableRow[], sort: SortOption) {
  return [...rows].sort((first, second) => {
    if (sort === "oldest") {
      return (
        new Date(first.createdAt).getTime() -
        new Date(second.createdAt).getTime()
      );
    }

    if (sort === "name-asc") {
      return first.name.localeCompare(second.name);
    }

    if (sort === "name-desc") {
      return second.name.localeCompare(first.name);
    }

    if (sort === "updated") {
      return (
        new Date(second.updatedAt).getTime() -
        new Date(first.updatedAt).getTime()
      );
    }

    return (
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );
  });
}

function getFiltersFromParams(
  params: URLSearchParams,
): OrganizationFiltersState {
  const status = params.get("status");
  const syncStatus = params.get("syncStatus");
  const createdDate = params.get("createdDate");
  const sort = params.get("sort");
  const availability = params
    .getAll("has")
    .filter((value): value is AvailabilityFilter =>
      availabilityOptions.some((option) => option.value === value),
    );

  return {
    availability,
    createdBy: params.get("createdBy") ?? "",
    createdDate:
      createdDate === "today" ||
      createdDate === "7d" ||
      createdDate === "30d" ||
      createdDate === "90d" ||
      createdDate === "custom"
        ? createdDate
        : "all",
    search: params.get("search") ?? "",
    sort:
      sort === "oldest" ||
      sort === "name-asc" ||
      sort === "name-desc" ||
      sort === "updated"
        ? sort
        : "newest",
    status: status === "ACTIVE" || status === "INACTIVE" ? status : "ALL",
    syncStatus:
      syncStatus === "SYNCED" ||
      syncStatus === "PENDING" ||
      syncStatus === "FAILED"
        ? syncStatus
        : "ALL",
    updatedBy: params.get("updatedBy") ?? "",
  };
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getActiveFilterChips(filters: OrganizationFiltersState) {
  const chips: Array<{ id: string; label: string }> = [];

  if (filters.search)
    chips.push({ id: "search", label: `Search: ${filters.search}` });
  if (filters.status !== "ALL")
    chips.push({ id: "status", label: `Status: ${filters.status}` });
  if (filters.syncStatus !== "ALL")
    chips.push({ id: "syncStatus", label: `Sync: ${filters.syncStatus}` });
  if (filters.createdDate !== "all")
    chips.push({ id: "createdDate", label: `Created: ${filters.createdDate}` });
  if (filters.sort !== "newest")
    chips.push({ id: "sort", label: `Sort: ${filters.sort}` });
  if (filters.createdBy)
    chips.push({ id: "createdBy", label: `Created by: ${filters.createdBy}` });
  if (filters.updatedBy)
    chips.push({ id: "updatedBy", label: `Updated by: ${filters.updatedBy}` });

  filters.availability.forEach((value) => {
    const option = availabilityOptions.find((item) => item.value === value);
    chips.push({ id: `has:${value}`, label: option?.label ?? value });
  });

  return chips;
}

function useAnimatedNumber(value: number, isEnabled: boolean) {
  const [displayValue, setDisplayValue] = useState(isEnabled ? 0 : value);

  useEffect(() => {
    if (!isEnabled) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const frames = 18;
    const startValue = 0;
    const delta = value - startValue;
    const interval = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / frames, 1);
      setDisplayValue(Math.round(startValue + delta * progress));

      if (progress >= 1) {
        window.clearInterval(interval);
      }
    }, 18);

    return () => window.clearInterval(interval);
  }, [isEnabled, value]);

  return displayValue;
}

const OrganizationStatCard = memo(function OrganizationStatCard({
  icon,
  isLoading,
  label,
  value,
}: OrganizationStat & { isLoading: boolean }) {
  const animatedValue = useAnimatedNumber(value, !isLoading);

  return (
    <AppCard
      className="lms-organization-stat-card"
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$3"
      style={{
        borderRadius: 14,
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.035)",
        minHeight: 88,
      }}
    >
      {isLoading ? (
        <YStack gap="$2">
          <XStack className="lms-skeleton" style={{ height: 24, width: 42 }} />
          <XStack className="lms-skeleton" style={{ height: 12, width: 120 }} />
        </YStack>
      ) : (
        <XStack gap="$3" style={{ alignItems: "center" }}>
          <XStack
            style={{
              alignItems: "center",
              backgroundColor: "#EAF7F3",
              borderRadius: 12,
              height: 44,
              justifyContent: "center",
              width: 44,
            }}
          >
            {icon}
          </XStack>
          <YStack gap="$1" style={{ minWidth: 0 }}>
            <Text color="#0F1D3A" fontSize={22} fontWeight="$heading">
              {animatedValue}
            </Text>
            <Text color="#52627A" fontSize="$caption" numberOfLines={1}>
              {label}
            </Text>
          </YStack>
        </XStack>
      )}
    </AppCard>
  );
});

function SelectControl({
  ariaLabel,
  label,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div
      className={[
        "lms-organization-filter-control",
        "lms-organization-select",
        isOpen ? "is-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      ref={rootRef}
    >
      <Button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        background="transparent"
        borderWidth={0}
        height={38}
        onPress={() => setIsOpen((current) => !current)}
        p={0}
        role="combobox"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <YStack gap={1} style={{ minWidth: 0 }}>
          <Text color="#52627A" fontSize={10} fontWeight="$button">
            {label}
          </Text>
          <Button.Text
            color="#0F1D3A"
            fontSize={12}
            fontWeight="$button"
            numberOfLines={1}
          >
            {selectedOption?.label ?? value}
          </Button.Text>
        </YStack>
        <ChevronDown
          aria-hidden="true"
          className="lms-organization-select-chevron"
          color="#52627A"
          size={15}
        />
      </Button>

      {isOpen ? (
        <div
          className="lms-organization-select-menu"
          role="listbox"
          style={{ minWidth: "100%" }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <Button
                aria-selected={isSelected}
                background={isSelected ? "#E4F7EF" : "transparent"}
                borderWidth={0}
                className="lms-organization-select-option"
                height={34}
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                px="$2"
                role="option"
                rounded="$3"
                style={{ justifyContent: "space-between" }}
              >
                <Button.Text
                  color={isSelected ? "#047857" : "#0F1D3A"}
                  fontSize={12}
                  fontWeight={isSelected ? "$button" : "$body"}
                >
                  {option.label}
                </Button.Text>
                {isSelected ? (
                  <Check aria-hidden="true" color="#047857" size={14} />
                ) : null}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function OrganizationFilterToolbar({
  activeFilterCount,
  filters,
  isAdvancedOpen,
  onClearFilters,
  onExport,
  onFilterChange,
  onRefresh,
  onToggleAdvanced,
}: {
  activeFilterCount: number;
  filters: OrganizationFiltersState;
  isAdvancedOpen: boolean;
  onClearFilters: () => void;
  onExport: () => void;
  onFilterChange: (filters: OrganizationFiltersState) => void;
  onRefresh: () => void;
  onToggleAdvanced: () => void;
}) {
  const update = <K extends keyof OrganizationFiltersState>(
    key: K,
    value: OrganizationFiltersState[K],
  ) => onFilterChange({ ...filters, [key]: value });

  const toggleAvailability = (value: AvailabilityFilter) => {
    update(
      "availability",
      filters.availability.includes(value)
        ? filters.availability.filter((item) => item !== value)
        : [...filters.availability, value],
    );
  };

  return (
    <AppCard
      className="lms-organization-filters"
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$4"
      style={{
        borderRadius: 16,
        boxShadow: "0 12px 34px rgba(15, 23, 42, 0.04)",
      }}
    >
      <YStack gap="$3">
        <XStack
          className="lms-organization-filter-row"
          gap="$3"
          style={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <XStack
            className="lms-organization-search"
            gap="$3"
            px="$3"
            style={{
              alignItems: "center",
              backgroundColor: "#FCFCFD",
              borderColor: "#D8E1EC",
              borderRadius: 12,
              borderWidth: 1,
              flex: "1 1 360px",
              maxWidth: 560,
              minHeight: 42,
            }}
          >
            <Search aria-hidden="true" color="#52627A" size={18} />
            <Input
              aria-label="Search organizations"
              background="transparent"
              borderWidth={0}
              flex={1}
              height={36}
              onChangeText={(value) => update("search", value)}
              p={0}
              placeholder="Search name, code, email, phone, website, admin, domain..."
              placeholderTextColor={"#52627A" as never}
              value={filters.search}
            />
          </XStack>

          <SelectControl
            ariaLabel="Filter by organization status"
            label="Status"
            onChange={(value) =>
              update(
                "status",
                value === "ACTIVE" || value === "INACTIVE" ? value : "ALL",
              )
            }
            options={[
              { label: "All", value: "ALL" },
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ]}
            value={filters.status}
          />
          <SelectControl
            ariaLabel="Filter by sync status"
            label="Sync"
            onChange={(value) =>
              update(
                "syncStatus",
                value === "SYNCED" || value === "PENDING" || value === "FAILED"
                  ? value
                  : "ALL",
              )
            }
            options={[
              { label: "All", value: "ALL" },
              { label: "Synced", value: "SYNCED" },
              { label: "Pending", value: "PENDING" },
              { label: "Failed", value: "FAILED" },
            ]}
            value={filters.syncStatus}
          />
          <SelectControl
            ariaLabel="Filter by created date"
            label="Created"
            onChange={(value) =>
              update(
                "createdDate",
                value === "today" ||
                  value === "7d" ||
                  value === "30d" ||
                  value === "90d" ||
                  value === "custom"
                  ? value
                  : "all",
              )
            }
            options={[
              { label: "Any time", value: "all" },
              { label: "Today", value: "today" },
              { label: "Last 7 days", value: "7d" },
              { label: "Last 30 days", value: "30d" },
              { label: "Last 90 days", value: "90d" },
              { label: "Custom Range", value: "custom" },
            ]}
            value={filters.createdDate}
          />
          <SelectControl
            ariaLabel="Sort organizations"
            label="Sort"
            onChange={(value) =>
              update(
                "sort",
                value === "oldest" ||
                  value === "name-asc" ||
                  value === "name-desc" ||
                  value === "updated"
                  ? value
                  : "newest",
              )
            }
            options={[
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
              { label: "Name A-Z", value: "name-asc" },
              { label: "Name Z-A", value: "name-desc" },
              { label: "Recently Updated", value: "updated" },
            ]}
            value={filters.sort}
          />
          <Button
            aria-expanded={isAdvancedOpen}
            aria-label="Toggle advanced filters"
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            height={40}
            onPress={onToggleAdvanced}
            rounded="$4"
          >
            <SlidersHorizontal aria-hidden="true" color="#0F1D3A" size={16} />
            <Button.Text fontSize="$caption" fontWeight="$button">
              Advanced {activeFilterCount ? `(${activeFilterCount})` : ""}
            </Button.Text>
          </Button>
          <Button
            aria-label="Clear filters"
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            height={40}
            onPress={onClearFilters}
            rounded="$4"
          >
            <X aria-hidden="true" color="#0F1D3A" size={16} />
            <Button.Text fontSize="$caption" fontWeight="$button">
              Clear
            </Button.Text>
          </Button>
          <Button
            aria-label="Refresh organizations"
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            height={40}
            onPress={onRefresh}
            rounded="$4"
            width={40}
          >
            <RefreshCw aria-hidden="true" color="#0F1D3A" size={16} />
          </Button>
          <Button
            aria-label="Export organizations"
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            height={40}
            onPress={onExport}
            rounded="$4"
          >
            <Download aria-hidden="true" color="#0F1D3A" size={16} />
            <Button.Text fontSize="$caption" fontWeight="$button">
              Export
            </Button.Text>
          </Button>
        </XStack>

        {isAdvancedOpen ? (
          <YStack className="lms-organization-advanced-filters" gap="$3">
            <XStack gap="$2" style={{ flexWrap: "wrap" }}>
              {availabilityOptions.map((option) => {
                const isSelected = filters.availability.includes(option.value);

                return (
                  <Button
                    aria-pressed={isSelected}
                    background={isSelected ? "#DDF4E7" : "#FFFFFF"}
                    borderColor={isSelected ? "#8DD3B0" : "#D8E1EC"}
                    borderWidth={1}
                    height={36}
                    key={option.value}
                    onPress={() => toggleAvailability(option.value)}
                    rounded="$6"
                  >
                    <Button.Text
                      color={isSelected ? "#047857" : "#0F1D3A"}
                      fontSize="$caption"
                      fontWeight="$button"
                    >
                      {option.label}
                    </Button.Text>
                  </Button>
                );
              })}
            </XStack>

            <XStack gap="$3" style={{ flexWrap: "wrap" }}>
              <Input
                aria-label="Created by"
                borderColor="#D8E1EC"
                height={40}
                onChangeText={(value) => update("createdBy", value)}
                placeholder="Created by"
                style={{ minWidth: 220 }}
                value={filters.createdBy}
              />
              <Input
                aria-label="Updated by"
                borderColor="#D8E1EC"
                height={40}
                onChangeText={(value) => update("updatedBy", value)}
                placeholder="Updated by"
                style={{ minWidth: 220 }}
                value={filters.updatedBy}
              />
            </XStack>
          </YStack>
        ) : null}
      </YStack>
    </AppCard>
  );
}

function ActiveFilterChips({
  filters,
  onClear,
  onRemove,
}: {
  filters: Array<{ id: string; label: string }>;
  onClear: () => void;
  onRemove: (id: string) => void;
}) {
  if (!filters.length) {
    return null;
  }

  return (
    <XStack gap="$2" style={{ alignItems: "center", flexWrap: "wrap" }}>
      <Text color="#52627A" fontSize="$caption" fontWeight="$button">
        {filters.length} active filters
      </Text>
      {filters.map((filter) => (
        <Button
          aria-label={`Remove ${filter.label}`}
          background="#F8FBFD"
          borderColor="#D8E1EC"
          borderWidth={1}
          height={32}
          key={filter.id}
          onPress={() => onRemove(filter.id)}
          rounded="$6"
        >
          <Button.Text color="#0F1D3A" fontSize="$caption">
            {filter.label}
          </Button.Text>
          <X aria-hidden="true" color="#52627A" size={13} />
        </Button>
      ))}
      <Button chromeless height={32} onPress={onClear}>
        <Button.Text color="#047857" fontSize="$caption" fontWeight="$button">
          Clear all
        </Button.Text>
      </Button>
    </XStack>
  );
}

function BulkActionBar({
  count,
  onClear,
  onDelete,
  onExport,
  onSetActive,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onExport: () => void;
  onSetActive: (active: boolean) => void;
}) {
  if (!count) {
    return null;
  }

  return (
    <XStack
      className="lms-organization-bulk-bar"
      gap="$2"
      p="$3"
      style={{
        alignItems: "center",
        backgroundColor: "#F2FAF7",
        borderColor: "#B7E4CB",
        borderRadius: 14,
        borderWidth: 1,
        flexWrap: "wrap",
        justifyContent: "space-between",
      }}
    >
      <Text color="#047857" fontSize="$caption" fontWeight="$button">
        {count} selected
      </Text>
      <XStack gap="$2" style={{ flexWrap: "wrap" }}>
        <Button height={34} onPress={() => onSetActive(true)} rounded="$3">
          <Button.Text fontSize="$caption">Activate</Button.Text>
        </Button>
        <Button height={34} onPress={() => onSetActive(false)} rounded="$3">
          <Button.Text fontSize="$caption">Deactivate</Button.Text>
        </Button>
        <Button height={34} onPress={onExport} rounded="$3">
          <Download aria-hidden="true" size={14} />
          <Button.Text fontSize="$caption">Export Selected</Button.Text>
        </Button>
        <Button height={34} onPress={onDelete} rounded="$3">
          <Trash2 aria-hidden="true" color="#DC2626" size={14} />
          <Button.Text color="#DC2626" fontSize="$caption">
            Delete Selected
          </Button.Text>
        </Button>
        <Button chromeless height={34} onPress={onClear} rounded="$3">
          <Button.Text color="#0F1D3A" fontSize="$caption">
            Clear Selection
          </Button.Text>
        </Button>
      </XStack>
    </XStack>
  );
}

function OrganizationSidePanel({
  isLoading,
  organization,
}: {
  isLoading: boolean;
  organization: OrganizationTableRow | null;
}) {
  if (!organization && !isLoading) {
    return null;
  }

  return (
    <AppCard
      className="lms-organization-side-panel"
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$4"
      style={{
        borderRadius: 16,
        boxShadow: "0 12px 34px rgba(15, 23, 42, 0.045)",
        minWidth: 300,
      }}
    >
      {isLoading || !organization ? (
        <YStack gap="$3">
          <XStack className="lms-skeleton" style={{ height: 56, width: 56 }} />
          <XStack className="lms-skeleton" style={{ height: 18, width: 180 }} />
          <XStack
            className="lms-skeleton"
            style={{ height: 120, width: "100%" }}
          />
        </YStack>
      ) : (
        <YStack gap="$4">
          <XStack gap="$3" style={{ alignItems: "center" }}>
            <XStack
              style={{
                alignItems: "center",
                backgroundColor: "#DDF4E7",
                borderRadius: 999,
                height: 58,
                justifyContent: "center",
                width: 58,
              }}
            >
              <Text color="#047857" fontSize={22} fontWeight="$heading">
                {organization.name.slice(0, 1)}
              </Text>
            </XStack>
            <YStack style={{ minWidth: 0 }}>
              <Text
                color="#0F1D3A"
                fontSize="$label"
                fontWeight="$heading"
                numberOfLines={1}
              >
                {organization.name}
              </Text>
              <Text color="#52627A" fontSize="$caption" numberOfLines={1}>
                {organization.code}
              </Text>
            </YStack>
          </XStack>

          <XStack gap="$2" style={{ flexWrap: "wrap" }}>
            <Text
              color={organization.isActive ? "#047857" : "#64748B"}
              fontSize="$caption"
              fontWeight="$button"
              px="$2"
              py="$1"
              rounded="$3"
              style={{
                backgroundColor: organization.isActive ? "#DDF4E7" : "#F1F5F9",
              }}
            >
              {organization.isActive ? "Active" : "Inactive"}
            </Text>
            <Text
              color="#047857"
              fontSize="$caption"
              fontWeight="$button"
              px="$2"
              py="$1"
              rounded="$3"
              style={{ backgroundColor: "#DDF4E7" }}
            >
              Synced
            </Text>
          </XStack>

          <YStack gap="$2">
            <PanelMetric label="Website" value={organization.domain ?? "-"} />
            <PanelMetric
              label="Administrator"
              value={organization.primaryAdministrator?.name ?? "Not assigned"}
            />
            <PanelMetric
              label="Created"
              value={formatDate(organization.createdAt)}
            />
            <PanelMetric
              label="Updated"
              value={formatDate(organization.updatedAt)}
            />
          </YStack>

          <XStack gap="$2" style={{ flexWrap: "wrap" }}>
            <PanelCount label="Users" value={organization.metrics.users} />
            <PanelCount
              label="Students"
              value={organization.metrics.students}
            />
            <PanelCount label="Courses" value={organization.metrics.courses} />
            <PanelCount
              label="Resources"
              value={organization.metrics.resources}
            />
          </XStack>

          <YStack gap="$2">
            <XStack style={{ justifyContent: "space-between" }}>
              <Text color="#52627A" fontSize="$caption">
                Storage Usage
              </Text>
              <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button">
                {organization.metrics.storageUsedGb} GB /{" "}
                {organization.metrics.storageLimitGb || 0} GB
              </Text>
            </XStack>
            <XStack
              style={{
                backgroundColor: "#E8EEF6",
                borderRadius: 999,
                height: 6,
                overflow: "hidden",
              }}
            >
              <XStack
                style={{
                  backgroundColor: "#059669",
                  width: "0%",
                }}
              />
            </XStack>
          </YStack>

          <YStack
            gap="$2"
            p="$3"
            style={{
              backgroundColor: "#F8FBFD",
              borderColor: "#D8E1EC",
              borderRadius: 12,
              borderWidth: 1,
            }}
          >
            <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button">
              Quick Health Summary
            </Text>
            <Text color="#52627A" fontSize="$caption">
              Contact data is {organization.email ? "available" : "incomplete"}.
              Courses and students will appear when those modules are connected.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button">
              Recent Activity
            </Text>
            <Text color="#52627A" fontSize="$caption">
              Updated on {formatDate(organization.updatedAt)}
            </Text>
          </YStack>

          <Button
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            height={40}
            rounded="$4"
          >
            <Button.Text
              color="#047857"
              fontSize="$caption"
              fontWeight="$button"
            >
              View Organization Details
            </Button.Text>
          </Button>
        </YStack>
      )}
    </AppCard>
  );
}

function PanelMetric({ label, value }: { label: string; value: string }) {
  return (
    <XStack style={{ justifyContent: "space-between" }}>
      <Text color="#52627A" fontSize="$caption">
        {label}
      </Text>
      <Text
        color="#0F1D3A"
        fontSize="$caption"
        fontWeight="$button"
        numberOfLines={1}
      >
        {value}
      </Text>
    </XStack>
  );
}

function PanelCount({ label, value }: { label: string; value: number }) {
  return (
    <YStack
      gap="$1"
      p="$2"
      style={{
        backgroundColor: "#F8FBFD",
        borderColor: "#E1E7F0",
        borderRadius: 10,
        borderWidth: 1,
        flex: "1 1 45%",
      }}
    >
      <Text color="#0F1D3A" fontSize="$label" fontWeight="$heading">
        {value}
      </Text>
      <Text color="#52627A" fontSize={11}>
        {label}
      </Text>
    </YStack>
  );
}

export function OrganizationsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(() =>
    parseInteger(searchParams.get("page"), 1),
  );
  const [pageSize, setPageSize] = useState(() =>
    parseInteger(searchParams.get("limit"), 10),
  );
  const [filters, setFilters] = useState<OrganizationFiltersState>(() =>
    getFiltersFromParams(searchParams),
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<DataTableRowId[]>([]);
  const [selectedOrganization, setSelectedOrganization] =
    useState<OrganizationTableRow | null>(null);

  const serverStatus =
    filters.status === "ACTIVE" || filters.status === "INACTIVE"
      ? filters.status
      : undefined;

  const organizationsQuery = useQuery({
    queryFn: () =>
      organizationsApi.findAll({
        limit: pageSize,
        page,
        search: filters.search || undefined,
        status: serverStatus,
      }),
    queryKey: [
      "admin",
      "organizations",
      page,
      pageSize,
      filters.search,
      serverStatus,
    ],
    staleTime: 30_000,
  });

  const rows = useMemo(
    () => (organizationsQuery.data?.items ?? []).map(toOrganizationRow),
    [organizationsQuery.data?.items],
  );

  const filteredRows = useMemo(() => {
    const syncFiltered =
      filters.syncStatus === "ALL"
        ? rows
        : rows.filter((row) => row.syncStatus === filters.syncStatus);
    const dateFiltered = syncFiltered.filter((row) =>
      isWithinCreatedDate(row.createdAt, filters.createdDate),
    );
    const advancedFiltered = applyAvailabilityFilters(
      dateFiltered,
      filters.availability,
    );

    return sortRows(advancedFiltered, filters.sort);
  }, [filters, rows]);

  const meta = organizationsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const activeCount = rows.filter(
    (row) => row.status === "ACTIVE" && row.isActive,
  ).length;
  const inactiveCount = rows.filter(
    (row) => row.status === "INACTIVE" || !row.isActive,
  ).length;
  const newlyCreatedCount = rows.filter((row) =>
    isWithinCreatedDate(row.createdAt, "30d"),
  ).length;
  const activeChips = useMemo(() => getActiveFilterChips(filters), [filters]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("limit", String(pageSize));
    if (filters.search) params.set("search", filters.search);
    if (filters.status !== "ALL") params.set("status", filters.status);
    if (filters.syncStatus !== "ALL")
      params.set("syncStatus", filters.syncStatus);
    if (filters.createdDate !== "all")
      params.set("createdDate", filters.createdDate);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (filters.createdBy) params.set("createdBy", filters.createdBy);
    if (filters.updatedBy) params.set("updatedBy", filters.updatedBy);
    filters.availability.forEach((value) => params.append("has", value));

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [filters, page, pageSize, pathname, router]);

  useEffect(() => {
    if (!selectedOrganization) {
      return;
    }

    const nextSelected = rows.find((row) => row.id === selectedOrganization.id);
    if (nextSelected) {
      setSelectedOrganization(nextSelected);
    }
  }, [rows, selectedOrganization]);

  const updateFilters = useCallback((nextFilters: OrganizationFiltersState) => {
    setFilters(nextFilters);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const removeFilter = useCallback(
    (id: string) => {
      if (id.startsWith("has:")) {
        const value = id.replace("has:", "") as AvailabilityFilter;
        updateFilters({
          ...filters,
          availability: filters.availability.filter((item) => item !== value),
        });
        return;
      }

      updateFilters({
        ...filters,
        [id]:
          id === "search" || id === "createdBy" || id === "updatedBy"
            ? ""
            : id === "sort"
              ? "newest"
              : id === "createdDate"
                ? "all"
                : "ALL",
      } as OrganizationFiltersState);
    },
    [filters, updateFilters],
  );

  const handleExport = useCallback(() => {
    console.info("Export organizations", { filters, page, pageSize });
  }, [filters, page, pageSize]);

  const handleAddOrganization = useCallback(() => {
    console.info("Add organization");
  }, []);

  const handleConfirmedAction = useCallback(
    (message: string, callback: () => void) => {
      if (window.confirm(message)) {
        callback();
      }
    },
    [],
  );

  const rowActionHandlers = useMemo<OrganizationRowActionHandlers>(
    () => ({
      onAssignCourses: (organization) =>
        console.info("Assign courses", organization.id),
      onDelete: (organization) =>
        handleConfirmedAction(`Delete ${organization.name}?`, () =>
          console.info("Delete organization", organization.id),
        ),
      onEdit: (organization) =>
        console.info("Edit organization", organization.id),
      onManageUsers: (organization) =>
        console.info("Manage users", organization.id),
      onToggleActive: (organization) =>
        handleConfirmedAction(
          `${organization.isActive ? "Deactivate" : "Activate"} ${organization.name}?`,
          () => console.info("Toggle organization", organization.id),
        ),
      onView: (organization) => setSelectedOrganization(organization),
      onViewAnalytics: (organization) =>
        console.info("View analytics", organization.id),
    }),
    [handleConfirmedAction],
  );

  const columns = useMemo(
    () => createOrganizationColumns(rowActionHandlers),
    [rowActionHandlers],
  );

  const stats: OrganizationStat[] = [
    {
      icon: <Building2 aria-hidden="true" color="#059669" size={20} />,
      label: "Total Organizations",
      value: total,
    },
    {
      icon: <CheckCircle2 aria-hidden="true" color="#059669" size={20} />,
      label: "Active Organizations",
      value: activeCount,
    },
    {
      icon: <XCircle aria-hidden="true" color="#DC2626" size={20} />,
      label: "Inactive Organizations",
      value: inactiveCount,
    },
    {
      icon: <Activity aria-hidden="true" color="#2563EB" size={20} />,
      label: "Newly Created (Last 30 Days)",
      value: newlyCreatedCount,
    },
  ];

  const hasFilters = activeChips.length > 0;
  const emptyDescription =
    filters.search || hasFilters
      ? "No organizations match the current search or filter criteria."
      : "Create your first tenant organization to start managing LMS data.";

  return (
    <YStack
      className="lms-organizations-page"
      gap="$5"
      style={{ width: "100%" }}
    >
      <XStack
        className="lms-organizations-header"
        gap="$4"
        style={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <YStack gap="$2" style={{ maxWidth: 720, minWidth: 0 }}>
          <XStack gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <Text color="#0F1D3A" fontSize={30} fontWeight="$heading">
              Organizations
            </Text>
            <XStack
              px="$3"
              py="$1"
              rounded="$6"
              style={{
                alignItems: "center",
                backgroundColor: organizationsQuery.isFetching
                  ? "#EFF6FF"
                  : "#DDF4E7",
                borderColor: organizationsQuery.isFetching
                  ? "#BFDBFE"
                  : "#B7E4CB",
                borderWidth: 1,
                transition:
                  "background-color 180ms ease, border-color 180ms ease",
              }}
            >
              <Text
                color={organizationsQuery.isFetching ? "#2563EB" : "#047857"}
                fontSize={11}
                fontWeight="$button"
              >
                {organizationsQuery.isFetching ? "Syncing" : "Synced"}
              </Text>
            </XStack>
          </XStack>
          <Text color="#52627A" fontSize="$label" lineHeight="$label">
            Manage tenant organizations, administrators, access readiness, and
            LMS tenancy configuration from one role-aware workspace.
          </Text>
        </YStack>

        <XStack
          className="lms-organizations-actions"
          gap="$3"
          style={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <OrganizationHeaderAction
            icon={<RefreshCw aria-hidden="true" size={16} />}
            onPress={() => organizationsQuery.refetch()}
          >
            Refresh
          </OrganizationHeaderAction>
          <OrganizationHeaderAction
            icon={<Download aria-hidden="true" size={16} />}
            onPress={handleExport}
          >
            Export
          </OrganizationHeaderAction>
          <OrganizationHeaderAction
            icon={<Plus aria-hidden="true" color="#FFFFFF" size={16} />}
            onPress={handleAddOrganization}
            primary
          >
            Add Organization
          </OrganizationHeaderAction>
        </XStack>
      </XStack>

      <XStack
        className="lms-organization-stats-grid"
        gap="$3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        }}
      >
        {stats.map((stat) => (
          <OrganizationStatCard
            icon={stat.icon}
            isLoading={organizationsQuery.isLoading}
            key={stat.label}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </XStack>

      <OrganizationFilterToolbar
        activeFilterCount={activeChips.length}
        filters={filters}
        isAdvancedOpen={isAdvancedOpen}
        onClearFilters={clearFilters}
        onExport={handleExport}
        onFilterChange={updateFilters}
        onRefresh={() => organizationsQuery.refetch()}
        onToggleAdvanced={() => setIsAdvancedOpen((current) => !current)}
      />

      <ActiveFilterChips
        filters={activeChips}
        onClear={clearFilters}
        onRemove={removeFilter}
      />

      <XStack
        className="lms-organization-management-grid"
        gap="$4"
        style={{ alignItems: "flex-start", width: "100%" }}
      >
        <YStack gap="$3" style={{ flex: 1, minWidth: 0 }}>
          <BulkActionBar
            count={selectedRowIds.length}
            onClear={() => setSelectedRowIds([])}
            onDelete={() =>
              handleConfirmedAction(
                `Delete ${selectedRowIds.length} selected organizations?`,
                () => console.info("Delete selected", selectedRowIds),
              )
            }
            onExport={() => console.info("Export selected", selectedRowIds)}
            onSetActive={(active) =>
              console.info(
                active ? "Activate selected" : "Deactivate selected",
                selectedRowIds,
              )
            }
          />

          <DataTable<OrganizationTableRow>
            columns={columns}
            data={filteredRows}
            emptyState={{
              description: emptyDescription,
              primaryAction: (
                <OrganizationHeaderAction
                  icon={<Plus aria-hidden="true" color="#FFFFFF" size={16} />}
                  onPress={handleAddOrganization}
                  primary
                >
                  Add Organization
                </OrganizationHeaderAction>
              ),
              title:
                filters.search || hasFilters
                  ? "No matching organizations"
                  : "No organizations found",
            }}
            error={
              organizationsQuery.isError
                ? {
                    description:
                      organizationsQuery.error instanceof Error
                        ? organizationsQuery.error.message
                        : "The organization list could not be loaded.",
                    onRetry: () => organizationsQuery.refetch(),
                    retryLabel: "Retry",
                    title: "Unable to load organizations",
                  }
                : null
            }
            getRowId={(organization) => organization.id}
            loading={organizationsQuery.isLoading}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
            onRowClick={setSelectedOrganization}
            onSelectionChange={(ids, selectedRows) => {
              setSelectedRowIds(ids);
              setSelectedOrganization(selectedRows[0] ?? null);
            }}
            pagination={{
              entityLabel: "organizations",
              mode: "server",
              page,
              pageSize,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              total,
              totalPages: meta?.totalPages ?? 1,
            }}
            renderToolbar={() => null}
            searchable={false}
            selectable
            selectedRowIds={selectedRowIds}
            stickyFirstColumn
            stickyHeader
          />
        </YStack>

        <OrganizationSidePanel
          isLoading={
            organizationsQuery.isLoading && Boolean(selectedRowIds.length)
          }
          organization={selectedOrganization}
        />
      </XStack>
    </YStack>
  );
}
