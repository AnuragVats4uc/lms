"use client";

import {
  ProtectedRoute,
  useAuthSession,
  useLogout,
} from "@repo/auth";
import {
  Button,
  Card,
  styled,
  Text,
  YStack,
} from "@repo/ui";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const {
    currentUser,
    role,
  } = useAuthSession();
  const logout = useLogout();

  return (
    <DashboardShell>
      <DashboardCard>
        <TitleText>Dashboard</TitleText>
        <BodyText>
          {currentUser
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : "Authenticated user"}
        </BodyText>
        <MetaText>{role ?? "Student"}</MetaText>

        <Button
          type="button"
          theme="blue"
          disabled={logout.isPending}
          onPress={() => logout.mutate()}
        >
          <Button.Text>
            {logout.isPending ? "Signing out..." : "Logout"}
          </Button.Text>
        </Button>
      </DashboardCard>
    </DashboardShell>
  );
}

const DashboardShell = styled(YStack, {
  flex: 1,
  background: "#F8FAFC",
  p: "$5",
});

const DashboardCard = styled(Card, {
  background: "white",
  borderColor: "#E5E7EB",
  borderWidth: 1,
  gap: "$3",
  p: "$5",
  rounded: "$4",
});

const TitleText = styled(Text, {
  color: "#111827",
  fontSize: "$h3",
  fontWeight: "$heading",
  letterSpacing: "$body",
});

const BodyText = styled(Text, {
  color: "#374151",
  fontSize: "$body",
  fontWeight: "$body",
  letterSpacing: "$body",
});

const MetaText = styled(Text, {
  color: "#6B7280",
  fontSize: "$label",
  fontWeight: "$label",
  letterSpacing: "$body",
});
