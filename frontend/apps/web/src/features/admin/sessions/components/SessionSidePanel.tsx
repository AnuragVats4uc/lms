import { Text, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";
import { DataTableBadgeCell, DataTableDateCell } from "@/components/DataTable";
import type { Session } from "@repo/types";

export function SessionSidePanel({ session, isLoading }: { session: Session | null; isLoading: boolean }) {
  if (!session && !isLoading) return null;
  return <AppCard className="lms-organization-side-panel" background="#FFFFFF" borderColor="#E1E7F0" p="$4" style={{ borderRadius: 16, boxShadow: "0 12px 34px rgba(15, 23, 42, 0.045)", minWidth: 300 }}>
    {isLoading || !session ? <YStack gap="$3"><XStack className="lms-skeleton" style={{ height: 56, width: 56 }} /><XStack className="lms-skeleton" style={{ height: 18, width: 180 }} /><XStack className="lms-skeleton" style={{ height: 120, width: "100%" }} /></YStack> : <YStack gap="$4">
      <XStack gap="$3" style={{ alignItems: "center" }}><XStack style={{ alignItems: "center", backgroundColor: "#DDF4E7", borderRadius: 999, height: 58, justifyContent: "center", width: 58 }}><Text color="#047857" fontSize={22} fontWeight="$heading">{session.name.slice(0, 1)}</Text></XStack><YStack style={{ minWidth: 0 }}><Text color="#0F1D3A" fontSize="$label" fontWeight="$heading" numberOfLines={1}>{session.name}</Text><Text color="#52627A" fontSize="$caption">{session.code ?? "No code"}</Text></YStack></XStack>
      <XStack gap="$2" style={{ flexWrap: "wrap" }}><DataTableBadgeCell label={session.isActive ? "Active" : "Inactive"} tone={session.isActive ? "green" : "gray"} /><DataTableBadgeCell label={session.status} tone={session.status === "COMPLETED" ? "blue" : "green"} /></XStack>
      <YStack gap="$2"><Text color="#52627A" fontSize="$caption">Description</Text><Text color="#0F1D3A" fontSize="$caption">{session.description || "No description provided."}</Text><Text color="#52627A" fontSize="$caption">Starts</Text><DataTableDateCell value={session.startDate} /><Text color="#52627A" fontSize="$caption">Ends</Text><DataTableDateCell value={session.endDate} /><Text color="#52627A" fontSize="$caption">Updated</Text><DataTableDateCell value={session.updatedAt} /></YStack>
    </YStack>}
  </AppCard>;
}
