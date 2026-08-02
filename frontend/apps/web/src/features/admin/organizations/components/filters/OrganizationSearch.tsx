"use client";

import { Search } from "lucide-react";
import { Input, XStack } from "@repo/ui";

export interface OrganizationSearchProps {
  ariaLabel?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export const OrganizationSearch = ({
  ariaLabel = "Search organizations",
  onChange,
  placeholder = "Search name, code, email, phone, website...",
  value,
}: OrganizationSearchProps) => {
  return (
    <XStack
      className="lms-organization-search"
      gap="$3"
      px="$3"
      maxW={560}
      minW={0}
      minH={42}
      background="#FCFCFD"
      borderColor="#D8E1EC"
      borderWidth={1}
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
        minW={0}
        outline="none"
        boxShadow="none"
        value={value}
      />
    </XStack>
  );
};
