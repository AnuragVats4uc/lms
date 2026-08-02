"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { Button } from "@repo/ui";

import { menuActions, type OrganizationMenuActionId } from "../../constants";
import type {
  OrganizationRowActionHandlers,
  OrganizationTableRow,
} from "../../types";

interface ActionsCellProps {
  handlers: OrganizationRowActionHandlers;
  organization: OrganizationTableRow;
}

export const ActionsCell = memo(
  ({ handlers, organization }: ActionsCellProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
    const menuRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLDivElement | null>(null);

    const updateMenuPosition = useCallback(() => {
      const trigger = triggerRef.current;

      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const menuRect = menuRef.current?.getBoundingClientRect();
      const menuWidth = menuRect?.width ?? 206;
      const menuHeight =
        menuRect?.height ??
        menuActions.length * 36 + Math.max(menuActions.length - 1, 0) * 2 + 18;
      const viewportPadding = 12;
      const left = Math.max(
        viewportPadding,
        Math.min(
          window.innerWidth - menuWidth - viewportPadding,
          rect.right - menuWidth,
        ),
      );
      const hasBottomSpace =
        rect.bottom + menuHeight + viewportPadding <= window.innerHeight;

      setMenuPosition({
        left,
        top: hasBottomSpace
          ? rect.bottom + 8
          : Math.max(viewportPadding, rect.top - menuHeight - 8),
      });
    }, []);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      updateMenuPosition();

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target;

        if (
          target instanceof Node &&
          triggerRef.current &&
          !triggerRef.current.contains(target) &&
          !menuRef.current?.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      const handleViewportChange = () => updateMenuPosition();

      document.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("resize", handleViewportChange);
      window.addEventListener("scroll", handleViewportChange, true);

      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("resize", handleViewportChange);
        window.removeEventListener("scroll", handleViewportChange, true);
      };
    }, [isOpen, updateMenuPosition]);

    const runAction = (actionId: OrganizationMenuActionId) => {
      setIsOpen(false);

      if (actionId === "view") handlers.onView(organization);
      if (actionId === "edit") handlers.onEdit(organization);
      // if (actionId === "users") handlers.onManageUsers(organization);
      // if (actionId === "courses") handlers.onAssignCourses(organization);
      // if (actionId === "analytics") handlers.onViewAnalytics(organization);
      if (actionId === "toggle") handlers.onToggleActive(organization);
      if (actionId === "delete") handlers.onDelete(organization);
    };

    return (
      <div
        ref={triggerRef}
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Button
          aria-expanded={isOpen}
          aria-label={`Open actions for ${organization.name}`}
          background="#FFFFFF"
          borderColor="#D8E1EC"
          borderWidth={1}
          height={34}
          hoverStyle={{ background: "#F8FBFD", scale: 1.03 }}
          onPress={() => {
            updateMenuPosition();
            setIsOpen((current) => !current);
          }}
          pressStyle={{ scale: 0.98 }}
          rounded="$3"
          width={34}
        >
          <MoreVertical aria-hidden="true" color="#0F1D3A" size={16} />
        </Button>

        {isOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                className="lms-organization-row-menu"
                ref={menuRef}
                role="menu"
                style={{
                  background:
                    "linear-gradient(180deg, #FFFFFF 0%, #FBFDFD 100%)",
                  border: "1px solid #D8E1EC",
                  borderRadius: 12,
                  boxShadow:
                    "0 20px 44px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.92)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  left: menuPosition.left,
                  minWidth: 206,
                  padding: 8,
                  position: "fixed",
                  top: menuPosition.top,
                  zIndex: 5000,
                }}
              >
                {menuActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Button
                      aria-label={action.label}
                      background="transparent"
                      chromeless
                      height={36}
                      key={action.id}
                      onPress={() => runAction(action.id)}
                      px="$2"
                      rounded="$3"
                      style={{
                        alignItems: "center",
                        justifyContent: "flex-start",
                        width: "100%",
                      }}
                    >
                      <Icon
                        aria-hidden="true"
                        color={action.destructive ? "#DC2626" : "#435266"}
                        size={15}
                      />
                      <Button.Text
                        color={action.destructive ? "#DC2626" : "#0F1D3A"}
                        fontSize="$caption"
                        fontWeight="$button"
                      >
                        {action.label}
                      </Button.Text>
                    </Button>
                  );
                })}
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  },
);

ActionsCell.displayName = "ActionsCell";
