import { RefreshCw, X } from "lucide-react";
import { Button, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";
import { OrganizationSearch, OrganizationSelect } from "../../organizations/components/filters";
import type { Organization } from "@repo/types";
import type { SessionFiltersState } from "../types";

const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Archived", value: "ARCHIVED" },
];
const sortOptions = [
  { label: "Newest", value: "createdAt:desc" },
  { label: "Oldest", value: "createdAt:asc" },
  { label: "Name A-Z", value: "name:asc" },
  { label: "Name Z-A", value: "name:desc" },
  { label: "Start date", value: "startDate:asc" },
  { label: "Recently updated", value: "updatedAt:desc" },
];

export function SessionToolbar({
  filters,
  onClear,
  onOrganizationChange,
  onRefresh,
  onSearch,
  onSort,
  onStatus,
  organizations,
}: {
  filters: SessionFiltersState;
  onClear: () => void;
  onOrganizationChange: (organizationId: number) => void;
  onRefresh: () => void;
  onSearch: (value: string) => void;
  onSort: (sort: SessionFiltersState["sort"], order: SessionFiltersState["order"]) => void;
  onStatus: (status: SessionFiltersState["status"]) => void;
  organizations: Organization[];
}) {
  const selectedSort = `${filters.sort}:${filters.order}`;
  return (
    <AppCard className="lms-organization-filters" background="#FFFFFF" borderColor="#E1E7F0" p="$4" style={{ borderRadius: 16, boxShadow: "0 12px 34px rgba(15, 23, 42, 0.04)" }}>
      <YStack gap="$3">
        <XStack className="lms-organization-filter-row" gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
          {organizations.length ? <OrganizationSelect ariaLabel="Select organization" label="Organization" onChange={(value) => onOrganizationChange(Number(value))} options={organizations.map((organization) => ({ label: organization.name, value: String(organization.id) }))} value={filters.organizationId === null ? "" : String(filters.organizationId)} /> : null}
          <OrganizationSearch ariaLabel="Search sessions" onChange={onSearch} placeholder="Search session name or code..." value={filters.search} />
          <OrganizationSelect ariaLabel="Filter sessions by status" label="Status" onChange={(value) => onStatus(value as SessionFiltersState["status"])} options={statusOptions} value={filters.status} />
          <OrganizationSelect ariaLabel="Sort sessions" label="Sort" onChange={(value) => { const [sort, order] = value.split(":"); onSort(sort as SessionFiltersState["sort"], order as SessionFiltersState["order"]); }} options={sortOptions} value={selectedSort} />
          <Button aria-label="Clear session filters" background="#FFFFFF" borderColor="#D8E1EC" borderWidth={1} className="lms-organization-toolbar-button" height={40} onPress={onClear} rounded="$4"><X aria-hidden="true" color="#0F1D3A" size={16} /><Button.Text fontSize="$caption" fontWeight="$button">Clear</Button.Text></Button>
          <Button aria-label="Refresh sessions" background="#FFFFFF" borderColor="#D8E1EC" borderWidth={1} className="lms-organization-toolbar-button lms-organization-toolbar-icon-button" height={40} onPress={onRefresh} rounded="$4" width={40}><RefreshCw aria-hidden="true" color="#0F1D3A" size={16} /></Button>
        </XStack>
      </YStack>
    </AppCard>
  );
}
