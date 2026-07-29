"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { Button, Text, XStack, YStack } from "@repo/ui";

import type { NavigationItem } from "./navigation";

const SIDEBAR_STORAGE_KEY = "lms.workspace.sidebar.collapsed";

interface WorkspaceSidebarProps {
  isMobileOpen?: boolean;
  navigation: NavigationItem[];
  onMobileClose?: () => void;
  title: string;
  variant?: "desktop" | "mobile";
}

interface SidebarNavItemProps {
  depth?: number;
  isActive: boolean;
  isCollapsed: boolean;
  item: NavigationItem;
  onNavigate?: () => void;
}

function isNavigationActive(pathname: string, item: NavigationItem): boolean {
  const isCurrent =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(`${item.href}/`));

  return (
    isCurrent ||
    Boolean(item.children?.some((child) => isNavigationActive(pathname, child)))
  );
}

function groupNavigationItems(items: NavigationItem[]) {
  return items.reduce<Array<{ label: string; items: NavigationItem[] }>>(
    (groups, item) => {
      const label = item.group ?? "Navigation";
      const existingGroup = groups.find((group) => group.label === label);

      if (existingGroup) {
        existingGroup.items.push(item);
        return groups;
      }

      return [...groups, { items: [item], label }];
    },
    [],
  );
}

