"use client";

import type { ComponentProps } from "react";
import { Select, Text } from "tamagui";

export interface AppSelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface AppSelectProps extends Omit<
  ComponentProps<typeof Select>,
  "children"
> {
  options: readonly AppSelectOption[];
  placeholder?: string;
  triggerProps?: Omit<ComponentProps<typeof Select.Trigger>, "children">;
}

export function AppSelect({
  options,
  placeholder = "Select an option",
  triggerProps,
  ...props
}: AppSelectProps) {
  return (
    <Select {...props} size={props.size ?? "$4"}>
      <Select.Trigger
        borderWidth={1}
        borderColor="$borderColor"
        focusStyle={{
          borderColor: "$blue10",
        }}
        {...triggerProps}
      >
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>

      <Select.Content>
        <Select.Viewport>
          <Select.Group>
            {options.map((option, index) => (
              <Select.Item
                disabled={option.disabled}
                index={index}
                key={option.value}
                value={option.value}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Text color="$blue10">*</Text>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Group>
        </Select.Viewport>
      </Select.Content>
    </Select>
  );
}
