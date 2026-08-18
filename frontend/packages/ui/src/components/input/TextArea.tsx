"use client";

import {
  ElementRef,
  ForwardRefExoticComponent,
  RefAttributes,
  forwardRef,
} from "react";
import { TextArea as TamaguiTextArea, TextAreaProps } from "tamagui";

export type AppTextAreaProps = TextAreaProps;

export const AppTextArea: ForwardRefExoticComponent<
  AppTextAreaProps & RefAttributes<ElementRef<typeof TamaguiTextArea>>
> = forwardRef((props, ref) => {
  return (
    <TamaguiTextArea
      ref={ref}
      size="$4"
      background="#FCFCFD"
      borderWidth={1}
      borderColor="#D8E1EC"
      rounded="$3"
      fontSize="$caption"
      fontWeight="$body"
      letterSpacing="$body"
      height={96}
      p="$3"
      focusStyle={{
        background: "#FFFFFF",
        borderColor: "#059669",
        boxShadow: "0 0 0 3px rgba(5, 150, 105, 0.12)",
      }}
      {...props}
    />
  );
});

AppTextArea.displayName = "AppTextArea";
