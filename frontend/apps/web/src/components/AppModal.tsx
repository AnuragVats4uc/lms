"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button, Text, XStack, YStack } from "@repo/ui";

interface AppModalProps {
  children: ReactNode;
  className?: string;
  description?: string;
  footer?: ReactNode;
  headerMeta?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function AppModal({
  children,
  className,
  description,
  footer,
  headerMeta,
  isOpen,
  onClose,
  title,
}: AppModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="lms-modal-layer" role="presentation">
      <button
        aria-label="Close modal"
        className="lms-modal-backdrop"
        onClick={onClose}
        type="button"
      />
      <YStack
        aria-modal={true}
        className={["lms-modal-panel", className].filter(Boolean).join(" ")}
        role="dialog"
        style={{ position: "relative" }}
      >
        <XStack
          className="lms-modal-header"
          style={{ alignItems: "flex-start", justifyContent: "space-between" }}
        >
          <YStack gap="$1" style={{ minWidth: 0 }}>
            <Text color="#0F1D3A" fontSize={20} fontWeight="$heading">
              {title}
            </Text>
            {description ? (
              <Text color="#52627A" fontSize="$caption" lineHeight="$caption">
                {description}
              </Text>
            ) : null}
            {headerMeta}
          </YStack>
          <Button
            aria-label="Close"
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            height={34}
            onPress={onClose}
            rounded="$3"
            width={34}
          >
            <X aria-hidden="true" color="#0F1D3A" size={16} />
          </Button>
        </XStack>

        <YStack className="lms-modal-body">{children}</YStack>

        {footer ? (
          <XStack
            className="lms-modal-footer"
            gap="$2"
            style={{ justifyContent: "flex-end" }}
          >
            {footer}
          </XStack>
        ) : null}
      </YStack>
    </div>,
    document.body,
  );
}
