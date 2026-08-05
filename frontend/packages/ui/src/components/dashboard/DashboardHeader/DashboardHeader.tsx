"use client";

import { memo, useState, type CSSProperties } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input, Text, XStack, YStack, styled } from "tamagui";

import type { DashboardHeaderProps } from "./types";

const HEADER_HEIGHT = 72;
const CONTROL_HEIGHT = 44;

const HeaderFrame = styled(XStack, {
  background: "#FFFFFF",
  borderBottomColor: "#E7ECF3",
  borderBottomWidth: 1,
  gap: "$3",
  minH: HEADER_HEIGHT,
  px: "$5",
  width: "100%",

  $sm: {
    gap: "$3",
    px: "$3",
    py: "$3",
  },
});

const SearchFrame = styled(XStack, {
  background: "#FCFCFD",
  borderColor: "#E1E7F0",
  borderWidth: 1,
  flex: 1,
  gap: "$3",
  height: CONTROL_HEIGHT,
  minW: 0,
  px: "$3",
  rounded: "$4",
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 8,

  $sm: {
    maxW: "100%",
    width: "100%",
  },
});

const SearchInput = styled(Input, {
  background: "transparent",
  borderColor: "transparent",
  borderWidth: 0,
  color: "#111827",
  flex: 1,
  fontSize: "$label",
  height: 38,
  outlineColor: "transparent",
  outlineStyle: "none",
  outlineWidth: 0,
  p: 0,

  focusStyle: {
    borderColor: "transparent",
    borderWidth: 0,
    outlineColor: "transparent",
    outlineStyle: "none",
    outlineWidth: 0,
  },
});

const ShortcutBadge = styled(Text, {
  background: "#F8FAFC",
  borderColor: "#E5EAF2",
  borderWidth: 1,
  color: "#64748B",
  fontSize: "$caption",
  fontWeight: "$label",
  lineHeight: "$caption",
  px: "$2",
  py: "$1",
  rounded: "$2",
});

const IconButton = styled(XStack, {
  background: "#FFFFFF",
  borderColor: "#E1E7F0",
  borderWidth: 1,
  height: CONTROL_HEIGHT,
  position: "relative",
  rounded: "$4",
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 8,
  width: CONTROL_HEIGHT,
});

const HeaderActionsFrame = styled(XStack, {
  gap: "$3",

  $sm: {
    gap: "$2",
  },
});

const HeaderIconGroup = styled(XStack, {
  gap: "$2",

  $sm: {
    gap: "$2",
  },
});

const NotificationBadge = styled(Text, {
  background: "#059669",
  borderColor: "#FFFFFF",
  borderWidth: 1,
  color: "#FFFFFF",
  fontSize: 10,
  fontWeight: "$button",
  height: 18,
  lineHeight: 16,
  minW: 18,
  position: "absolute",
  rounded: "$10",
});

const SelectorFrame = styled(XStack, {
  background: "#FFFFFF",
  borderColor: "#E1E7F0",
  borderWidth: 1,
  gap: "$3",
  height: CONTROL_HEIGHT,
  px: "$3",
  rounded: "$4",
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 8,
  width: 176,

  $sm: {
    flex: 1,
    minW: 150,
    width: "auto",
  },
});

const ProfileFrame = styled(XStack, {
  background: "#FFFFFF",
  borderColor: "#E1E7F0",
  borderWidth: 1,
  gap: "$3",
  height: CONTROL_HEIGHT,
  px: "$2.5",
  rounded: "$4",
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 8,
  width: 216,

  $sm: {
    flex: 1,
    minW: 180,
    width: "auto",
  },
});

const AvatarFrame = styled(XStack, {
  background: "#DDF4E7",
  borderColor: "#C8EAD7",
  borderWidth: 1,
  height: 32,
  overflow: "hidden",
  rounded: "$10",
  width: 32,
});

const leadingActionStyle = {
  alignItems: "center",
  flexShrink: 0,
  justifyContent: "center",
} satisfies CSSProperties;

const headerStyle = {
  alignItems: "center",
  alignSelf: "stretch",
  boxSizing: "border-box",
  flexWrap: "nowrap",
  justifyContent: "space-between",
  overflow: "hidden",
  width: "100%",
} satisfies CSSProperties;

const centerStyle = {
  alignItems: "center",
  justifyContent: "center",
} satisfies CSSProperties;

const rowCenterStyle = {
  alignItems: "center",
} satisfies CSSProperties;

const searchStyle = {
  alignItems: "center",
  flexBasis: 0,
  flexGrow: 1,
  flexShrink: 1,
  maxWidth: "min(640px, 36vw)",
  minWidth: 120,
} satisfies CSSProperties;