function SidebarNavItem({
  depth = 0,
  isActive,
  isCollapsed,
  item,
  onNavigate,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);
  const hasActiveChild = Boolean(
    item.children?.some((child) => isNavigationActive(pathname, child)),
  );
  const [isExpanded, setIsExpanded] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setIsExpanded(true);
    }
  }, [hasActiveChild]);

  const handleToggleChildren = useCallback(() => {
    setIsExpanded((current) => !current);
  }, []);

  const itemContent = (
    <XStack
      className={[
        "lms-sidebar-item",
        isActive ? "is-active" : "",
        isCollapsed ? "is-collapsed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      gap="$3"
      px="$3"
      role="menuitem"
      style={{
        alignItems: "center",
        borderRadius: 12,
        minHeight: 44,
        paddingLeft: isCollapsed ? undefined : 12 + depth * 16,
        position: "relative",
      }}
    >
      <XStack
        className="lms-sidebar-icon-shell"
        style={{
          alignItems: "center",
          flexShrink: 0,
          height: 32,
          justifyContent: "center",
          width: 32,
        }}
      >
        <Icon
          aria-hidden="true"
          color={isActive ? "#047857" : "#435266"}
          size={18}
          strokeWidth={2.2}
        />
      </XStack>

      <Text
        className="lms-sidebar-label"
        color={isActive ? "#047857" : "#334155"}
        fontSize={14}
        fontWeight={isActive ? "$button" : "$body"}
        numberOfLines={1}
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        {item.label}
      </Text>

      {hasChildren && !isCollapsed ? (
        <XStack
          aria-hidden
          style={{
            alignItems: "center",
            height: 28,
            justifyContent: "center",
            width: 28,
          }}
        >
          <ChevronDown
            className={
              isExpanded ? "lms-sidebar-chevron is-open" : "lms-sidebar-chevron"
            }
            color="#647084"
            size={15}
          />
        </XStack>
      ) : null}
    </XStack>
  );

  return (
    <YStack gap="$1">
      {hasChildren ? (
        <button
          aria-expanded={isExpanded}
          aria-current={isActive ? "page" : undefined}
          className="lms-sidebar-link-button"
          onClick={isCollapsed ? undefined : handleToggleChildren}
          title={isCollapsed ? item.label : undefined}
          type="button"
        >
          {itemContent}
        </button>
      ) : (
        <Link
          aria-current={isActive ? "page" : undefined}
          className="lms-sidebar-link"
          href={item.href}
          onClick={onNavigate}
          title={isCollapsed ? item.label : undefined}
        >
          {itemContent}
        </Link>
      )}

      {hasChildren && isExpanded && !isCollapsed ? (
        <YStack className="lms-sidebar-children" gap="$1" role="group">
          {item.children?.map((child) => (
            <SidebarNavItem
              depth={depth + 1}
              isActive={isNavigationActive(pathname, child)}
              isCollapsed={isCollapsed}
              item={child}
              key={child.href}
              onNavigate={onNavigate}
            />
          ))}
        </YStack>
      ) : null}
    </YStack>
  );
}

function SidebarBrand({
  isCollapsed,
  title,
}: {
  isCollapsed: boolean;
  title: string;
}) {
  return (
    <Link
      aria-label={`LMS ${title} dashboard`}
      className="lms-sidebar-brand-link"
      href={`/${title.toLowerCase()}/dashboard`}
    >
      <XStack
        className={
          isCollapsed ? "lms-sidebar-brand is-collapsed" : "lms-sidebar-brand"
        }
        gap="$3"
        style={{ alignItems: "center", minWidth: 0 }}
      >
        <XStack
          className="lms-sidebar-brand-icon"
          style={{
            alignItems: "center",
            flexShrink: 0,
            height: 42,
            justifyContent: "center",
            width: 42,
          }}
        >
          <GraduationCap
            aria-hidden="true"
            color="#0A7A5F"
            size={24}
            strokeWidth={2.5}
          />
        </XStack>
        <YStack className="lms-sidebar-brand-copy" style={{ minWidth: 0 }}>
          <Text
            color="#0A7A5F"
            fontSize={21}
            fontWeight="$heading"
            numberOfLines={1}
          >
            LMS {title}
          </Text>
          <Text color="#647084" fontSize={11} numberOfLines={1}>
            Learning Management
          </Text>
        </YStack>
      </XStack>
    </Link>
  );
}

function SidebarSupportCard({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <YStack
      className={
        isCollapsed ? "lms-sidebar-support is-collapsed" : "lms-sidebar-support"
      }
      gap="$3"
      p="$3"
      style={{
        backgroundColor: "#F8FBFD",
        borderColor: "#E1E7F0",
        borderRadius: 14,
        borderWidth: 1,
      }}
    >
      <Text color="#047857" fontSize="$caption" fontWeight="$button">
        Workspace
      </Text>
      <Text color="#52627A" fontSize={12} lineHeight={16}>
        Quick access to role-aware LMS modules.
      </Text>
    </YStack>
  );
}

export function WorkspaceSidebar({
  isMobileOpen,
  navigation,
  onMobileClose,
  title,
  variant = "desktop",
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const groupedNavigation = useMemo(
    () => groupNavigationItems(navigation),
    [navigation],
  );
  const isDesktop = variant === "desktop";
  const isVisuallyExpanded =
    variant === "mobile" || !isCollapsed || (isDesktop && isHovering);

  useEffect(() => {
    const savedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);

    if (savedValue === "true" || savedValue === "false") {
      setIsCollapsed(savedValue === "true");
    }
  }, []);

  const handleToggle = useCallback(() => {
    setIsCollapsed((current) => {
      const nextValue = !current;

      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));

      return nextValue;
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isDesktop && isCollapsed) {
      setIsHovering(true);
    }
  }, [isCollapsed, isDesktop]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const sidebarBody: ReactNode = (
    <YStack
      className={[
        "lms-sidebar-panel",
        isVisuallyExpanded ? "is-expanded" : "is-collapsed",
        isMobileOpen ? "is-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      p="$4"
      role="navigation"
      style={{
        backgroundColor: "#FEFEFE",
        borderRightColor: "#DFE6EE",
        borderRightWidth: 1,
        height: "100vh",
        overflow: "visible",
      }}
    >
      <XStack
        className="lms-sidebar-topbar"
        style={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <SidebarBrand isCollapsed={!isVisuallyExpanded} title={title} />

        {variant === "mobile" ? (
          <Button
            aria-label="Close navigation"
            background="#FFFFFF"
            borderColor="#E1E7F0"
            borderWidth={1}
            height={40}
            onPress={onMobileClose}
            rounded="$4"
            width={40}
          >
            <X aria-hidden="true" color="#0F1D3A" size={18} />
          </Button>
        ) : (
          <Button
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            background="#F8FCFA"
            borderColor="#B7E4CB"
            borderWidth={1}
            className="lms-sidebar-toggle"
            height={34}
            onPress={handleToggle}
            rounded="$4"
            width={34}
          >
            {isCollapsed ? (
              <PanelLeftOpen aria-hidden="true" color="#047857" size={18} />
            ) : (
              <PanelLeftClose aria-hidden="true" color="#047857" size={18} />
            )}
          </Button>
        )}
      </XStack>

      <YStack
        className="lms-sidebar-nav-scroll"
        gap="$4"
        mt="$5"
        role="menu"
        style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
      >
        {groupedNavigation.map((group) => (
          <YStack gap="$2" key={group.label}>
            <Text
              className="lms-sidebar-group-label"
              color="#8A97AA"
              fontSize={10}
              fontWeight="$button"
              letterSpacing={0.8}
              numberOfLines={1}
              textTransform="uppercase"
            >
              {group.label}
            </Text>

            <YStack gap="$1">
              {group.items.map((item) => (
                <SidebarNavItem
                  isActive={isNavigationActive(pathname, item)}
                  isCollapsed={!isVisuallyExpanded}
                  item={item}
                  key={item.href}
                  onNavigate={onMobileClose}
                />
              ))}
            </YStack>
          </YStack>
        ))}
      </YStack>

      <SidebarSupportCard isCollapsed={!isVisuallyExpanded} />
    </YStack>
  );

  if (variant === "mobile") {
    return (
      <>
        {isMobileOpen ? (
          <XStack
            aria-hidden
            className="lms-mobile-nav-overlay"
            onPress={onMobileClose}
          />
        ) : null}
        {isMobileOpen ? (
          <YStack className="lms-mobile-nav-drawer is-open">
            {sidebarBody}
          </YStack>
        ) : null}
      </>
    );
  }

  return (
    <YStack
      className={
        isCollapsed ? "lms-sidebar-rail is-collapsed" : "lms-sidebar-rail"
      }
      style={{
        alignSelf: "flex-start",
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {sidebarBody}
    </YStack>
  );
}
