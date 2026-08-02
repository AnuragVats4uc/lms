"use client";

import { RefreshCw, X } from "lucide-react";
import { Button, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";
import type { ReactNode } from "react";

import {
  OrganizationSearch,
  OrganizationSelect,
} from "../../organizations/components/filters";
import type { CrudFilterDefinition } from "./types";

export interface CrudFilterToolbarProps {
  entityLabel: string;
  filters: CrudFilterDefinition[];
  onClear: () => void;
  onFilterChange: (id: string, value: string) => void;
  onRefresh?: () => void;
  onSearch: (value: string) => void;
  actions?: ReactNode;
  searchPlaceholder?: string;
  searchValue: string;
  values: Record<string, string>;
}

export const CrudFilterToolbar = ({
  entityLabel,
  filters,
  onClear,
  onFilterChange,
  onRefresh,
  onSearch,
  actions,
  searchPlaceholder,
  searchValue,
  values,
}: CrudFilterToolbarProps) => (
  <AppCard
    className="lms-organization-filters"
    background="#FFFFFF"
    borderColor="#E1E7F0"
    borderWidth={1}
    overflow="hidden"
    p="$4"
    position="relative"
    width="100%"
    boxShadow="0 12px 34px rgba(15, 23, 42, 0.04)"
  >
    <YStack gap="$3">
      <XStack
        className="lms-organization-filter-row"
        gap="$3"
        maxW="100%"
        flexWrap="wrap"
        style={{ alignItems: "center" }}
      >
        <OrganizationSearch
          ariaLabel={`Search ${entityLabel.toLowerCase()}`}
          onChange={onSearch}
          placeholder={
            searchPlaceholder ?? `Search ${entityLabel.toLowerCase()}...`
          }
          value={searchValue}
        />
        {filters.map((filter) => (
          <OrganizationSelect
            ariaLabel={`Filter ${entityLabel.toLowerCase()} by ${filter.label.toLowerCase()}`}
            key={filter.id}
            label={filter.label}
            onChange={(value) => onFilterChange(filter.id, value)}
            options={filter.options}
            value={values[filter.id] ?? filter.options[0]?.value ?? ""}
          />
        ))}
        {actions}
        {onRefresh ? (
          <Button
            aria-label={`Refresh ${entityLabel.toLowerCase()}`}
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
        ) : null}
        <Button
          aria-label={`Clear ${entityLabel.toLowerCase()} filters`}
          background="#FFFFFF"
          borderColor="#D8E1EC"
          borderWidth={1}
          className="lms-organization-toolbar-button"
          height={40}
          onPress={onClear}
          rounded="$4"
        >
          <X aria-hidden="true" color="#0F1D3A" size={16} />
          <Button.Text fontSize="$caption">Clear</Button.Text>
        </Button>
      </XStack>
    </YStack>
  </AppCard>
);
