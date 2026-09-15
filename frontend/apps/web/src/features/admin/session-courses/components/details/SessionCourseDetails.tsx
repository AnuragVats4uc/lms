import {
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { SessionCourse } from "@repo/types";
import { YStack } from "@repo/ui";
import {
  CrudBadge,
  CrudDetailField,
  CrudDetailSection,
} from "../../../components/crud";
import { getSessionCourseStatusTone } from "../../utils/sessionCoursePresentation";

export const SessionCourseDetails = ({ item }: { item: SessionCourse }) => (
  <YStack gap="$3">
    <CrudDetailSection
      icon={<BookOpen color="#059669" size={15} />}
      title="Assignment"
    >
      <CrudDetailField
        icon={<BookOpen color="#059669" size={15} />}
        label="Course"
        value={`${item.course.name} (${item.course.code})`}
      />
      <CrudDetailField
        icon={<CalendarDays color="#059669" size={15} />}
        label="Session ID"
        value={item.sessionId}
      />
      <CrudDetailField
        icon={<Clock3 color="#059669" size={15} />}
        label="Sort order"
        value={item.sortOrder}
      />
    </CrudDetailSection>
    <CrudDetailSection
      icon={<ShieldCheck color="#059669" size={15} />}
      title="Publishing"
    >
      <CrudDetailField
        icon={<ShieldCheck color="#059669" size={15} />}
        label="Status"
        value={
          <CrudBadge
            align="start"
            tone={getSessionCourseStatusTone(item.status)}
          >
            {item.status}
          </CrudBadge>
        }
      />
      <CrudDetailField
        icon={<ShieldCheck color="#059669" size={15} />}
        label="Published"
        value={item.isPublished ? "Yes" : "No"}
      />
      <CrudDetailField
        icon={<ShieldCheck color="#059669" size={15} />}
        label="Active record"
        value={item.isActive ? "Yes" : "No"}
      />
    </CrudDetailSection>
    <CrudDetailSection
      icon={<FileText color="#059669" size={15} />}
      title="Description"
    >
      <CrudDetailField
        icon={<FileText color="#059669" size={15} />}
        label="Description"
        value={item.description}
      />
    </CrudDetailSection>
  </YStack>
);
