"use client";

import {
  ElementRef,
  ForwardRefExoticComponent,
  RefAttributes,
  forwardRef,
} from "react";
import { Input as TamaguiInput, InputProps } from "tamagui";

export type AppInputProps = InputProps;

export const AppInput: ForwardRefExoticComponent<
  AppInputProps & RefAttributes<ElementRef<typeof TamaguiInput>>
> = forwardRef((props, ref) => {
  return (
    <TamaguiInput
      ref={ref}
      size="$4"
      background="#FCFCFD"
      borderWidth={1}
      borderColor="#D8E1EC"
      color="#172033"
      rounded="$3"
      fontSize={13}
      fontWeight={600}
      letterSpacing="$body"
      height={42}
      placeholderTextColor={"#94A3B8" as never}
      px="$3"
      focusStyle={{
        background: "#FFFFFF",
        borderColor: "#059669",
        boxShadow: "0 0 0 3px rgba(5, 150, 105, 0.12)",
      }}
      {...props}
    />
  );
});

AppInput.displayName = "AppInput";
