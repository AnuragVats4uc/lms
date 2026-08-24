"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Folder,
  GraduationCap,
  RefreshCw,
  UserRound,
  UsersRound,
  Video,
  Zap,
} from "lucide-react";
import { teacherApi } from "@repo/api";
import type {
  TeacherDashboardCourse,
  TeacherDashboardRecentResource,
  TeacherDashboardRecentStudent,
} from "@repo/types";
import { AppCard, Button, Spinner, Text, XStack, YStack } from "@repo/ui";
import { DashboardStats, PageContainer } from "@repo/ui/dashboard";
import type { QuickActionsProps, StatCardProps } from "@repo/ui/dashboard";

export function TeacherDashboardPage() {
  const router = useRouter();
  const dashboardQuery = useQuery({
    queryFn: teacherApi.findDashboard,
    queryKey: ["teacher-dashboard"],
    staleTime: 60_000,
  });

  if (dashboardQuery.isLoading) {
    return (
      <PageContainer>
        <YStack
          gap="$3"
          py="$8"
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <Spinner color="#059669" size="large" />
          <Text color="#52627A" fontSize={14}>
            Loading teacher dashboard...
          </Text>
        </YStack>
      </PageContainer>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <PageContainer>
        <YStack gap="$3" py="$8" style={{ alignItems: "center" }}>
          <AlertCircle color="#B91C1C" size={30} strokeWidth={2.2} />
          <Text color="#0F1D3A" fontSize={20} fontWeight="$heading">
            Unable to load dashboard
          </Text>
          <Text color="#52627A" fontSize={14}>
            Please try refreshing the teacher dashboard.
          </Text>
          <Button
            background="#059669"
            onPress={() => void dashboardQuery.refetch()}
            rounded="$3"
          >
            <RefreshCw aria-hidden="true" color="#FFFFFF" size={16} />
            <Button.Text color="#FFFFFF" fontSize={13} fontWeight="$button">
              Retry
            </Button.Text>
          </Button>
        </YStack>
      </PageContainer>
    );
  }

  const dashboard = dashboardQuery.data;
  const stats: StatCardProps[] = [
    {
      color: "green",
      icon: <BookOpen aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "View courses",
      onPress: () => router.push("/teacher/courses"),
      subtitle: `${dashboard.statistics.activeCourses} active assignments`,
      title: "Assigned Courses",
      value: dashboard.statistics.assignedCourses,
    },
    {
      color: "blue",
      icon: <UsersRound aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "View students",
      onPress: () => router.push("/teacher/students"),
      subtitle: `${dashboard.statistics.courseEnrollments} course enrollments`,
      title: "Students",
      value: dashboard.statistics.enrolledStudents,
    },
    {
      color: "purple",
      icon: <FileText aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "View resources",
      onPress: () => router.push("/teacher/resources"),
      subtitle: `${dashboard.statistics.publishedResources} published`,
      title: "Resources",
      value: dashboard.statistics.resources,
    },
  ];
  const quickActions: QuickActionsProps = {
    icon: <Zap aria-hidden="true" size={18} strokeWidth={2.2} />,
    title: "Teacher Workspace",
    actions: [
      {
        icon: <BookOpen size={22} strokeWidth={2.2} />,
        label: "My Courses",
        onPress: () => router.push("/teacher/courses"),
      },
      {
        icon: <FileText size={22} strokeWidth={2.2} />,
        label: "Resources",
        onPress: () => router.push("/teacher/resources"),
      },
      {
        icon: <UsersRound size={22} strokeWidth={2.2} />,
        label: "Students",
        onPress: () => router.push("/teacher/students"),
      },
    ],
  };

  return (
    <PageContainer>
      <YStack gap="$5">
        <YStack gap="$2">
          <Text color="#0F1D3A" fontSize={30} fontWeight="$heading">
            Teacher Dashboard
          </Text>
          <Text color="#52627A" fontSize="$label" lineHeight="$label">
            Your assigned courses, enrolled students, and learning resources.
          </Text>
        </YStack>

        <DashboardStats quickActions={quickActions} stats={stats} />

        <div
          style={{
            alignItems: "start",
            display: "grid",
            gap: 16,
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.8fr)",
          }}
        >
          <AssignedCourses courses={dashboard.courses} />
          <YStack gap="$4">
            <RecentResources resources={dashboard.recentResources} />
            <RecentStudents students={dashboard.recentStudents} />
          </YStack>
        </div>
      </YStack>
    </PageContainer>
  );
}

