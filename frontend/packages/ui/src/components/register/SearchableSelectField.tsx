"use client";

import {
  useMemo,
  useState,
} from "react";
import {
  Controller,
  FieldPath,
  FieldValues,
  useFormContext,
} from "react-hook-form";
import {
  Button,
  LabelProps,
  styled,
  Text,
  YStack,
} from "tamagui";

import { AppInput } from "../input";
import { FormLabel } from "../form/FormLabel";
import { FormMessage } from "../form/FormMessage";
import { RegisterOption } from "./registerOptions";

interface SearchableSelectFieldProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
> {
  disabled?: boolean;
  label: string;
  labelProps?: Omit<LabelProps, "children">;
  name: TName;
  options: RegisterOption[];
  placeholder?: string;
  searchable?: boolean;
}

export function SearchableSelectField<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  disabled = false,
  label,
  labelProps,
  name,
  options,
  placeholder = "Select an option",
  searchable = true,
}: SearchableSelectFieldProps<T, TName>) {
  const { control } = useFormContext<T>();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!searchable || !normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery)
    );
  }, [options, query, searchable]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedOption = options.find(
          (option) => option.value === field.value
        );
        const inputId = String(name);
        const errorId = `${inputId}-error`;

        return (
          <FieldStack>
            <FormLabel
              htmlFor={inputId}
              fontSize="$caption"
              mb={0}
              {...labelProps}
            >
              {label}
            </FormLabel>

            <SelectInput
              id={inputId}
              inactive={disabled}
              value={
                isOpen && searchable
                  ? query
                  : selectedOption?.label ?? ""
              }
              placeholder={placeholder}
              aria-disabled={disabled}
              aria-describedby={
                fieldState.error ? errorId : undefined
              }
              aria-invalid={fieldState.invalid}
              onFocus={() => {
                if (!disabled) {
                  setIsOpen(true);
                  setQuery("");
                }
              }}
              onChangeText={(value) => {
                if (!disabled && searchable) {
                  setQuery(value);
                  setIsOpen(true);
                }
              }}
              onPressIn={() => {
                if (!disabled) {
                  setIsOpen(true);
                }
              }}
            />

            {isOpen && !disabled ? (
              <OptionsPanel>
                {filteredOptions.length > 0 ? (
                  filteredOptions.slice(0, 6).map((option) => (
                    <OptionButton
                      key={option.value}
                      type="button"
                      onPress={() => {
                        field.onChange(option.value);
                        setQuery("");
                        setIsOpen(false);
                      }}
                    >
                      <OptionText>{option.label}</OptionText>
                    </OptionButton>
                  ))
                ) : (
                  <EmptyText>No options found</EmptyText>
                )}
              </OptionsPanel>
            ) : null}

            <FormMessage
              id={errorId}
              message={fieldState.error?.message}
            />
          </FieldStack>
        );
      }}
    />
  );
}

const FieldStack = styled(YStack, {
  gap: "$0.25",
});

const SelectInput = styled(AppInput, {
  background: "white",
  borderColor: "#E5E7EB",
  height: 38,
  rounded: "$3",

  variants: {
    inactive: {
      true: {
        background: "#F9FAFB",
        opacity: 0.68,
      },
    },
  } as const,
});

const OptionsPanel = styled(YStack, {
  background: "white",
  borderColor: "#D1FAE5",
  borderWidth: 1,
  mt: "$0.5",
  overflow: "hidden",
  rounded: "$3",
  shadowColor: "rgba(15, 118, 110, 0.12)",
  shadowRadius: 10,
});

const OptionButton = styled(Button, {
  background: "white",
  borderWidth: 0,
  height: 30,
  px: "$2.5",
  rounded: 0,
  ...({
    justifyContent: "flex-start",
  } as Record<string, unknown>),

  hoverStyle: {
    background: "#ECFDF5",
  },
});

const OptionText = styled(Text, {
  color: "#111827",
  fontSize: "$caption",
  fontWeight: "$label",
  letterSpacing: "$body",
});

const EmptyText = styled(Text, {
  color: "#6B7280",
  fontSize: "$caption",
  p: "$3",
});