const searchFocusedStyle = {
  borderColor: "#059669",
  boxShadow: "0 0 0 3px rgba(5, 150, 105, 0.14)",
} satisfies CSSProperties;

const searchInputStyle = {
  boxShadow: "none",
  minWidth: 0,
  outline: "none",
} satisfies CSSProperties;

const actionsStyle = {
  alignItems: "center",
  flexShrink: 0,
  minWidth: 0,
} satisfies CSSProperties;

const iconGroupStyle = {
  alignItems: "center",
  flexShrink: 0,
} satisfies CSSProperties;

const selectorStyle = {
  alignItems: "center",
  flexShrink: 1,
  minWidth: 136,
  width: "clamp(136px, 15vw, 176px)",
} satisfies CSSProperties;

const profileStyle = {
  alignItems: "center",
  flexShrink: 1,
  minWidth: 174,
  width: "clamp(174px, 19vw, 216px)",
} satisfies CSSProperties;

export const DashboardHeader = memo(function DashboardHeader({
  actions = [],
  leadingAction,
  organizationIcon,
  organizationLabel,
  organizationOnPress,
  onSearchSubmit,
  profile,
  profileOnPress,
  searchPlaceholder,
  shortcutLabel = "\u2318 K",
}: DashboardHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <HeaderFrame className="lms-dashboard-header" style={headerStyle}>
      {leadingAction ? (
        <XStack
          className="lms-dashboard-header-leading"
          style={leadingActionStyle}
        >
          {leadingAction}
        </XStack>
      ) : null}
      <SearchFrame
        className="lms-dashboard-header-search"
        style={{
          ...searchStyle,
          ...(isSearchFocused ? searchFocusedStyle : null),
        }}
      >
        <Search
          aria-hidden="true"
          color="#52627A"
          size={20}
          strokeWidth={2}
        />
        <SearchInput
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          placeholderTextColor={"#8C9AAF" as never}
          onBlur={() => setIsSearchFocused(false)}
          onFocus={() => setIsSearchFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearchSubmit?.((event.currentTarget as HTMLInputElement).value);
            }
          }}
          style={searchInputStyle}
        />
        <ShortcutBadge className="lms-dashboard-header-shortcut">
          {shortcutLabel}
        </ShortcutBadge>
      </SearchFrame>

      <HeaderActionsFrame
        className="lms-dashboard-header-actions"
        style={actionsStyle}
      >
        <HeaderIconGroup
          className="lms-dashboard-header-icons"
          style={iconGroupStyle}
        >
          {actions.map((action) => (
            <IconButton
              aria-label={action.label}
              key={action.label}
              onPress={action.onPress}
              style={centerStyle}
            >
              {action.icon}
              {action.notificationCount ? (
                <NotificationBadge
                  style={{
                    right: -5,
                    textAlign: "center",
                    top: -5,
                  }}
                >
                  {action.notificationCount}
                </NotificationBadge>
              ) : null}
            </IconButton>
          ))}
        </HeaderIconGroup>

        <SelectorFrame
          className="lms-dashboard-header-selector"
          onPress={organizationOnPress}
          role={organizationOnPress ? "button" : undefined}
          style={selectorStyle}
        >
          {organizationIcon}
          <Text
            color="#172033"
            flex={1}
            fontSize="$label"
            fontWeight="$button"
            numberOfLines={1}
          >
            {organizationLabel}
          </Text>
          <ChevronDown
            aria-hidden="true"
            color="#64748B"
            size={16}
            strokeWidth={2.2}
          />
        </SelectorFrame>

        <ProfileFrame
          className="lms-dashboard-header-profile"
          onPress={profileOnPress}
          role={profileOnPress ? "button" : undefined}
          style={profileStyle}
        >
          <AvatarFrame style={centerStyle}>
            {profile.imageSrc ? (
              <img
                alt=""
                src={profile.imageSrc}
                style={{
                  height: "100%",
                  objectFit: "cover",
                  width: "100%",
                }}
              />
            ) : (
              <Text color="#047857" fontSize="$label" fontWeight="$button">
                {profile.name.slice(0, 1)}
              </Text>
            )}
          </AvatarFrame>
          <YStack flex={1} style={{ minWidth: 0 }}>
            <Text
              color="#172033"
              fontSize="$label"
              fontWeight="$button"
              lineHeight="$label"
              numberOfLines={1}
            >
              {profile.name}
            </Text>
            <Text
              color="#64748B"
              fontSize="$caption"
              fontWeight="$caption"
              lineHeight="$caption"
              numberOfLines={1}
            >
              {profile.role}
            </Text>
          </YStack>
          <ChevronDown
            aria-hidden="true"
            color="#64748B"
            size={16}
            strokeWidth={2.2}
          />
        </ProfileFrame>
      </HeaderActionsFrame>
    </HeaderFrame>
  );
});
