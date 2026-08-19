"use client";

import {
  memo,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ElementRef,
  type ReactNode,
} from "react";
import { ExternalLink } from "lucide-react";
import { Avatar, Button, Text, XStack, YStack } from "@repo/ui";
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

export interface DataTableExpandableTextProps {
  children: ReactNode;
  color?: ComponentProps<typeof Text>["color"];
  fontSize?: number;
  fontWeight?: "$button" | "$label" | "$heading";
  lineHeight?: number;
  maxLines?: number;
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

export const DataTableExpandableText = memo(
  ({
    children,
    color = DATA_TABLE_COLORS.text,
    fontSize = 11,
    fontWeight,
    lineHeight = 15,
    maxLines = 2,
  }: DataTableExpandableTextProps) => {
    const contentRef = useRef<ElementRef<typeof Text>>(null);
    const [expanded, setExpanded] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const contentKey =
      typeof children === "string" || typeof children === "number"
        ? String(children)
        : undefined;

    useEffect(() => {
      if (expanded) {
        return;
      }

      const content = contentRef.current;
      if (!content) {
        return;
      }

      let cancelled = false;
      const measurableContent = content as unknown as HTMLElement;
      const updateOverflow = () => {
        const nextHasOverflow =
          measurableContent.scrollHeight > measurableContent.clientHeight + 1;
        window.setTimeout(() => {
          if (!cancelled) {
            setHasOverflow(nextHasOverflow);
          }
        }, 0);
      };

      updateOverflow();
      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(updateOverflow);
      observer?.observe(measurableContent);

      return () => {
        cancelled = true;
        observer?.disconnect();
      };
    }, [contentKey, expanded, lineHeight, maxLines]);

    useEffect(() => {
      if (!contentKey) {
        return;
      }

      window.setTimeout(() => {
        setExpanded(false);
      }, 0);
    }, [contentKey]);

    return (
      <YStack gap={2} minW={0} width="100%">
        <Text
          ref={contentRef}
          color={color}
          fontSize={fontSize}
          fontWeight={fontWeight}
          lineHeight={lineHeight}
          width="100%"
          style={{
            maxHeight: expanded ? undefined : maxLines * lineHeight,
            overflow: expanded ? "visible" : "hidden",
            overflowWrap: "anywhere",
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {children}
        </Text>
        {hasOverflow ? (
          <Button
            aria-expanded={expanded}
            chromeless
            height={16}
            onPress={() => setExpanded((current) => !current)}
            p={0}
            style={{
              alignSelf: "flex-start",
              flexShrink: 0,
              marginTop: 1,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Button.Text
              color={DATA_TABLE_COLORS.green}
              fontSize={9}
              fontWeight="$button"
              lineHeight={13}
            >
              {expanded ? "See less" : "See more"}
            </Button.Text>
          </Button>
        ) : null}
      </YStack>
    );
  },
);

DataTableExpandableText.displayName = "DataTableExpandableText";

export const DataTableAvatarCell = memo(
  ({ imageSrc, label, subtitle }: DataTableAvatarCellProps) => {
    return (
      <XStack gap="$2" minW={0} width="100%" style={{ alignItems: "center" }}>
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
          <DataTableExpandableText
            color={DATA_TABLE_COLORS.text}
            fontSize={11}
            fontWeight="$button"
            lineHeight={15}
          >
            {label}
          </DataTableExpandableText>
          {subtitle ? (
            <DataTableExpandableText
              color={DATA_TABLE_COLORS.muted}
              fontSize={11}
              lineHeight={15}
            >
              {subtitle}
            </DataTableExpandableText>
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
      <YStack gap="$1" width="100%" style={{ minWidth: 0 }}>
        <DataTableExpandableText
          color={DATA_TABLE_COLORS.text}
          fontSize={11}
          fontWeight="$button"
          lineHeight={15}
        >
          {primary}
        </DataTableExpandableText>
        {secondary ? (
          <DataTableExpandableText
            color={DATA_TABLE_COLORS.muted}
            fontSize={10}
            lineHeight={14}
          >
            {secondary}
          </DataTableExpandableText>
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
      <DataTableExpandableText
        color={DATA_TABLE_COLORS.muted}
        fontSize={11}
        lineHeight={15}
      >
        <a
          href={href.startsWith("mailto:") ? href : `mailto:${href}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {email}
        </a>
      </DataTableExpandableText>
    );
  },
);

DataTableEmailCell.displayName = "DataTableEmailCell";

export const DataTablePhoneCell = memo(
  ({ value }: { value?: string | null }) => {
    return (
      <DataTableExpandableText
        color={DATA_TABLE_COLORS.text}
        fontSize={11}
        lineHeight={15}
      >
        {value || "-"}
      </DataTableExpandableText>
    );
  },
);

DataTablePhoneCell.displayName = "DataTablePhoneCell";

export const DataTableWebsiteCell = memo(
  ({ external = true, href, label }: DataTableLinkCellProps) => {
    return (
      <XStack gap="$1" style={{ alignItems: "center", minWidth: 0 }}>
        <YStack style={{ flex: 1, minWidth: 0 }}>
          <DataTableExpandableText
            color={DATA_TABLE_COLORS.green}
            fontSize={11}
            fontWeight="$button"
            lineHeight={15}
          >
            <a
              href={href}
              rel={external ? "noreferrer" : undefined}
              style={{ color: "inherit", textDecoration: "none" }}
              target={external ? "_blank" : undefined}
            >
              {label ?? href}
            </a>
          </DataTableExpandableText>
        </YStack>
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
      <XStack gap="$1" flexWrap="wrap" style={{ alignItems: "center" }}>
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
