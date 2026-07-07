"use client";

import { forwardRef } from "react";
import {
  Input as TamaguiInput,
  InputProps,
} from "tamagui";

export interface AppInputProps extends InputProps {}

export const AppInput = forwardRef<any, AppInputProps>(
  (props, ref) => {
    return (
      <TamaguiInput
        ref={ref}
        size="$4"
        borderWidth={1}
        borderColor="$borderColor"
        focusStyle={{
          borderColor: "$blue10",
        }}
        {...props}
      />
    );
  }
);

AppInput.displayName = "AppInput";