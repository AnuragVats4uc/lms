"use client";

import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  FileStack,
  GraduationCap,
  LifeBuoy,
  LockKeyhole,
  Network,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import {
  getAuthErrorMessage,
  PublicRoute,
  useLogin,
} from "@repo/auth";
import {
  LoginCard,
  LoginFormValues,
  Text,
  styled,
  View,
  XStack,
  YStack,
} from "@repo/ui";

const LOGIN_PREFILL_STORAGE_KEY = "lms.registrationLoginPrefill";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const [prefillPassword, setPrefillPassword] = useState("");
  const {
    error,
    isPending,
    mutate,
  } = useLogin();

  const handleSubmit = useCallback(
    (values: LoginFormValues) => {
      mutate({
        email: values.email,
        password: values.password,
      });
    },
    [mutate]
  );
  const defaultValues = useMemo(
    () => ({
      email: queryEmail,
      password: prefillPassword,
    }),
    [prefillPassword, queryEmail],
  );

  useEffect(() => {
    if (!queryEmail || typeof window === "undefined") return;

    const raw = window.sessionStorage.getItem(LOGIN_PREFILL_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        email?: string;
        password?: string;
        timestamp?: number;
      };
      const isFresh =
        typeof parsed.timestamp === "number" &&
        Date.now() - parsed.timestamp < 5 * 60 * 1000;

      if (
        isFresh &&
        parsed.email?.trim().toLowerCase() === queryEmail &&
        parsed.password
      ) {
        setPrefillPassword(parsed.password);
      }
    } finally {
      window.sessionStorage.removeItem(LOGIN_PREFILL_STORAGE_KEY);
    }
  }, [queryEmail]);

  return (
    <PublicRoute>
      <LoginPageShellFrame
        className="lms-login-shell"
        style={loginPageShellStyle}
      >
        <BackgroundGrid />
        <BackgroundGlow style={topGlowStyle} />
        <BackgroundGlow style={bottomGlowStyle} />

        <LoginTopbar className="lms-login-topbar" style={topbarStyle}>
          <BrandLockup />
          <a
            aria-label="Open help and support"
            href="mailto:support@thelms.local"
            style={supportLinkStyle}
          >
            <LifeBuoy aria-hidden="true" size={16} strokeWidth={2.1} />
            <span>Help / Support</span>
          </a>
        </LoginTopbar>

        <LoginContent className="lms-login-content" style={loginContentStyle}>
          <HeroPanel className="lms-login-hero" style={heroPanelStyle}>
            <HeroCopy>
              <HeroKicker style={heroKickerStyle}>
                <ShieldCheck aria-hidden="true" size={16} strokeWidth={2.2} />
                <Text
                  color="#047857"
                  fontSize="$label"
                  fontWeight="$button"
                  lineHeight="$label"
                >
                  Secure Learning Management Platform
                </Text>
              </HeroKicker>
              <HeroTitle
                className="lms-login-hero-title"
                style={heroTitleStyle}
              >
                One platform. Every learning experience.
              </HeroTitle>
              <HeroText className="lms-login-hero-text" style={heroTextStyle}>
                Access your LMS workspace securely to learn, teach, manage
                content, and keep your organization moving.
              </HeroText>
            </HeroCopy>

            <PlatformVisual />
          </HeroPanel>

          <LoginCardColumn className="lms-login-card-column" style={loginCardColumnStyle}>
            <LoginCard
              apiError={
                error ? getAuthErrorMessage(error) : undefined
              }
              defaultValues={defaultValues}
              headerProps={{
                subtitle: "Sign in to continue to your workspace.",
              }}
              isLoading={isPending}
              key={`${defaultValues.email}:${defaultValues.password ? "prefilled" : "empty"}`}
              loginLabel="Login"
              onForgotPasswordPress={() =>
                router.push("/forgot-password")
              }
              onSubmit={handleSubmit}
              showFooter={false}
            />
            <SecureNote style={secureNoteStyle}>
              <ShieldCheck aria-hidden="true" size={15} strokeWidth={2.1} />
              <Text color="#52627A" fontSize="$caption" fontWeight="$label">
                Secure LMS Platform
              </Text>
            </SecureNote>
          </LoginCardColumn>
        </LoginContent>
      </LoginPageShellFrame>
    </PublicRoute>
  );
}

