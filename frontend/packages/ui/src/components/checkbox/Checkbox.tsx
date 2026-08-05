"use client";

import {
  Checkbox as TamaguiCheckbox,
  CheckboxProps,
  Label,
  Text,
  View,
  XStack,
} from "tamagui";

export interface AppCheckboxProps
  extends Omit<CheckboxProps, "children"> {
  label?: string;
}

export function AppCheckbox({
  label,
  id,
  checked,
  onCheckedChange,
  ...props
}: AppCheckboxProps) {
  return (
    <XStack gap="$2" style={{ alignItems: "center" }}>
      <TamaguiCheckbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        width={16}
        height={16}
        borderRadius={4}
        borderWidth={1.5}
        borderColor={checked ? "#10B981" : "#CBD5E1"}
        backgroundColor={checked ? "#D1FAE5" : "white"}
        {...props}
      >
        <TamaguiCheckbox.Indicator>
          <View
            width={8}
            height={8}
            style={{
              backgroundColor: "#10B981",
              borderRadius: 2,
            }}
          />
        </TamaguiCheckbox.Indicator>
      </TamaguiCheckbox>

      {label ? (
        <Label
          htmlFor={id}
          lineHeight="$label"
          mb={0}
        >
          <Text
            color="#4B5563"
            fontSize="$caption"
            fontWeight="$body"
            letterSpacing="$body"
          >
            {label}
          </Text>
        </Label>
      ) : null}
    </XStack>
  );
}
