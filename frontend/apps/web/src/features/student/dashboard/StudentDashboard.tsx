"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BellRing,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Megaphone,
  NotebookTabs,
  Play,
  RefreshCw,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { AppEmptyState, Button, Card, Spinner, Text, XStack, YStack } from "@repo/ui";
import { studentsApi } from "@repo/api";
import type {
  ResourceType,
  StudentDashboardContentUpdate,
  StudentDashboardCourse,
  StudentDashboardNotification,
  StudentDashboardNotificationType,
} from "@repo/types";

type StudentCourseVariant = "green" | "blue" | "purple" | "orange";
type StudentNotificationTone = {
  background: string;
  color: string;
  Icon: LucideIcon;
};

const courseVariants: StudentCourseVariant[] = ["green", "blue", "purple", "orange"];

const notificationIconTones: Record<
  StudentDashboardNotificationType,
  StudentNotificationTone
> = {
  ASSIGNMENT: {
    background: "#DDF7E9",
    color: "#0AA66A",
    Icon: ClipboardList,
  },
  ANNOUNCEMENT: {
    background: "#FFF3DA",
    color: "#F59E0B",
    Icon: Megaphone,
  },
  EVENT: {
    background: "#E4F1FF",
    color: "#1683FF",
    Icon: CalendarDays,
  },
  EXAM: {
    background: "#EFE7FF",
    color: "#7C3AED",
    Icon: FileText,
  },
  RESOURCE: {
    background: "#E8F8EF",
    color: "#10B981",
    Icon: BookOpen,
  },
  SYSTEM: {
    background: "#EEF2F7",
    color: "#52627A",
    Icon: BellRing,
  },
};

const contentUpdateIconTones: Record<ResourceType, StudentNotificationTone> = {
  DOCUMENT: {
    background: "#FFE8E8",
    color: "#EF4444",
    Icon: FileText,
  },
  NOTES: {
    background: "#EFE7FF",
    color: "#7C3AED",
    Icon: NotebookTabs,
  },
  VIDEO: {
    background: "#E8F8EF",
    color: "#10B981",
    Icon: Play,
  },
  EXAM: {
    background: "#E4F1FF",
    color: "#1683FF",
    Icon: CalendarDays,
  },
  ASSIGNMENT: {
    background: "#FFF0DC",
    color: "#F97316",
    Icon: BellRing,
  },
};

function SectionHeader({
  actionHref,
  actionLabel,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  title: string;
}) {
  return (
    <div className="student-dashboard-section-header">
      <h2 className="student-dashboard-section-title">{title}</h2>
      <Link className="student-dashboard-section-link" href={actionHref}>
        {actionLabel}
      </Link>
    </div>
  );
}

function HeroVisual() {
  return (
    <YStack aria-hidden className="student-hero-visual">
      <YStack className="student-hero-book-stack">
        <YStack className="student-hero-cap">
          <YStack className="student-hero-cap-top" />
          <YStack className="student-hero-cap-base" />
          <YStack className="student-hero-tassel" />
        </YStack>
        <YStack className="student-hero-book book-one" />
        <YStack className="student-hero-book book-two" />
        <YStack className="student-hero-book book-three" />
      </YStack>
      <YStack className="student-hero-plant">
        <YStack className="student-hero-leaf leaf-one" />
        <YStack className="student-hero-leaf leaf-two" />
        <YStack className="student-hero-leaf leaf-three" />
        <YStack className="student-hero-pot" />
      </YStack>
      <YStack className="student-hero-mug" />
      <YStack className="student-hero-pen" />
    </YStack>
  );
}

