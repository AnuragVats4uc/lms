"use client";

import { Search } from "lucide-react";
import { Input, XStack } from "@repo/ui";

export interface OrganizationSearchProps {
  ariaLabel?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export function OrganizationSearch({
  ariaLabel = "Search organizations",
  onChange,
  placeholder = "Search name, code, email, phone, website...",
  value,
}: OrganizationSearchProps) {
  return (
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
        aria-label={ariaLabel}
        background="transparent"
        borderWidth={0}
        className="lms-organization-search-input"
        flex={1}
        height={36}
        onChangeText={onChange}
        p={0}
        placeholder={placeholder}
        placeholderTextColor={"#52627A" as never}
        focusStyle={{
          borderColor: "transparent",
          boxShadow: "none",
          outlineColor: "transparent",
        }}
        style={{ boxShadow: "none", minWidth: 0, outline: "none" }}
        value={value}
      />
    </XStack>
  );
}
