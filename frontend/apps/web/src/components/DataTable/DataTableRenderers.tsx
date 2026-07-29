"use client";

import { memo, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Text, XStack, YStack } from "@repo/ui";
import { AppAvatar, AppBadge, type AppBadgeTone } from "@repo/ui/primitives";

import { DATA_TABLE_COLORS } from "./constants";

export type DataTableBadgeTone = AppBadgeTone | "red";

export interface DataTableAvatarCellProps {
  imageSrc?: string;
  label: string;
  subtitle?: string;
}

export interface DataTableTextCellProps {
  primary: ReactNode;
  secondary?: ReactNode;
}

export interface DataTableBadgeCellProps {
  label: ReactNode;
  tone?: DataTableBadgeTone;
}

export interface DataTableLinkCellProps {
  href: string;
  label?: string;
  external?: boolean;
}

export interface DataTableDateCellProps {
  value?: Date | number | string | null;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
}

export interface DataTableNumberCellProps {
  value?: number | null;
  locale?: string;
  options?: Intl.NumberFormatOptions;
}

export interface DataTableTagsCellProps {
  tags: string[];
  tone?: DataTableBadgeTone;
  maxVisible?: number;
}

const redBadgeStyle = {
  backgroundColor: DATA_TABLE_COLORS.redSoft,
  color: DATA_TABLE_COLORS.red,
} as const;

export const DataTableAvatarCell = memo(function DataTableAvatarCell({
  imageSrc,
  label,
  subtitle,
}: DataTableAvatarCellProps) {
  return <AppAvatar imageSrc={imageSrc} label={label} subtitle={subtitle} />;
});

export const DataTableUserCell = DataTableAvatarCell;

export const DataTableTextCell = memo(function DataTableTextCell({
  primary,
  secondary,
}: DataTableTextCellProps) {
  return (
    <YStack gap="$1" style={{ minWidth: 0 }}>
      <Text
        color={DATA_TABLE_COLORS.text}
        fontSize="$caption"
        fontWeight="$button"
        lineHeight="$caption"
        numberOfLines={1}
      >
        {primary}
      </Text>
      {secondary ? (
        <Text
          color={DATA_TABLE_COLORS.muted}
          fontSize={11}
          lineHeight={14}
          numberOfLines={2}
        >
          {secondary}
        </Text>
      ) : null}
    </YStack>
  );
});

export const DataTableEmailCell = memo(function DataTableEmailCell({
  href,
  label,
}: DataTableLinkCellProps) {
  const email = label ?? href.replace(/^mailto:/u, "");

  return (
    <Text
      color={DATA_TABLE_COLORS.muted}
      fontSize="$caption"
      lineHeight={16}
      numberOfLines={2}
      style={{ maxWidth: "100%", overflowWrap: "anywhere" }}
    >
      <a
        href={href.startsWith("mailto:") ? href : `mailto:${href}`}
        style={{ color: "inherit", textDecoration: "none" }}
      >
        {email}
      </a>
    </Text>
  );
});

export const DataTablePhoneCell = memo(function DataTablePhoneCell({
  value,
}: {
  value?: string | null;
}) {
  return (
    <Text
      color={DATA_TABLE_COLORS.text}
      fontSize="$caption"
      lineHeight="$caption"
      numberOfLines={1}
    >
      {value || "-"}
    </Text>
  );
});

export const DataTableWebsiteCell = memo(function DataTableWebsiteCell({
  external = true,
  href,
  label,
}: DataTableLinkCellProps) {
  return (
    <XStack gap="$1" style={{ alignItems: "center", minWidth: 0 }}>
      <Text
        color={DATA_TABLE_COLORS.green}
        fontSize="$caption"
        fontWeight="$button"
        lineHeight={16}
        numberOfLines={2}
        style={{ maxWidth: "100%", overflowWrap: "anywhere" }}
      >
        <a
          href={href}
          rel={external ? "noreferrer" : undefined}
          style={{ color: "inherit", textDecoration: "none" }}
          target={external ? "_blank" : undefined}
        >
          {label ?? href}
        </a>
      </Text>
      {external ? (
        <ExternalLink
          aria-hidden="true"
          color={DATA_TABLE_COLORS.green}
          size={12}
        />
      ) : null}
    </XStack>
  );
});

export const DataTableBadgeCell = memo(function DataTableBadgeCell({
  label,
  tone = "green",
}: DataTableBadgeCellProps) {
  if (tone === "red") {
    return (
      <Text
        fontSize={11}
        fontWeight="$button"
        px="$2"
        py="$1"
        rounded="$3"
        style={redBadgeStyle}
      >
        {label}
      </Text>
    );
  }

  return <AppBadge tone={tone}>{label}</AppBadge>;
});

export const DataTableStatusCell = DataTableBadgeCell;

export const DataTableDateCell = memo(function DataTableDateCell({
  locale = "en-US",
  options = { day: "numeric", month: "short", year: "numeric" },
  value,
}: DataTableDateCellProps) {
  const date = value ? new Date(value) : null;
  const label =
    date && !Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat(locale, options).format(date)
      : "-";

  return (
    <Text
      color={DATA_TABLE_COLORS.text}
      fontSize="$caption"
      lineHeight="$caption"
      numberOfLines={1}
    >
      {label}
    </Text>
  );
});

export const DataTableNumberCell = memo(function DataTableNumberCell({
  locale = "en-US",
  options,
  value,
}: DataTableNumberCellProps) {
  const label =
    typeof value === "number"
      ? new Intl.NumberFormat(locale, options).format(value)
      : "-";

  return (
    <Text
      color={DATA_TABLE_COLORS.text}
      fontSize="$caption"
      lineHeight="$caption"
      numberOfLines={1}
      style={{ textAlign: "right", width: "100%" }}
    >
      {label}
    </Text>
  );
});

export const DataTableTagsCell = memo(function DataTableTagsCell({
  maxVisible = 2,
  tags,
  tone = "gray",
}: DataTableTagsCellProps) {
  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = Math.max(tags.length - visibleTags.length, 0);

  return (
    <XStack gap="$1" style={{ alignItems: "center", flexWrap: "wrap" }}>
      {visibleTags.map((tag) => (
        <DataTableBadgeCell key={tag} label={tag} tone={tone} />
      ))}
      {hiddenCount ? (
        <DataTableBadgeCell label={`+${hiddenCount}`} tone="gray" />
      ) : null}
    </XStack>
  );
});
