"use client";

import { Download, Trash2 } from "lucide-react";
import { Button, Text, XStack } from "@repo/ui";

export interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onExport: () => void;
  onSetActive: (active: boolean) => void;
}

export function BulkActionBar({
  count,
  onClear,
  onDelete,
  onExport,
  onSetActive,
}: BulkActionBarProps) {
  if (!count) {
    return null;
  }

  return (
    <XStack
      className="lms-organization-bulk-bar"
      gap="$2"
      p="$3"
      style={{
        alignItems: "center",
        backgroundColor: "#F2FAF7",
        borderColor: "#B7E4CB",
        borderRadius: 14,
        borderWidth: 1,
        flexWrap: "wrap",
        justifyContent: "space-between",
      }}
    >
      <Text color="#047857" fontSize="$caption" fontWeight="$button">
        {count} selected
      </Text>

      <XStack gap="$2" style={{ flexWrap: "wrap" }}>
        <Button height={34} onPress={() => onSetActive(true)} rounded="$3">
          <Button.Text fontSize="$caption">Activate</Button.Text>
        </Button>

        <Button height={34} onPress={() => onSetActive(false)} rounded="$3">
          <Button.Text fontSize="$caption">Deactivate</Button.Text>
        </Button>

        <Button height={34} onPress={onExport} rounded="$3">
          <Download aria-hidden="true" size={14} />
          <Button.Text fontSize="$caption">Export Selected</Button.Text>
        </Button>

        <Button height={34} onPress={onDelete} rounded="$3">
          <Trash2 aria-hidden="true" color="#DC2626" size={14} />
          <Button.Text color="#DC2626" fontSize="$caption">
            Delete Selected
          </Button.Text>
        </Button>

        <Button chromeless height={34} onPress={onClear} rounded="$3">
          <Button.Text color="#0F1D3A" fontSize="$caption">
            Clear Selection
          </Button.Text>
        </Button>
      </XStack>
    </XStack>
  );
}
