"use client";

import { Download, RefreshCw, X } from "lucide-react";
import { Button, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";

import {
  createdDateOptions,
  sortOptions,
  statusOptions,
  syncStatusOptions,
} from "../../constants";
import type { OrganizationFiltersState } from "../../types";
import { OrganizationSearch } from "./OrganizationSearch";
import { OrganizationSelect } from "./OrganizationSelect";

export interface OrganizationToolbarProps {
  filters: OrganizationFiltersState;
  onClearFilters: () => void;
  onExport: () => void;
  onFilterChange: (filters: OrganizationFiltersState) => void;
  onRefresh: () => void;
}

export function OrganizationToolbar({
  filters,
  onClearFilters,
  onExport,
  onFilterChange,
  onRefresh,
}: OrganizationToolbarProps) {
  const update = <K extends keyof OrganizationFiltersState>(
    key: K,
    value: OrganizationFiltersState[K],
  ) => onFilterChange({ ...filters, [key]: value });

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
          <OrganizationSearch
            onChange={(value) => update("search", value)}
            value={filters.search}
          />

          <OrganizationSelect
            ariaLabel="Filter by organization status"
            label="Status"
            onChange={(value) =>
              update(
                "status",
                value === "ACTIVE" || value === "INACTIVE" ? value : "ALL",
              )
            }
            options={statusOptions}
            value={filters.status}
          />
          <OrganizationSelect
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
            options={syncStatusOptions}
            value={filters.syncStatus}
          />
          <OrganizationSelect
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
            options={createdDateOptions}
            value={filters.createdDate}
          />
          <OrganizationSelect
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
            options={sortOptions}
            value={filters.sort}
          />
          <Button
            aria-label="Clear filters"
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            className="lms-organization-toolbar-button"
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
            className="lms-organization-toolbar-button lms-organization-toolbar-icon-button"
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
            className="lms-organization-toolbar-button"
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
      </YStack>
    </AppCard>
  );
}
