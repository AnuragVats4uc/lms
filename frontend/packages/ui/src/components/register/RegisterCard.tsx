"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Controller,
  Resolver,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import {
  Button,
  Card,
  styled,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { AppButton } from "../button";
import {
  AppForm,
  FormField,
  FormLabel,
  FormMessage,
} from "../form";
import { PasswordInput } from "../input/PasswordInput";
import { GraduationCap } from "../login/LoginIcons";
import {
  RegisterFormValues,
  registerGenderOptions,
  registerSchema,
} from "../../validation/auth/register.schema";
import { SearchableSelectField } from "./SearchableSelectField";
import {
  cityOptionsByState,
  stateOptions,
  studentClassOptions,
} from "./registerOptions";

const REGISTER_DEFAULT_VALUES: RegisterFormValues = {
  address: "",
  city: "",
  className: "Graduate",
  confirmPassword: "",
  email: "",
  firstName: "",
  gender: "MALE",
  lastName: "",
  mobile: "",
  password: "",
  state: "",
};

const genderLabels: Record<
  RegisterFormValues["gender"],
  string
> = {
  FEMALE: "Female",
  MALE: "Male",
  OTHER: "Other",
};

const registerResolver = zodResolver(
  registerSchema as unknown as Parameters<
    typeof zodResolver<
      RegisterFormValues,
      unknown,
      RegisterFormValues
    >
  >[0]
) as Resolver<RegisterFormValues>;

export interface RegisterCardProps {
  apiError?: string;
  defaultValues?: Partial<RegisterFormValues>;
  isLoading?: boolean;
  loginLabel?: string;
  onLoginPress?: () => void;
  onSubmit?: (
    values: RegisterFormValues
  ) => void | Promise<void>;
  registerLabel?: string;
  successMessage?: string;
}

const compactLabelProps = {
  fontSize: "$caption",
  mb: 0,
} as const;

export const RegisterCard = memo(function RegisterCard({
  apiError,
  defaultValues,
  isLoading = false,
  loginLabel = "Login",
  onLoginPress,
  onSubmit,
  registerLabel = "Create account",
  successMessage,
}: RegisterCardProps) {
  const formDefaultValues = useMemo<RegisterFormValues>(
    () => ({
      ...REGISTER_DEFAULT_VALUES,
      ...defaultValues,
    }),
    [defaultValues]
  );

  const form = useForm<RegisterFormValues>({
    defaultValues: formDefaultValues,
    resolver: registerResolver,
  });
  const selectedState = useWatch({
    control: form.control,
    name: "state",
  });
  const previousState = useRef(selectedState);
  const cityOptions = selectedState
    ? cityOptionsByState[selectedState] ?? []
    : [];

  useEffect(() => {
    if (previousState.current !== selectedState) {
      form.setValue("city", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      previousState.current = selectedState;
    }
  }, [form, selectedState]);

  const handleSubmit = useCallback(
    (values: RegisterFormValues) => onSubmit?.(values),
    [onSubmit]
  );

  return (
    <RegisterShell>
      <DecorativeCorners />
      <RegisterContent>
        <RegisterHeader />

        <AppForm form={form} onSubmit={handleSubmit}>
          <FormStack>
            <SectionStack>
              <SectionTitle>Personal</SectionTitle>

              <TwoColumnRow>
                <FieldColumn>
                  <FormField<RegisterFormValues, "firstName">
                    id="register-first-name"
                    name="firstName"
                    label="First name"
                    placeholder="First name"
                    autoComplete="given-name"
                    disabled={isLoading}
                    height={38}
                    labelProps={compactLabelProps}
                  />
                </FieldColumn>

                <FieldColumn>
                  <FormField<RegisterFormValues, "lastName">
                    id="register-last-name"
                    name="lastName"
                    label="Last name"
                    placeholder="Last name"
                    autoComplete="family-name"
                    disabled={isLoading}
                    height={38}
                    labelProps={compactLabelProps}
                  />
                </FieldColumn>
              </TwoColumnRow>

              <TwoColumnRow>
                <FieldColumn>
                  <FormField<RegisterFormValues, "mobile">
                    id="register-mobile"
                    name="mobile"
                    label="Mobile number"
                    placeholder="10-digit mobile"
                    disabled={isLoading}
                    keyboardType="phone-pad"
                    height={38}
                    labelProps={compactLabelProps}
                  />
                </FieldColumn>

                <FieldColumn>
                  <FormField<RegisterFormValues, "email">
                    id="register-email"
                    name="email"
                    label="Email address"
                    placeholder="Email address"
                    aria-label="Email address"
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={isLoading}
                    keyboardType="email-address"
                    height={38}
                    labelProps={compactLabelProps}
                  />
                </FieldColumn>
              </TwoColumnRow>
            </SectionStack>

            <SectionStack>
              <SectionTitle>Academic</SectionTitle>

              <TwoColumnRow>
                <FieldColumn>
                  <SearchableSelectField<
                    RegisterFormValues,
                    "className"
                  >
                    disabled={isLoading}
                    label="Class"
                    name="className"
                    options={studentClassOptions}
                    placeholder="Select class"
                    searchable={false}
                    labelProps={compactLabelProps}
                  />
                </FieldColumn>

                <FieldColumn>
                  <GenderField disabled={isLoading} />
                </FieldColumn>
              </TwoColumnRow>
            </SectionStack>

            <SectionStack>
              <SectionTitle>Location</SectionTitle>

              <TwoColumnRow>
                <FieldColumn>
                  <SearchableSelectField<
                    RegisterFormValues,
                    "state"
                  >
                    disabled={isLoading}
                    label="State"
                    name="state"
                    options={stateOptions}
                    placeholder="Search state"
                    labelProps={compactLabelProps}
                  />
                </FieldColumn>

                <FieldColumn>
                  <SearchableSelectField<
                    RegisterFormValues,
                    "city"
                  >
                    disabled={isLoading || !selectedState}
                    label="City"
                    name="city"
                    options={cityOptions}
                    placeholder={
                      selectedState
                        ? "Search city"
                        : "Select state first"
                    }
                    labelProps={compactLabelProps}
                  />
                </FieldColumn>
              </TwoColumnRow>

              <FormField<RegisterFormValues, "address">
                id="register-address"
                name="address"
                label="Address"
                placeholder="House / street / area"
                disabled={isLoading}
                height={38}
                labelProps={compactLabelProps}
              />
            </SectionStack>

            <SectionStack>
              <SectionTitle>Security</SectionTitle>

              <TwoColumnRow>
                <FieldColumn>
                  <FormField<RegisterFormValues, "password">
                    id="register-password"
                    name="password"
                    label="Password"
                    labelProps={compactLabelProps}
                  >
                    {({ field, fieldState, errorId, inputId }) => (
                      <PasswordInput
                        id={inputId}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        placeholder="Password"
                        aria-describedby={
                          fieldState.error ? errorId : undefined
                        }
                        aria-invalid={fieldState.invalid}
                        autoComplete="new-password"
                        disabled={isLoading}
                        height={38}
                        secureTextEntry
                      />
                    )}
                  </FormField>
                </FieldColumn>

                <FieldColumn>
                  <FormField<
                    RegisterFormValues,
                    "confirmPassword"
                  >
                    id="register-confirm-password"
                    name="confirmPassword"
                    label="Confirm password"
                    labelProps={compactLabelProps}
                  >
                    {({ field, fieldState, errorId, inputId }) => (
                      <PasswordInput
                        id={inputId}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        placeholder="Confirm password"
                        aria-describedby={
                          fieldState.error ? errorId : undefined
                        }
                        aria-invalid={fieldState.invalid}
                        autoComplete="new-password"
                        disabled={isLoading}
                        height={38}
                        secureTextEntry
                      />
                    )}
                  </FormField>
                </FieldColumn>
              </TwoColumnRow>
            </SectionStack>

            {apiError ? (
              <AlertText tone="error" role="alert">
                {apiError}
              </AlertText>
            ) : null}

            {successMessage ? (
              <AlertText tone="success" role="status">
                {successMessage}
              </AlertText>
            ) : null}

            <AppButton
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              background="#10B981"
              height={40}
              pressStyle={{ background: "#059669" }}
              hoverStyle={{ background: "#059669" }}
              rounded="$3"
              aria-label={registerLabel}
            >
              {registerLabel}
            </AppButton>
          </FormStack>
        </AppForm>

        <FooterRow>
          <FooterPrompt>
            Already have an account?
          </FooterPrompt>
          <FooterButton
            type="button"
            chromeless
            pressStyle={{ opacity: 0.72 }}
            onPress={onLoginPress}
            aria-label={loginLabel}
          >
            <FooterAction>{loginLabel}</FooterAction>
          </FooterButton>
        </FooterRow>
      </RegisterContent>
    </RegisterShell>
  );
});

function GenderField({
  disabled,
}: {
  disabled?: boolean;
}) {
  const { control } = useFormContext<RegisterFormValues>();

  return (
    <Controller
      control={control}
      name="gender"
      render={({ field, fieldState }) => {
        const errorId = "register-gender-error";

        return (
          <YStack gap="$0.5">
            <FormLabel {...compactLabelProps}>Gender</FormLabel>

            <GenderRow>
              {registerGenderOptions.map((gender) => {
                const isSelected = field.value === gender;

                return (
                  <GenderButton
                    key={gender}
                    type="button"
                    disabled={disabled}
                    selected={isSelected}
                    onPress={() => field.onChange(gender)}
                    aria-label={genderLabels[gender]}
                  >
                    <GenderButtonText selected={isSelected}>
                      {genderLabels[gender]}
                    </GenderButtonText>
                  </GenderButton>
                );
              })}
            </GenderRow>

            <FormMessage
              id={errorId}
              message={fieldState.error?.message}
            />
          </YStack>
        );
      }}
    />
  );
}

function RegisterHeader() {
  return (
    <RegisterHeaderStack>
      <RegisterBrandRow>
        <GraduationCap
          size={22}
          color="#10B981"
          strokeWidth={2.4}
        />

        <RegisterBrandText>The LMS</RegisterBrandText>
      </RegisterBrandRow>

      <RegisterTitle>Create account</RegisterTitle>

      <RegisterSubtitle>
        Register to start your learning journey
      </RegisterSubtitle>
    </RegisterHeaderStack>
  );
}

function RegisterShell({ children }: { children: React.ReactNode }) {
  return (
    <RegisterShellFrame style={registerShellStyle}>
      {children}
    </RegisterShellFrame>
  );
}

const RegisterShellFrame = styled(Card, {
  background: "white",
  borderColor: "rgba(16, 185, 129, 0.16)",
  borderWidth: 1,
  overflow: "hidden",
  p: "$4",
  rounded: "$8",
  shadowColor: "rgba(15, 118, 110, 0.22)",
  shadowRadius: 28,
  width: "100%",

  $sm: {
    p: "$2.5",
    rounded: "$6",
  },
});

const registerShellStyle = {
  maxWidth: 700,
  position: "relative",
} satisfies CSSProperties;

const RegisterContent = styled(YStack, {
  gap: "$2",
  ...({
    position: "relative",
    zIndex: 1,
  } as Record<string, unknown>),
});

const FormStack = styled(YStack, {
  gap: "$1",
});

const SectionStack = styled(YStack, {
  gap: "$0.5",
});

const SectionTitle = styled(Text, {
  color: "#047857",
  fontSize: "$caption",
  fontWeight: "$button",
  letterSpacing: "$body",
  mt: "$0.5",
});

const TwoColumnRow = styled(XStack, {
  gap: "$2",

  $sm: {
    flexDirection: "row",
    gap: "$1.5",
  },
});

const FieldColumn = styled(YStack, {
  flex: 1,
  ...({
    minWidth: 0,
  } as Record<string, unknown>),
});

const GenderRow = styled(XStack, {
  gap: "$1",
});

const GenderButton = styled(Button, {
  background: "white",
  borderColor: "#E5E7EB",
  borderWidth: 1,
  height: 32,
  px: "$1.5",
  rounded: "$3",
  flex: 1,

  variants: {
    selected: {
      true: {
        background: "#D1FAE5",
        borderColor: "#10B981",
      },
    },
  } as const,

  hoverStyle: {
    borderColor: "#10B981",
  },
});

const GenderButtonText = styled(Text, {
  color: "#6B7280",
  fontSize: "$caption",
  fontWeight: "$button",
  letterSpacing: "$body",

  variants: {
    selected: {
      true: {
        color: "#047857",
      },
    },
  } as const,
});

const RegisterHeaderStack = styled(YStack, {
  gap: "$0.5",
  mb: "$0.5",
  ...({
    alignItems: "center",
  } as Record<string, unknown>),
});

const RegisterBrandRow = styled(XStack, {
  gap: "$1.5",
  ...({
    alignItems: "center",
  } as Record<string, unknown>),
});

const RegisterBrandText = styled(Text, {
  color: "#10B981",
  fontSize: 21,
  fontWeight: "$subheading",
  letterSpacing: "$heading",
});

const RegisterTitle = styled(Text, {
  color: "#111827",
  fontSize: 20,
  fontWeight: "$subheading",
  letterSpacing: "$heading",
  mt: "$0.5",
  ...({
    textAlign: "center",
  } as Record<string, unknown>),
});

const RegisterSubtitle = styled(Text, {
  color: "#6B7280",
  fontSize: "$caption",
  fontWeight: "$caption",
  letterSpacing: "$body",
  ...({
    textAlign: "center",
  } as Record<string, unknown>),
});

const AlertText = styled(Text, {
  borderWidth: 1,
  fontSize: "$caption",
  fontWeight: "$label",
  letterSpacing: "$body",
  p: "$2",
  rounded: "$3",

  variants: {
    tone: {
      error: {
        background: "#FEF2F2",
        borderColor: "#FECACA",
        color: "#B91C1C",
      },
      success: {
        background: "#ECFDF5",
        borderColor: "#A7F3D0",
        color: "#047857",
      },
    },
  } as const,
});

const FooterRow = styled(XStack, {
  gap: "$1",
  ...({
    alignItems: "center",
    justifyContent: "center",
  } as Record<string, unknown>),
});

const FooterPrompt = styled(Text, {
  color: "#111827",
  fontSize: "$caption",
  fontWeight: "$body",
  letterSpacing: "$body",
});

const FooterButton = styled(Button, {
  height: 24,
  p: 0,
});

const FooterAction = styled(Text, {
  color: "#10B981",
  fontSize: "$caption",
  fontWeight: "$button",
  letterSpacing: "$button",
});

function DecorativeCorners() {
  return (
    <>
      <TopRightBlob />
      <TopLeftPetal />
      <TopLeftPetalSmall />
      <BottomLeftBlob />
      <BottomRightPetal />
    </>
  );
}

function TopRightBlob() {
  return <TopRightBlobFrame style={topRightBlobStyle} />;
}

const TopRightBlobFrame = styled(View, {
  background: "#CFF7EA",
  borderBottomLeftRadius: 74,
  height: 82,
  opacity: 0.68,
  width: 116,
});

const topRightBlobStyle = {
  position: "absolute",
  right: -30,
  top: -42,
} satisfies CSSProperties;

function TopLeftPetal() {
  return <TopLeftPetalFrame style={topLeftPetalStyle} />;
}

const TopLeftPetalFrame = styled(View, {
  background: "#10B981",
  borderBottomRightRadius: 18,
  borderTopLeftRadius: 18,
  height: 18,
  opacity: 0.64,
  width: 28,
});

const topLeftPetalStyle = {
  left: 14,
  position: "absolute",
  top: 18,
  transform: "rotate(-35deg)",
} satisfies CSSProperties;

function TopLeftPetalSmall() {
  return <TopLeftPetalSmallFrame style={topLeftPetalSmallStyle} />;
}

const TopLeftPetalSmallFrame = styled(View, {
  background: "#10B981",
  borderBottomRightRadius: 14,
  borderTopLeftRadius: 14,
  height: 14,
  opacity: 0.58,
  width: 22,
});

const topLeftPetalSmallStyle = {
  left: 44,
  position: "absolute",
  top: 40,
  transform: "rotate(-35deg)",
} satisfies CSSProperties;

function BottomLeftBlob() {
  return <BottomLeftBlobFrame style={bottomLeftBlobStyle} />;
}

const BottomLeftBlobFrame = styled(View, {
  background: "#BDF4E5",
  borderTopRightRadius: 76,
  height: 94,
  opacity: 0.72,
  width: 116,
});

const bottomLeftBlobStyle = {
  bottom: -34,
  left: -44,
  position: "absolute",
} satisfies CSSProperties;

function BottomRightPetal() {
  return <BottomRightPetalFrame style={bottomRightPetalStyle} />;
}

const BottomRightPetalFrame = styled(View, {
  background: "#A7F3D0",
  borderBottomRightRadius: 24,
  borderTopLeftRadius: 24,
  height: 44,
  opacity: 0.58,
  width: 58,
});

const bottomRightPetalStyle = {
  bottom: 18,
  position: "absolute",
  right: -18,
  transform: "rotate(-24deg)",
} satisfies CSSProperties;