function AssignedCourses({ courses }: { courses: TeacherDashboardCourse[] }) {
  return (
    <AppCard background="#FFFFFF" borderColor="#E1E7F0" rounded="$3">
      <YStack gap="$4">
        <SectionHeader
          icon={<BookOpen aria-hidden="true" size={18} strokeWidth={2.2} />}
          subtitle="Course data is limited to your assigned session courses."
          title="Assigned Courses"
        />
        {courses.length ? (
          <YStack gap="$3">
            {courses.map((course) => (
              <CourseRow course={course} key={course.sessionCourseId} />
            ))}
          </YStack>
        ) : (
          <EmptyText text="No courses are assigned to this teacher account." />
        )}
      </YStack>
    </AppCard>
  );
}

function CourseRow({ course }: { course: TeacherDashboardCourse }) {
  return (
    <YStack
      gap="$3"
      style={{
        border: "1px solid #DFE6EE",
        borderRadius: 8,
        padding: 14,
      }}
    >
      <XStack
        gap="$3"
        style={{
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <YStack gap="$1" style={{ minWidth: 0 }}>
          <XStack gap="$2" style={{ alignItems: "center", minWidth: 0 }}>
            <IconBubble tone="green">
              <BookOpen aria-hidden="true" size={16} strokeWidth={2.2} />
            </IconBubble>
            <YStack gap={2} style={{ minWidth: 0 }}>
              <Text color="#0F1D3A" fontSize={16} fontWeight="$heading">
                {course.title}
              </Text>
              <Text color="#52627A" fontSize={13}>
                {course.session.name}
              </Text>
            </YStack>
          </XStack>
        </YStack>
        <Badge tone={course.isPublished ? "green" : "gray"}>
          {course.isPublished ? "Published" : "Draft"}
        </Badge>
      </XStack>

      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        }}
      >
        <MiniMetric
          icon={<UsersRound aria-hidden="true" size={15} strokeWidth={2.2} />}
          label="Students"
          value={course.enrolledStudents}
        />
        <MiniMetric
          icon={<Folder aria-hidden="true" size={15} strokeWidth={2.2} />}
          label="Folders"
          value={course.folders}
        />
        <MiniMetric
          icon={<FileText aria-hidden="true" size={15} strokeWidth={2.2} />}
          label="Resources"
          value={course.resources}
        />
      </div>

      <XStack gap="$2" style={{ flexWrap: "wrap" }}>
        {Object.entries(course.resourceTypes).map(([label, value]) => (
          <Badge key={label} tone="blue">
            {label}: {value}
          </Badge>
        ))}
      </XStack>
    </YStack>
  );
}

function RecentResources({
  resources,
}: {
  resources: TeacherDashboardRecentResource[];
}) {
  return (
    <AppCard background="#FFFFFF" borderColor="#E1E7F0" rounded="$3">
      <YStack gap="$4">
        <SectionHeader
          icon={<FileText aria-hidden="true" size={18} strokeWidth={2.2} />}
          title="Recent Resources"
        />
        {resources.length ? (
          <YStack gap="$2">
            {resources.map((resource) => (
              <RecentResourceRow key={resource.id} resource={resource} />
            ))}
          </YStack>
        ) : (
          <EmptyText text="No resources available for assigned courses." />
        )}
      </YStack>
    </AppCard>
  );
}

function RecentStudents({
  students,
}: {
  students: TeacherDashboardRecentStudent[];
}) {
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
}

function SectionHeader({
  icon,
  subtitle,
  title,
}: {
  icon?: React.ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <YStack gap="$2">
      <XStack gap="$2" style={{ alignItems: "center" }}>
        {icon ? <IconBubble tone="green">{icon}</IconBubble> : null}
        <Text color="#0F1D3A" fontSize={18} fontWeight="$heading">
          {title}
        </Text>
      </XStack>
      {subtitle ? (
        <Text color="#52627A" fontSize={13}>
          {subtitle}
        </Text>
      ) : null}
    </YStack>
  );
}