const LoginPageShellFrame = styled(YStack, {
  flex: 1,
  background:
    "linear-gradient(135deg, #F7FCFA 0%, #EEF8F4 48%, #E5F5EE 100%)",
  p: "$4",
  width: "100%",

  $sm: {
    p: "$3",
  },
});

const loginPageShellStyle = {
  height: "100vh",
  maxHeight: "100vh",
  overflow: "hidden",
  position: "relative",
} satisfies CSSProperties;

const LoginTopbar = styled(XStack, {
  width: "100%",
});

const topbarStyle = {
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "space-between",
  margin: "0 auto",
  maxWidth: 1180,
  position: "relative",
  width: "100%",
  zIndex: 2,
} satisfies CSSProperties;

function BrandLockup() {
  return (
    <XStack style={brandLockupStyle}>
      <XStack style={brandMarkStyle}>
        <GraduationCap
          aria-hidden="true"
          color="#0A7A5F"
          size={21}
          strokeWidth={2.4}
        />
      </XStack>
      <YStack>
        <Text
          color="#0A7A5F"
          fontSize={21}
          fontWeight="$heading"
          lineHeight={23}
        >
          The LMS
        </Text>
        <Text
          color="#52627A"
          fontSize="$caption"
          fontWeight="$label"
          lineHeight="$caption"
        >
          Learning Management Platform
        </Text>
      </YStack>
    </XStack>
  );
}

const brandLockupStyle = {
  alignItems: "center",
  gap: 12,
  minWidth: 0,
} satisfies CSSProperties;

const brandMarkStyle = {
  alignItems: "center",
  background: "#E5F7EF",
  border: "1px solid rgba(5, 150, 105, 0.18)",
  borderRadius: 12,
  boxShadow: "0 10px 24px rgba(5, 150, 105, 0.12)",
  height: 38,
  justifyContent: "center",
  width: 38,
} satisfies CSSProperties;

const supportLinkStyle = {
  alignItems: "center",
  background: "rgba(255, 255, 255, 0.72)",
  border: "1px solid #DCE8E2",
  borderRadius: 999,
  color: "#334155",
  display: "inline-flex",
  fontSize: 13,
  fontWeight: 700,
  gap: 8,
  height: 38,
  padding: "0 12px",
  textDecoration: "none",
} satisfies CSSProperties;

const LoginContent = styled(XStack, {
  flex: 1,
  width: "100%",
});

const loginContentStyle = {
  alignItems: "center",
  flexDirection: "row",
  gap: 56,
  justifyContent: "space-between",
  margin: "0 auto",
  maxWidth: 1200,
  minHeight: 0,
  padding: "28px 0 0",
  position: "relative",
  width: "100%",
  zIndex: 1,
} satisfies CSSProperties;

const HeroPanel = styled(YStack, {
  flex: 1,
  minW: 0,
});

const heroPanelStyle = {
  gap: 18,
  maxWidth: 640,
} satisfies CSSProperties;

const HeroCopy = styled(YStack, {
  gap: "$3",
});

const HeroKicker = styled(XStack, {
  background: "rgba(255, 255, 255, 0.74)",
  borderColor: "#CFE7DD",
  borderWidth: 1,
  gap: "$2",
  px: "$3",
  py: "$2",
  rounded: "$10",
});

const heroKickerStyle = {
  alignItems: "center",
  alignSelf: "flex-start",
} satisfies CSSProperties;

const HeroTitle = styled(Text, {
  color: "#0F1D3A",
  fontSize: 42,
  fontWeight: "$heading",
  lineHeight: 48,

  $sm: {
    fontSize: 34,
    lineHeight: 40,
  },
});

