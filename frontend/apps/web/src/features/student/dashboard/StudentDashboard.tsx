"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Play,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Card, Text, XStack, YStack } from "@repo/ui";
import { AppEmptyState } from "@repo/ui/primitives";

import {
  contentUpdateIconTones,
  notificationIconTones,
} from "./data";
import type {
  StudentContentUpdateData,
  StudentCourseCardData,
  StudentDashboardHeroData,
  StudentDashboardViewModel,
  StudentIconTone,
  StudentNotificationData,
} from "./types";

interface StudentDashboardProps {
  data: StudentDashboardViewModel;
}

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

function WelcomeCard({ hero }: { hero: StudentDashboardHeroData }) {
  return (
    <Card className="student-welcome-card">
      <YStack className="student-welcome-decor decor-one" />
      <YStack className="student-welcome-decor decor-two" />
      <YStack className="student-welcome-decor decor-three" />
      <YStack className="student-welcome-copy">
        <Text className="student-welcome-kicker">{hero.greeting}</Text>
        <Text className="student-welcome-title">
          {hero.studentName} <span aria-hidden="true">{"\u{1F44B}"}</span>
        </Text>
        <Text className="student-welcome-subtitle">{hero.subtitle}</Text>
        <XStack className="student-batch-badge">
          <UsersRound aria-hidden="true" color="#52627A" size={17} strokeWidth={2.1} />
          <Text className="student-batch-text">Batch: {hero.batchLabel}</Text>
        </XStack>
        <button
          aria-label="Continue learning"
          className="student-primary-action"
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

function CourseCard({ course }: { course: StudentCourseCardData }) {
  return (
    <Card className="student-course-card">
      <YStack className={`student-course-icon ${course.variant}`}>
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
        <Text className="student-course-progress-label">
          {course.completionPercentage}% completed
        </Text>
        <YStack
          aria-label={`${course.title} ${course.completionPercentage}% complete`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={course.completionPercentage}
          className="student-course-progress-track"
          role="progressbar"
        >
          <YStack
            className="student-course-progress-fill"
            style={{ width: `${course.completionPercentage}%` }}
          />
        </YStack>
      </YStack>
      <button
        aria-label={`Continue ${course.title}`}
        className="student-course-button"
        type="button"
      >
        <span className="student-course-button-text">Continue</span>
        <ChevronRight aria-hidden="true" color="#059669" size={18} strokeWidth={2.4} />
      </button>
    </Card>
  );
}

function MyCoursesSection({ courses }: { courses: StudentCourseCardData[] }) {
  return (
    <Card className="student-panel student-courses-panel">
      <SectionHeader
        actionHref="/student/my-courses"
        actionLabel="View all courses"
        title="My Courses"
      />
      {courses.length ? (
        <YStack className="student-courses-grid">
          {courses.map((course) => (
            <CourseCard course={course} key={course.id} />
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

function IconBadge({ tone }: { tone: StudentIconTone }) {
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

function NotificationItem({ item }: { item: StudentNotificationData }) {
  return (
    <XStack className="student-feed-item">
      <IconBadge tone={notificationIconTones[item.type]} />
      <YStack className="student-feed-copy">
        <Text className="student-feed-title">{item.title}</Text>
        <Text className="student-feed-description">{item.description}</Text>
      </YStack>
      <YStack className="student-feed-meta">
        <Text className="student-feed-time">{item.timestamp}</Text>
        {item.isUnread ? (
          <YStack aria-label="Unread notification" className="student-unread-dot" />
        ) : null}
      </YStack>
    </XStack>
  );
}

function ContentUpdateItem({ item }: { item: StudentContentUpdateData }) {
  return (
    <XStack className="student-feed-item student-update-item">
      <IconBadge tone={contentUpdateIconTones[item.type]} />
      <YStack className="student-feed-copy">
        <Text className="student-feed-title">{item.title}</Text>
        <Text className="student-feed-description">{item.description}</Text>
      </YStack>
      <Text className="student-feed-time">{item.timestamp}</Text>
    </XStack>
  );
}

function NotificationsSection({
  notifications,
}: {
  notifications: StudentNotificationData[];
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
            icon={<BellRingFallback />}
            title="No notifications"
          />
        )}
      </YStack>
    </Card>
  );
}

function BellRingFallback() {
  return <GraduationCap color="#059669" size={28} strokeWidth={2.2} />;
}

function ContentUpdatesSection({
  updates,
}: {
  updates: StudentContentUpdateData[];
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

export function StudentDashboard({ data }: StudentDashboardProps) {
  return (
    <YStack className="student-dashboard-page">
      <YStack className="student-dashboard-main-column">
        <WelcomeCard hero={data.hero} />
        <MyCoursesSection courses={data.courses} />
      </YStack>
      <YStack className="student-dashboard-side-column">
        <NotificationsSection notifications={data.notifications} />
        <ContentUpdatesSection updates={data.contentUpdates} />
      </YStack>
    </YStack>
  );
}
