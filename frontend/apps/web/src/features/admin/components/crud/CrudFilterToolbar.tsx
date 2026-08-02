"use client";

import { X } from "lucide-react";
import { Button, XStack } from "@repo/ui";

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
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  searchValue: string;
  values: Record<string, string>;
}

export const CrudFilterToolbar = ({
  entityLabel,
  filters,
  onClear,
  onFilterChange,
  onSearch,
  searchPlaceholder,
  searchValue,
  values,
}: CrudFilterToolbarProps) => (
  <XStack gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
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
    <Button
      aria-label={`Clear ${entityLabel.toLowerCase()} filters`}
      background="#FFFFFF"
      borderColor="#D8E1EC"
      borderWidth={1}
      height={40}
      onPress={onClear}
      rounded="$4"
    >
      <X aria-hidden="true" color="#0F1D3A" size={16} />
      <Button.Text fontSize="$caption">Clear</Button.Text>
    </Button>
  </XStack>
);
