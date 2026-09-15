import {
  BookOpen,
  CalendarDays,
  Clock3,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Percent,
  ShieldCheck,
} from "lucide-react";
import type { Course } from "@repo/types";
import { YStack } from "@repo/ui";
import {
  CrudBadge,
  CrudDetailField,
  CrudDetailSection,
} from "../../../components/crud";
import { formatCourseAmount } from "../../utils/courseFormatting";
import { getCourseStatusTone } from "../../utils/coursePresentation";

export const CourseDetails = ({ course }: { course: Course }) => (
  <YStack gap="$3">
    <CrudDetailSection
      icon={<BookOpen color="#059669" size={15} />}
      title="Course"
    >
      <CrudDetailField
        icon={<BookOpen color="#059669" size={15} />}
        label="Code"
        value={course.code}
      />
      <CrudDetailField
        icon={<ShieldCheck color="#059669" size={15} />}
        label="Status"
        value={
          <CrudBadge align="start" tone={getCourseStatusTone(course.status)}>
            {course.status}
          </CrudBadge>
        }
      />
      <CrudDetailField
        icon={<Clock3 color="#059669" size={15} />}
        label="Duration"
        value={
          course.durationInDays ? `${course.durationInDays} days` : "Not set"
        }
      />
      <CrudDetailField
        icon={<DollarSign color="#059669" size={15} />}
        label="Price"
        value={formatCourseAmount(course.price)}
      />
      <CrudDetailField
        icon={<Percent color="#059669" size={15} />}
        label="Discount"
        value={formatCourseAmount(course.discount)}
      />
      <CrudDetailField
        icon={<FileText color="#059669" size={15} />}
        label="Description"
        value={course.description}
      />
    </CrudDetailSection>
    <CrudDetailSection
      icon={<ImageIcon color="#059669" size={15} />}
      title="Availability"
    >
      <CrudDetailField
        icon={<ImageIcon color="#059669" size={15} />}
        label="Thumbnail"
        value={course.thumbnail ?? "Not provided"}
      />
      <CrudDetailField
        icon={<ShieldCheck color="#059669" size={15} />}
        label="Active record"
        value={course.isActive ? "Yes" : "No"}
      />
    </CrudDetailSection>
    <CrudDetailSection
      icon={<CalendarDays color="#059669" size={15} />}
      title="Record history"
    >
      <CrudDetailField
        icon={<CalendarDays color="#059669" size={15} />}
        label="Created"
        value={new Date(course.createdAt).toLocaleString()}
      />
      <CrudDetailField
        icon={<Clock3 color="#059669" size={15} />}
        label="Last updated"
        value={new Date(course.updatedAt).toLocaleString()}
      />
    </CrudDetailSection>
  </YStack>
);
