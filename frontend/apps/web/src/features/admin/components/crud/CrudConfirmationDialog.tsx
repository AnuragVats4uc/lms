import { AlertTriangle } from "lucide-react";
import { Button, Text, XStack, YStack } from "@repo/ui";

import { AppModal } from "@/components/AppModal";

export interface CrudConfirmationDialogProps {
  confirmLabel: string;
  description: string;
  destructive?: boolean;
  detail: string;
  error?: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subject: string;
  title: string;
}

export const CrudConfirmationDialog = ({
  confirmLabel,
  description,
  destructive = false,
  detail,
  error,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
  subject,
  title,
}: CrudConfirmationDialogProps) => (
  <AppModal
    className={
      destructive ? "lms-confirm-modal is-danger" : "lms-confirm-modal"
    }
    description={description}
    isOpen={isOpen}
    onClose={onClose}
    title={title}
  >
    <YStack className="lms-confirm-content" gap="$4">
      <XStack
        gap="$3"
        style={{ alignItems: "center", minWidth: 0, width: "100%" }}
      >
        <XStack
          className="lms-confirm-icon"
          justify="center"
          style={{ alignItems: "center", flexShrink: 0 }}
        >
          <AlertTriangle aria-hidden="true" size={22} />
        </XStack>
        <YStack style={{ minWidth: 0 }}>
          <Text color="#0F1D3A" fontSize="$label" fontWeight="$button">
            {subject}
          </Text>
          <Text color="#52627A" fontSize="$caption" lineHeight="$caption">
            {detail}
          </Text>
        </YStack>
      </XStack>
      {error ? (
        <Text color="#DC2626" fontSize="$caption" lineHeight="$caption">
          {error}
        </Text>
      ) : null}
      <XStack gap="$2" justify="flex-end">
        <Button
          background="#FFFFFF"
          borderColor="#D8E1EC"
          borderWidth={1}
          disabled={isSubmitting}
          height={38}
          onPress={onClose}
          rounded="$3"
        >
          <Button.Text fontSize="$caption" fontWeight="$button">
            Cancel
          </Button.Text>
        </Button>
        <Button
          background={destructive ? "#DC2626" : "#059669"}
          borderColor={destructive ? "#DC2626" : "#059669"}
          borderWidth={1}
          disabled={isSubmitting}
          height={38}
          onPress={onConfirm}
          rounded="$3"
        >
          <Button.Text color="#FFFFFF" fontSize="$caption" fontWeight="$button">
            {isSubmitting ? "Working..." : confirmLabel}
          </Button.Text>
        </Button>
      </XStack>
    </YStack>
  </AppModal>
);