const heroTitleStyle = {
  maxWidth: 620,
} satisfies CSSProperties;

const HeroText = styled(Text, {
  color: "#334155",
  fontSize: "$bodyLarge",
  fontWeight: "$body",
  lineHeight: "$bodyLarge",
});

const heroTextStyle = {
  maxWidth: 540,
} satisfies CSSProperties;

function PlatformVisual() {
  return (
    <VisualFrame
      aria-hidden
      className="lms-login-visual"
      style={visualFrameStyle}
    >
      <VisualCard className="lms-login-visual-card" style={visualMainCardStyle}>
        <VisualCardHeader>
          <VisualDot style={{ background: "#10B981" }} />
          <VisualDot style={{ background: "#60A5FA" }} />
          <VisualDot style={{ background: "#A78BFA" }} />
        </VisualCardHeader>
        <VisualMetricRow style={centeredRowStyle}>
          <VisualIconBubble
            style={{ ...centeredRowStyle, background: "#DCFCE7" }}
          >
            <BookOpen color="#059669" size={20} strokeWidth={2.1} />
          </VisualIconBubble>
          <VisualLineGroup>
            <VisualLine style={{ width: "78%" }} />
            <VisualLine muted style={{ width: "52%" }} />
          </VisualLineGroup>
        </VisualMetricRow>
        <div style={visualTileGridStyle}>
          <VisualMetricRow style={visualTileStyle}>
            <FileStack color="#2563EB" size={18} strokeWidth={2.1} />
            <Text color="#172033" fontSize="$label" fontWeight="$label">
              Resources
            </Text>
          </VisualMetricRow>
          <VisualTile style={visualTileStyle}>
            <UsersRound color="#7C3AED" size={18} strokeWidth={2.1} />
            <Text color="#172033" fontSize="$label" fontWeight="$label">
              People
            </Text>
          </VisualTile>
          <VisualTile style={visualTileStyle}>
            <BarChart3 color="#F59E0B" size={18} strokeWidth={2.1} />
            <Text color="#172033" fontSize="$label" fontWeight="$label">
              Insights
            </Text>
          </VisualTile>
        </div>
      </VisualCard>

      <VisualOrbit />

      <TrustRow style={trustRowStyle}>
        <TrustItem style={trustItemStyle}>
          <Network aria-hidden="true" size={15} strokeWidth={2.1} />
          <Text color="#334155" fontSize="$caption" fontWeight="$label">
            Connected learning
          </Text>
        </TrustItem>
        <TrustItem style={trustItemStyle}>
          <ShieldCheck aria-hidden="true" size={15} strokeWidth={2.1} />
          <Text color="#334155" fontSize="$caption" fontWeight="$label">
            Managed access
          </Text>
        </TrustItem>
        <TrustItem style={trustItemStyle}>
          <LockKeyhole aria-hidden="true" size={15} strokeWidth={2.1} />
          <Text color="#334155" fontSize="$caption" fontWeight="$label">
            Secure login
          </Text>
        </TrustItem>
        <TrustItem style={trustItemStyle}>
          <Network aria-hidden="true" size={15} strokeWidth={2.1} />
          <Text color="#334155" fontSize="$caption" fontWeight="$label">
            Role-aware access
          </Text>
        </TrustItem>
      </TrustRow>
    </VisualFrame>
  );
}

const VisualFrame = styled(YStack, {
  gap: "$3",
  width: "100%",

  $sm: {
    gap: "$2",
  },
});

const visualFrameStyle = {
  maxWidth: 560,
  position: "relative",
} satisfies CSSProperties;

const VisualCard = styled(YStack, {
  background:
    "linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(246, 253, 250, 0.86))",
  borderColor: "rgba(216, 226, 235, 0.92)",
  borderWidth: 1,
  gap: "$4",
  maxW: 470,
  p: "$4",
  rounded: "$6",
});

const visualMainCardStyle = {
  boxShadow:
    "0 28px 60px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.86)",
  minHeight: 214,
  position: "relative",
  width: "min(100%, 470px)",
  zIndex: 1,
} satisfies CSSProperties;

