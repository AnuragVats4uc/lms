"use client";

import { Button, XStack } from "@repo/ui";

export interface CrudRowAction<Item> {
  destructive?: boolean;
  label: string;
  onPress: (item: Item) => void;
}

export interface CrudRowActionsProps<Item> {
  actions: CrudRowAction<Item>[];
  item: Item;
}

export const CrudRowActions = <Item,>({
  actions,
  item,
}: CrudRowActionsProps<Item>) => (
  <XStack gap="$1" style={{ justifyContent: "center" }}>
    {actions.map((action) => (
      <Button
        aria-label={`${action.label} row`}
        background="#FFFFFF"
        borderColor={action.destructive ? "#FECACA" : "#D8E1EC"}
        borderWidth={1}
        height={32}
        key={action.label}
        onPress={() => action.onPress(item)}
        rounded="$3"
      >
        <Button.Text
          color={action.destructive ? "#B42318" : undefined}
          fontSize="$caption"
        >
          {action.label}
        </Button.Text>
      </Button>
    ))}
  </XStack>
);
