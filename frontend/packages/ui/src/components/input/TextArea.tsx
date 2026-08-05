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
      borderWidth={1}
      borderColor="$borderColor"
      fontSize="$label"
      fontWeight="$body"
      letterSpacing="$body"
      height={96}
      p="$3"
      focusStyle={{
        borderColor: "$blue10",
      }}
      {...props}
    />
  );
});

AppTextArea.displayName = "AppTextArea";
