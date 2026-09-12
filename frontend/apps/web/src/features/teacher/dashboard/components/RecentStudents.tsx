import { TeacherDashboardRecentStudent } from "@repo/types";
import { AppCard, YStack } from "@repo/ui";
import { SectionHeader } from "./SectionHeader";
import { UsersRound } from "lucide-react";
import { RecentStudentRow } from "./RecentStudentRow";
import { EmptyText } from "./EmptyText";

export const RecentStudents = ({
  students,
}: {
  students: TeacherDashboardRecentStudent[];
}) => {
  return (
    <AppCard background="#FFFFFF" borderColor="#E1E7F0" rounded="$3">
      <YStack gap="$4">
        <SectionHeader
          icon={<UsersRound aria-hidden="true" size={18} strokeWidth={2.2} />}
          title="Recent Students"
        />
        {students.length ? (
          <YStack gap="$2">
            {students.map((student) => (
              <RecentStudentRow key={student.id} student={student} />
            ))}
          </YStack>
        ) : (
          <EmptyText text="No enrolled students for assigned courses." />
        )}
      </YStack>
    </AppCard>
  );
};
