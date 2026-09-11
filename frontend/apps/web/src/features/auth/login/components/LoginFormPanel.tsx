import type { ComponentProps, CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import { LoginCard, styled, Text, XStack, YStack } from "@repo/ui";

type LoginCardProps = ComponentProps<typeof LoginCard>;

type LoginFormPanelProps = Pick<
  LoginCardProps,
  "apiError" | "defaultValues" | "isLoading" | "onSubmit"
> & {
  onForgotPasswordPress: () => void;
};

export const LoginFormPanel = ({
  apiError,
  defaultValues,
  isLoading,
  onForgotPasswordPress,
  onSubmit,
}: LoginFormPanelProps) => (
  <LoginCardColumn
    className="lms-login-card-column"
    style={loginCardColumnStyle}
  >
    <LoginCard
      apiError={apiError}
      defaultValues={defaultValues}
      headerProps={{
        subtitle: "Sign in to continue to your workspace.",
      }}
      isLoading={isLoading}
      loginLabel="Login"
      onForgotPasswordPress={onForgotPasswordPress}
      onSubmit={onSubmit}
      showFooter={false}
    />
    <SecureNote style={secureNoteStyle}>
      <ShieldCheck aria-hidden="true" size={15} strokeWidth={2.1} />
      <Text color="#52627A" fontSize="$caption" fontWeight="$label">
        Secure LMS Platform
      </Text>
    </SecureNote>
  </LoginCardColumn>
);

const LoginCardColumn = styled(YStack, {
  gap: "$3",

  $md: {
    width: "min(100%, 430px)",
  },
});

const loginCardColumnStyle = {
  alignItems: "stretch",
  flexShrink: 0,
  width: "min(100%, 430px)",
} satisfies CSSProperties;

const SecureNote = styled(XStack, {
  gap: "$2",
});

const secureNoteStyle = {
  alignItems: "center",
  justifyContent: "center",
} satisfies CSSProperties;
