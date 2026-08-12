import {
  BellRing,
  CalendarDays,
  ClipboardList,
  FileText,
  Megaphone,
  NotebookTabs,
  Play,
} from "lucide-react";

import type {
  StudentContentUpdateData,
  StudentContentUpdateType,
  StudentCourseCardData,
  StudentIconTone,
  StudentNotificationData,
  StudentNotificationType,
} from "./types";

export const STUDENT_BATCH_LABEL = "IPMAT Foundation 2027";

export const studentCourses: StudentCourseCardData[] = [
  {
    id: "quantitative-aptitude",
    title: "Quantitative Aptitude",
    shortCode: "QA",
    instructor: "Ritika Mehra",
    completionPercentage: 68,
    variant: "green",
  },
  {
    id: "verbal-ability",
    title: "Verbal Ability",
    shortCode: "VA",
    instructor: "Nidhi Arora",
    completionPercentage: 56,
    variant: "blue",
  },
  {
    id: "logical-reasoning",
    title: "Logical Reasoning",
    shortCode: "LR",
    instructor: "Aman Verma",
    completionPercentage: 42,
    variant: "purple",
  },
  {
    id: "mock-tests",
    title: "Mock Tests",
    shortCode: "MT",
    instructor: "Test Series",
    completionPercentage: 75,
    variant: "orange",
  },
];

export const studentNotifications: StudentNotificationData[] = [
  {
    id: "assignment-reminder",
    type: "assignment",
    title: "Assignment Reminder",
    description: "Logical Reasoning Set 04 is due tomorrow.",
    timestamp: "2h ago",
    isUnread: true,
  },
  {
    id: "mock-announcement",
    type: "announcement",
    title: "Important Announcement",
    description: "IPMAT Mock Test on Sunday at 11:00 AM.",
    timestamp: "5h ago",
    isUnread: true,
  },
  {
    id: "live-class",
    type: "event",
    title: "Upcoming Event",
    description: "Verbal Ability Live Class at 4:30 PM today.",
    timestamp: "1d ago",
    isUnread: true,
  },
];

export const studentContentUpdates: StudentContentUpdateData[] = [
  {
    id: "pdf-permutation",
    type: "pdf",
    title: "New PDF Added",
    description: "Permutation & Combination Notes",
    timestamp: "Today",
  },
  {
    id: "video-equations",
    type: "video",
    title: "New Video Added",
    description: "Linear Equations - Part 2",
    timestamp: "Yesterday",
  },
  {
    id: "notes-reading",
    type: "notes",
    title: "New Notes Added",
    description: "Reading Comprehension Strategies",
    timestamp: "2 days ago",
  },
  {
    id: "assignment-practice",
    type: "assignment",
    title: "New Assignment",
    description: "Logical Reasoning Practice Set 05",
    timestamp: "3 days ago",
  },
];

export const notificationIconTones: Record<StudentNotificationType, StudentIconTone> = {
  assignment: {
    background: "#DDF7E9",
    color: "#0AA66A",
    Icon: ClipboardList,
  },
  announcement: {
    background: "#FFF3DA",
    color: "#F59E0B",
    Icon: Megaphone,
  },
  event: {
    background: "#E4F1FF",
    color: "#1683FF",
    Icon: CalendarDays,
  },
};

export const contentUpdateIconTones: Record<StudentContentUpdateType, StudentIconTone> = {
  pdf: {
    background: "#FFE8E8",
    color: "#EF4444",
    Icon: FileText,
  },
  video: {
    background: "#E8F8EF",
    color: "#10B981",
    Icon: Play,
  },
  notes: {
    background: "#EFE7FF",
    color: "#7C3AED",
    Icon: NotebookTabs,
  },
  assignment: {
    background: "#FFF0DC",
    color: "#F97316",
    Icon: BellRing,
  },
};
