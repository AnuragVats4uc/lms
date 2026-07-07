"use client";

import {
  ElementRef,
  ForwardRefExoticComponent,
  RefAttributes,
  forwardRef,
} from "react";
import {
  Input as TamaguiInput,
  InputProps,
} from "tamagui";

export type AppInputProps = InputProps;

export const AppInput: ForwardRefExoticComponent<
  AppInputProps &
    RefAttributes<ElementRef<typeof TamaguiInput>>
> = forwardRef(
  (props, ref) => {
    return (
      <TamaguiInput
        ref={ref}
        size="$4"
        borderWidth={1}
        borderColor="$borderColor"
        fontSize="$label"
        fontWeight="$body"
        letterSpacing="$body"
        focusStyle={{
          borderColor: "$blue10",
        }}
        {...props}
      />
    );
  }
);

AppInput.displayName = "AppInput";