function WelcomeCard({
  batch,
  continuePath,
  studentName,
}: {
  batch: string;
  continuePath: string;
  studentName: string;
}) {
  const router = useRouter();

  return (
    <Card className="student-welcome-card">
      <YStack className="student-welcome-decor decor-one" />
      <YStack className="student-welcome-decor decor-two" />
      <YStack className="student-welcome-decor decor-three" />
      <YStack className="student-welcome-copy">
        <Text className="student-welcome-kicker">Welcome back,</Text>
        <Text className="student-welcome-title">
          {studentName} <span aria-hidden="true">{"\u{1F44B}"}</span>
        </Text>
        <Text className="student-welcome-subtitle">
          You&apos;re doing great! Keep learning and growing.
        </Text>
        <XStack className="student-batch-badge">
          <UsersRound aria-hidden="true" color="#52627A" size={17} strokeWidth={2.1} />
          <Text className="student-batch-text">Batch: {batch}</Text>
        </XStack>
        <button
          aria-label="Continue learning"
          className="student-primary-action"
          onClick={() => router.push(continuePath)}
          type="button"
        >
          <Play aria-hidden="true" fill="#FFFFFF" size={16} strokeWidth={0} />
          <span className="student-primary-action-text">Continue Learning</span>
        </button>
      </YStack>
      <HeroVisual />
    </Card>
  );
}

