import type { CSSProperties } from "react";
import { GraduationCap, LifeBuoy } from "lucide-react";
import { styled, Text, XStack, YStack } from "@repo/ui";

import { LOGIN_SUPPORT_EMAIL } from "../constants";

export const LoginHeader = () => (
  <LoginTopbar className="lms-login-topbar" style={topbarStyle}>
    <BrandLockup />
    <a
      aria-label="Open help and support"
      className="lms-login-support-link"
      href={`mailto:${LOGIN_SUPPORT_EMAIL}`}
      style={supportLinkStyle}
    >
      <LifeBuoy aria-hidden="true" size={16} strokeWidth={2.1} />
      <span>Help / Support</span>
    </a>
  </LoginTopbar>
);

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

const BrandLockup = () => (
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
      <Text color="#0A7A5F" fontSize={21} fontWeight="$heading" lineHeight={23}>
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