const VisualCardHeader = styled(XStack, {
  gap: "$2",
});

const VisualDot = styled(View, {
  height: 9,
  rounded: "$10",
  width: 9,
});

const VisualMetricRow = styled(XStack, {
  background: "#FFFFFF",
  borderColor: "#E1E7F0",
  borderWidth: 1,
  gap: "$3",
  p: "$3",
  rounded: "$4",
});

const VisualIconBubble = styled(XStack, {
  height: 40,
  rounded: "$4",
  width: 40,
});

const centeredRowStyle = {
  alignItems: "center",
  justifyContent: "center",
} satisfies CSSProperties;

const visualTileStyle = {
  alignItems: "center",
  justifyContent: "flex-start",
  minWidth: 0,
} satisfies CSSProperties;

const VisualLineGroup = styled(YStack, {
  flex: 1,
  gap: "$2",
});

const VisualLine = styled(View, {
  background: "#0F1D3A",
  height: 9,
  opacity: 0.78,
  rounded: "$10",

  variants: {
    muted: {
      true: {
        background: "#CBD5E1",
        opacity: 1,
      },
    },
  } as const,
});

const visualTileGridStyle = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "1fr",
} satisfies CSSProperties;

const VisualTile = styled(XStack, {
  background: "#FFFFFF",
  borderColor: "#E1E7F0",
  borderWidth: 1,
  flex: 1,
  gap: "$2",
  minH: 66,
  p: "$3",
  rounded: "$4",
});

function VisualOrbit() {
  return <VisualOrbitFrame style={visualOrbitStyle} />;
}

const VisualOrbitFrame = styled(View, {
  borderColor: "rgba(5, 150, 105, 0.18)",
  borderWidth: 1,
  height: 230,
  rounded: "$10",
  width: 230,
});

const visualOrbitStyle = {
  bottom: 62,
  position: "absolute",
  right: 0,
  zIndex: 0,
} satisfies CSSProperties;

const TrustRow = styled(XStack, {
  gap: "$1.5",
  maxW: 560,
  width: "100%",

  $sm: {
    flexDirection: "row",
  },
});

const trustRowStyle = {
  alignItems: "center",
  flexWrap: "nowrap",
  // justifyContent: "center",
  position: "relative",
  zIndex: 1,
} satisfies CSSProperties;

const TrustItem = styled(XStack, {
  background: "rgba(255, 255, 255, 0.68)",
  borderColor: "#DCE8E2",
  borderWidth: 1,
  gap: "$1.5",
  height: 28,
  px: "$2",
  rounded: "$10",
});

const trustItemStyle = {
  alignItems: "center",
  flex: "0 0 auto",
  justifyContent: "flex-start",
  minWidth: 0,
  whiteSpace: "nowrap",
} satisfies CSSProperties;

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

function BackgroundGrid() {
  return <BackgroundGridFrame aria-hidden style={backgroundGridStyle} />;
}

const BackgroundGridFrame = styled(View, {
  opacity: 0.42,
});

const backgroundGridStyle = {
  backgroundImage:
    "linear-gradient(rgba(15, 29, 58, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 29, 58, 0.035) 1px, transparent 1px)",
  backgroundSize: "36px 36px",
  bottom: 0,
  left: 0,
  position: "absolute",
  right: 0,
  top: 0,
} satisfies CSSProperties;

const BackgroundGlow = styled(View, {
  rounded: "$10",
});

const topGlowStyle = {
  background:
    "radial-gradient(circle, rgba(16, 185, 129, 0.18), transparent 62%)",
  height: 360,
  left: -90,
  position: "absolute",
  top: -130,
  width: 360,
} satisfies CSSProperties;

const bottomGlowStyle = {
  background:
    "radial-gradient(circle, rgba(37, 99, 235, 0.12), transparent 64%)",
  bottom: -150,
  height: 420,
  position: "absolute",
  right: -120,
  width: 420,
} satisfies CSSProperties;
