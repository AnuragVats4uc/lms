"use client";

import type { ReactNode } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { Input, XStack } from "@repo/ui";

export interface CrudSearchProps {
  ariaLabel?: string;
  disabled?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  maxWidth?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export const CrudSearch = ({
  ariaLabel = "Search",
  disabled = false,
  icon,
  loading = false,
  maxWidth = 360,
  onChange,
  placeholder = "Search...",
  value,
}: CrudSearchProps) => (
  <XStack
    className="lms-crud-search lms-organization-search"
    gap="$3"
    px="$3"
    maxW={maxWidth}
    minW={0}
    minH={36}
    background="#FCFCFD"
    borderColor="#D8E1EC"
    borderWidth={1}
    opacity={disabled ? 0.6 : 1}
  >
    {icon ??
      (loading ? (
        <LoaderCircle
          aria-hidden="true"
          className="animate-spin"
          color="#52627A"
          size={16}
        />
      ) : (
        <Search aria-hidden="true" color="#52627A" size={16} />
      ))}
    <Input
      aria-label={ariaLabel}
      background="transparent"
      borderWidth={0}
      className="lms-crud-search-input lms-organization-search-input"
      disabled={disabled || loading}
      flex={1}
      height={30}
      onChangeText={onChange}
      p={0}
      placeholder={placeholder}
      placeholderTextColor={"#52627A" as never}
      focusStyle={{
        borderColor: "transparent",
        boxShadow: "none",
        outlineColor: "transparent",
      }}
      minW={0}
      outline="none"
      boxShadow="none"
      value={value}
    />
  </XStack>
);