function RecentResourceRow({
  resource,
}: {
  resource: TeacherDashboardRecentResource;
}) {
  return (
    <XStack
      gap="$3"
      p="$3"
      rounded="$3"
      style={{
        alignItems: "center",
        backgroundColor: "#FCFDFD",
        borderColor: "#E7EEF5",
        borderWidth: 1,
      }}
    >
      <IconBubble tone={resource.resourceType.code === "VIDEO" ? "blue" : "green"}>
        {resource.resourceType.code === "VIDEO" ? (
          <Video aria-hidden="true" size={16} strokeWidth={2.2} />
        ) : (
          <FileText aria-hidden="true" size={16} strokeWidth={2.2} />
        )}
      </IconBubble>
      <YStack gap={3} style={{ flex: 1, minWidth: 0 }}>
        <Text color="#0F1D3A" fontSize={14} fontWeight="$heading">
          {resource.title}
        </Text>
        <Text color="#52627A" fontSize={12}>
          {resource.sessionCourse.title} / {resource.folder.name}
        </Text>
      </YStack>
      <Badge tone={resource.isPublished ? "green" : "gray"}>
        {resource.resourceType.code}
      </Badge>
    </XStack>
  );
}

function RecentStudentRow({
  student,
}: {
  student: TeacherDashboardRecentStudent;
}) {
  return (
    <XStack
      gap="$3"
      p="$3"
      rounded="$3"
      style={{
        alignItems: "center",
        backgroundColor: "#FCFDFD",
        borderColor: "#E7EEF5",
        borderWidth: 1,
      }}
    >
      <IconBubble tone="blue">
        <UserRound aria-hidden="true" size={16} strokeWidth={2.2} />
      </IconBubble>
      <YStack gap={3} style={{ flex: 1, minWidth: 0 }}>
        <Text color="#0F1D3A" fontSize={14} fontWeight="$heading">
          {student.name}
        </Text>
        <Text color="#52627A" fontSize={12}>
          {student.studentCode} / {student.sessionCourse.title}
        </Text>
      </YStack>
    </XStack>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <XStack
      gap="$2"
      p="$2"
      rounded="$3"
      style={{
        alignItems: "center",
        backgroundColor: "#F8FBFD",
        borderColor: "#E7EEF5",
        borderWidth: 1,
      }}
    >
      <IconBubble tone="gray">{icon}</IconBubble>
      <YStack gap={1}>
        <Text color="#52627A" fontSize={12} fontWeight="$button">
          {label}
        </Text>
        <Text color="#0F1D3A" fontSize={17} fontWeight="$heading">
          {value}
        </Text>
      </YStack>
    </XStack>
  );
}

function IconBubble({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "gray" | "green";
}) {
  const styles = {
    blue: { background: "#EFF6FF", color: "#2563EB" },
    gray: { background: "#F1F5F9", color: "#52627A" },
    green: { background: "#DDF4E7", color: "#047857" },
  }[tone];

  return (
    <XStack
      rounded="$3"
      style={{
        alignItems: "center",
        backgroundColor: styles.background,
        color: styles.color,
        flexShrink: 0,
        height: 34,
        justifyContent: "center",
        width: 34,
      }}
    >
      {children}
    </XStack>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "gray" | "green";
}) {
  const styles = {
    blue: { background: "#EFF6FF", color: "#1D4ED8" },
    gray: { background: "#F1F5F9", color: "#52627A" },
    green: { background: "#DDF4E7", color: "#047857" },
  }[tone];

  return (
    <XStack
      px="$3"
      py="$1"
      rounded="$6"
      style={{
        alignItems: "center",
        backgroundColor: styles.background,
        flexShrink: 0,
      }}
    >
      <Text color={styles.color as never} fontSize={11} fontWeight="$button">
        {children}
      </Text>
    </XStack>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <Text color="#52627A" fontSize={13}>
      {text}
    </Text>
  );
}