function CourseCard({
  course,
  variant,
}: {
  course: StudentDashboardCourse;
  variant: StudentCourseVariant;
}) {
  const router = useRouter();
  const completion = clampPercentage(course.completionPercentage);

  return (
    <Card className="student-course-card">
      <YStack className={`student-course-icon ${variant}`}>
        <Text className="student-course-code">{course.shortCode}</Text>
      </YStack>
      <YStack className="student-course-copy">
        <Text className="student-course-title">{course.title}</Text>
        <XStack className="student-course-instructor">
          <UserRound aria-hidden="true" color="#647084" size={14} strokeWidth={2} />
          <Text className="student-course-instructor-text">{course.instructor}</Text>
        </XStack>
      </YStack>
      <YStack className="student-course-progress-area">
        <Text className="student-course-progress-label">{completion}% completed</Text>
        <YStack
          aria-label={`${course.title} ${completion}% complete`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={completion}
          className="student-course-progress-track"
          role="progressbar"
        >
          <YStack
            className="student-course-progress-fill"
            style={{ width: `${completion}%` }}
          />
        </YStack>
      </YStack>
      <button
        aria-label={`Continue ${course.title}`}
        className="student-course-button"
        onClick={() => router.push(course.continuePath)}
        type="button"
      >
        <span className="student-course-button-text">Continue</span>
        <ChevronRight aria-hidden="true" color="#059669" size={18} strokeWidth={2.4} />
      </button>
    </Card>
  );
}

function MyCoursesSection({ courses }: { courses: StudentDashboardCourse[] }) {
  return (
    <Card className="student-panel student-courses-panel">
      <SectionHeader
        actionHref="/student/my-courses"
        actionLabel="View all courses"
        title="My Courses"
      />
      {courses.length ? (
        <YStack className="student-courses-grid">
          {courses.map((course, index) => (
            <CourseCard
              course={course}
              key={course.id}
              variant={courseVariants[index % courseVariants.length]}
            />
          ))}
        </YStack>
      ) : (
        <AppEmptyState
          description="Your enrolled courses will appear here."
          icon={<BookOpen color="#059669" size={28} strokeWidth={2.2} />}
          title="No courses yet"
        />
      )}
    </Card>
  );
}

function IconBadge({ tone }: { tone: StudentNotificationTone }) {
  const Icon = tone.Icon;

  return (
    <YStack
      className="student-feed-icon"
      style={{ backgroundColor: tone.background }}
    >
      <Icon aria-hidden="true" color={tone.color} size={22} strokeWidth={2.2} />
    </YStack>
  );
}

function NotificationItem({ item }: { item: StudentDashboardNotification }) {
  return (
    <XStack className="student-feed-item">
      <IconBadge tone={notificationIconTones[item.type]} />
      <YStack className="student-feed-copy">
        <Text className="student-feed-title">{item.title}</Text>
        <Text className="student-feed-description">{item.description}</Text>
      </YStack>
      <YStack className="student-feed-meta">
        <Text className="student-feed-time">
          {formatRelativeTimestamp(item.timestamp)}
        </Text>
        {!item.isRead ? (
          <YStack aria-label="Unread notification" className="student-unread-dot" />
        ) : null}
      </YStack>
    </XStack>
  );
}

function ContentUpdateItem({ item }: { item: StudentDashboardContentUpdate }) {
  const router = useRouter();

  return (
    <XStack
      className="student-feed-item student-update-item"
      onPress={() => router.push(item.path)}
      role="button"
    >
      <IconBadge tone={contentUpdateIconTones[item.resourceType]} />
      <YStack className="student-feed-copy">
        <Text className="student-feed-title">{item.title}</Text>
        <Text className="student-feed-description">{item.description}</Text>
      </YStack>
      <Text className="student-feed-time">
        {formatRelativeTimestamp(item.timestamp)}
      </Text>
    </XStack>
  );
}

function NotificationsSection({
  notifications,
}: {
  notifications: StudentDashboardNotification[];
}) {
  return (
    <Card className="student-panel student-side-panel">
      <SectionHeader
        actionHref="/student/notifications"
        actionLabel="View all"
        title="Notifications"
      />
      <YStack className="student-feed-list">
        {notifications.length ? (
          notifications.map((item) => (
            <NotificationItem item={item} key={item.id} />
          ))
        ) : (
          <AppEmptyState
            description="You are all caught up."
            icon={<GraduationCap color="#059669" size={28} strokeWidth={2.2} />}
            title="No notifications"
          />
        )}
      </YStack>
    </Card>
  );
}

function ContentUpdatesSection({
  updates,
}: {
  updates: StudentDashboardContentUpdate[];
}) {
  return (
    <Card className="student-panel student-side-panel">
      <SectionHeader
        actionHref="/student/resources"
        actionLabel="View all"
        title="Content Updates"
      />
      <YStack className="student-feed-list">
        {updates.length ? (
          updates.map((item) => (
            <ContentUpdateItem item={item} key={item.id} />
          ))
        ) : (
          <AppEmptyState
            description="New resources and assignments will appear here."
            icon={<BookOpen color="#059669" size={28} strokeWidth={2.2} />}
            title="No updates"
          />
        )}
      </YStack>
    </Card>
  );
}

export function StudentDashboard() {
  const dashboardQuery = useQuery({
    queryFn: studentsApi.findMyDashboard,
    queryKey: ["student-dashboard"],
    staleTime: 60_000,
  });

  if (dashboardQuery.isLoading) {
    return (
      <YStack className="student-dashboard-state">
        <Spinner color="#059669" size="large" />
        <Text color="#52627A" fontSize={14}>
          Loading student dashboard...
        </Text>
      </YStack>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <YStack className="student-dashboard-state">
        <AlertCircle color="#B91C1C" size={30} strokeWidth={2.2} />
        <Text color="#172033" fontSize={18} fontWeight="700">
          Unable to load dashboard
        </Text>
        <Text color="#647084" fontSize={14}>
          Please try refreshing the student dashboard.
        </Text>
        <Button
          background="#059669"
          onPress={() => void dashboardQuery.refetch()}
          rounded="$3"
        >
          <RefreshCw aria-hidden="true" color="#FFFFFF" size={16} />
          <Button.Text color="#FFFFFF" fontWeight="700">
            Retry
          </Button.Text>
        </Button>
      </YStack>
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <YStack className="student-dashboard-page">
      <YStack className="student-dashboard-main-column">
        <WelcomeCard
          batch={dashboard.student.batch ?? "Not assigned"}
          continuePath={dashboard.continueLearning.path}
          studentName={dashboard.student.name}
        />
        <MyCoursesSection courses={dashboard.courses} />
      </YStack>
      <YStack className="student-dashboard-side-column">
        <NotificationsSection notifications={dashboard.notifications} />
        <ContentUpdatesSection updates={dashboard.contentUpdates} />
      </YStack>
    </YStack>
  );
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatRelativeTimestamp(value: string) {
  const date = new Date(value);
  const delta = Date.now() - date.getTime();

  if (!Number.isFinite(delta)) return "";

  const minutes = Math.max(0, Math.floor(delta / 60_000));
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
