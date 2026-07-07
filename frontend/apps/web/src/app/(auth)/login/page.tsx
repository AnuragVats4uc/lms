"use client";

import { LoginCard, styled, View, YStack } from "@repo/ui";

export default function LoginPage() {
  return (
    <LoginPageShell>
      <TopBackgroundShape />
      <BottomBackgroundShape />
      <LoginCard />
    </LoginPageShell>
  );
}

const LoginPageShell = styled(YStack, {
  flex: 1,
  ...({
    alignItems: "center",
    background:
      "linear-gradient(135deg, #ECFDF5 0%, #F8FAFC 44%, #D1FAE5 100%)",
    justifyContent: "center",
    minHeight: "100vh",
    overflow: "hidden",
    padding: "28px 20px",
    position: "relative",
  } as any),
});

const TopBackgroundShape = styled(View, {
  height: 190,
  width: 250,
  ...({
    backgroundColor: "rgba(16, 185, 129, 0.16)",
    borderBottomRightRadius: 170,
    left: -80,
    position: "absolute",
    top: -90,
  } as any),
});

const BottomBackgroundShape = styled(View, {
  height: 210,
  width: 260,
  ...({
    backgroundColor: "rgba(20, 184, 166, 0.14)",
    borderTopLeftRadius: 180,
    bottom: -110,
    position: "absolute",
    right: -80,
  } as any),
});
