"use client";

import { RefreshCw, X } from "lucide-react";
import { Button, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";
import type { ReactNode } from "react";

import type { CrudFilterDefinition } from "./types";
import { CrudSearch } from "./CrudSearch";
import { CrudSelect } from "./CrudSelect";

export interface CrudToolbarProps {
  actions?: ReactNode;
  entityLabel: string;
  filters: CrudFilterDefinition[];
  loading?: boolean;
  onClear: () => void;
  onFilterChange: (id: string, value: string) => void;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  searchValue: string;
  values: Record<string, string>;
}

export const CrudToolbar = ({
  actions,
  entityLabel,
  filters,
  loading = false,
  onClear,
  onFilterChange,
  onSearch,
  searchPlaceholder,
  searchValue,
  values,
}: CrudToolbarProps) => (
  <AppCard
    className="lms-crud-filters lms-organization-filters"
    background="#FFFFFF"
    borderColor="#E1E7F0"
    borderWidth={1}
    overflow="hidden"
    p="$4"
    position="relative"
    width="100%"
  >
    <YStack gap="$3">
      <XStack
        className="lms-crud-filter-row lms-organization-filter-row"
        gap="$2"
        maxW="100%"
        flexWrap="wrap"
        style={{ alignItems: "center" }}
      >
        <CrudSearch
          ariaLabel={`Search ${entityLabel.toLowerCase()}`}
          loading={loading}
          onChange={onSearch}
          placeholder={
            searchPlaceholder ?? `Search ${entityLabel.toLowerCase()}...`
          }
          value={searchValue}
        />
        {filters.map((filter) => (
          <CrudSelect
            ariaLabel={`Filter ${entityLabel.toLowerCase()} by ${filter.label.toLowerCase()}`}
            key={filter.id}
            label={filter.label}
            loading={loading}
            onChange={(value) => onFilterChange(filter.id, value)}
            options={filter.options}
            value={values[filter.id] ?? filter.options[0]?.value ?? ""}
          />
        ))}
        {actions}
        {/* {onRefresh ? (
          <Button
            aria-label={`Refresh ${entityLabel.toLowerCase()}`}
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            className="lms-crud-toolbar-button lms-crud-toolbar-icon-button lms-organization-toolbar-button lms-organization-toolbar-icon-button"
            disabled={loading}
            height={36}
            onPress={onRefresh}
            rounded="$4"
            width={40}
          >
            <RefreshCw aria-hidden="true" color="#0F1D3A" size={16} />
          </Button>
        ) : null} */}
        <Button
          aria-label={`Clear ${entityLabel.toLowerCase()} filters`}
          background="#FFFFFF"
          borderColor="#D8E1EC"
          borderWidth={1}
          className="lms-crud-toolbar-button lms-organization-toolbar-button"
          disabled={loading}
          height={36}
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
