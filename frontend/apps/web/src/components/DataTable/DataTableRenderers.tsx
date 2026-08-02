"use client";

import { memo, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { Avatar, Text, XStack, YStack } from "@repo/ui";
import { AppBadge, type AppBadgeTone } from "@repo/ui/primitives";

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

const getInitials = (label: string) => {
  const parts = label.trim().split(/\s+/u).filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
};

export const DataTableAvatarCell = memo(
  ({ imageSrc, label, subtitle }: DataTableAvatarCellProps) => {
    return (
      <XStack
        gap="$2"
        minW={0}
        width='100%'
        style={{ alignItems: "center", }}
      >
        {imageSrc ? (
          <Avatar circular size={30} style={{ flexShrink: 0 }}>
            <Avatar.Image src={imageSrc} />
            <Avatar.Fallback background="#DDF4E7">
              <Text color="#047857" fontSize={11} fontWeight="$button">
                {getInitials(label)}
              </Text>
            </Avatar.Fallback>
          </Avatar>
        ) : (
          <XStack
            background="#DDF4E7"
            width={30}
            height={30}
            justify="center"
            style={{
              alignItems: "center",
              borderRadius: 999,
              flexShrink: 0,
            }}
          >
            <Text color="#047857" fontSize={11} fontWeight="$button">
              {getInitials(label)}
            </Text>
          </XStack>
        )}
        <YStack style={{ flex: 1, minWidth: 0 }}>
          <Text
            color={DATA_TABLE_COLORS.text}
            fontSize={12}
            fontWeight="$button"
            lineHeight={16}
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle ? (
            <Text
              color={DATA_TABLE_COLORS.muted}
              fontSize={11}
              lineHeight={15}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </YStack>
      </XStack>
    );
  },
);

DataTableAvatarCell.displayName = "DataTableAvatarCell";

export const DataTableUserCell = DataTableAvatarCell;

export const DataTableTextCell = memo(
  ({ primary, secondary }: DataTableTextCellProps) => {
    return (
      <YStack gap="$1" style={{ minWidth: 0 }}>
        <Text
          color={DATA_TABLE_COLORS.text}
          fontSize={12}
          fontWeight="$button"
          lineHeight={16}
          numberOfLines={1}
        >
          {primary}
        </Text>
        {secondary ? (
          <Text
            color={DATA_TABLE_COLORS.muted}
            fontSize={10}
            lineHeight={14}
            numberOfLines={2}
          >
            {secondary}
          </Text>
        ) : null}
      </YStack>
    );
  },
);

DataTableTextCell.displayName = "DataTableTextCell";

export const DataTableEmailCell = memo(
  ({ href, label }: DataTableLinkCellProps) => {
    const email = label ?? href.replace(/^mailto:/u, "");

    return (
      <Text
        color={DATA_TABLE_COLORS.muted}
        fontSize={11}
        lineHeight={15}
        numberOfLines={2}
        maxW="100%"
        style={{ overflowWrap: "anywhere" }}
      >
        <a
          href={href.startsWith("mailto:") ? href : `mailto:${href}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {email}
        </a>
      </Text>
    );
  },
);

DataTableEmailCell.displayName = "DataTableEmailCell";

export const DataTablePhoneCell = memo(
  ({ value }: { value?: string | null }) => {
    return (
      <Text
        color={DATA_TABLE_COLORS.text}
        fontSize={11}
        lineHeight={15}
        numberOfLines={1}
      >
        {value || "-"}
      </Text>
    );
  },
);

DataTablePhoneCell.displayName = "DataTablePhoneCell";

export const DataTableWebsiteCell = memo(
  ({ external = true, href, label }: DataTableLinkCellProps) => {
    return (
      <XStack gap="$1" style={{ alignItems: "center", minWidth: 0 }}>
        <Text
          color={DATA_TABLE_COLORS.green}
          fontSize={11}
          fontWeight="$button"
          lineHeight={15}
          numberOfLines={2}
          maxW="100%"
          style={{ overflowWrap: "anywhere" }}
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
  },
);

DataTableWebsiteCell.displayName = "DataTableWebsiteCell";

export const DataTableBadgeCell = memo(
  ({ label, tone = "green" }: DataTableBadgeCellProps) => {
    if (tone === "red") {
      return (
        <Text
          fontSize={10}
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
  },
);

DataTableBadgeCell.displayName = "DataTableBadgeCell";

export const DataTableStatusCell = DataTableBadgeCell;

export const DataTableDateCell = memo(
  ({
    locale = "en-US",
    options = { day: "numeric", month: "short", year: "numeric" },
    value,
  }: DataTableDateCellProps) => {
    const date = value ? new Date(value) : null;
    const label =
      date && !Number.isNaN(date.getTime())
        ? new Intl.DateTimeFormat(locale, options).format(date)
        : "-";

    return (
      <Text
        color={DATA_TABLE_COLORS.text}
        fontSize={11}
        lineHeight={15}
        numberOfLines={1}
      >
        {label}
      </Text>
    );
  },
);

DataTableDateCell.displayName = "DataTableDateCell";

export const DataTableNumberCell = memo(
  ({ locale = "en-US", options, value }: DataTableNumberCellProps) => {
    const label =
      typeof value === "number"
        ? new Intl.NumberFormat(locale, options).format(value)
        : "-";

    return (
      <Text
        color={DATA_TABLE_COLORS.text}
        fontSize={11}
        lineHeight={15}
        numberOfLines={1}
        width="100%"
        text="right"
      >
        {label}
      </Text>
    );
  },
);

DataTableNumberCell.displayName = "DataTableNumberCell";

export const DataTableTagsCell = memo(
  ({ maxVisible = 2, tags, tone = "gray" }: DataTableTagsCellProps) => {
    const visibleTags = tags.slice(0, maxVisible);
    const hiddenCount = Math.max(tags.length - visibleTags.length, 0);

    return (
      <XStack gap="$1" flexWrap="wrap" style={{ alignItems: "center", }}>
        {visibleTags.map((tag) => (
          <DataTableBadgeCell key={tag} label={tag} tone={tone} />
        ))}
        {hiddenCount ? (
          <DataTableBadgeCell label={`+${hiddenCount}`} tone="gray" />
        ) : null}
      </XStack>
    );
  },
);

DataTableTagsCell.displayName = "DataTableTagsCell";
