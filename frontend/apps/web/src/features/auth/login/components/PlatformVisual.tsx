import type { CSSProperties } from "react";
import {
  BarChart3,
  BookOpen,
  FileStack,
  LockKeyhole,
  Network,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { styled, Text, View, XStack, YStack } from "@repo/ui";

export const PlatformVisual = () => (
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

    <VisualOrbitFrame style={visualOrbitStyle} />

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
