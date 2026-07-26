import { createElement } from "react";
import { Ellipsis, Folder, Settings } from "lucide-react";
import type { FolderCardProps } from "@repo/ui/dashboard";

const folderIcon = createElement(Folder, {
  "aria-hidden": true,
  size: 34,
  strokeWidth: 2.2,
});

export const dashboardFolders: FolderCardProps[] = [
  {
    actions: [
      { icon: createElement(Folder, { size: 15 }), label: "Open" },
      { icon: createElement(Settings, { size: 15 }), label: "Manage" },
      { icon: createElement(Ellipsis, { size: 15 }), label: "More" },
    ],
    badge: "12 Items",
    description:
      "All assessments, quizzes and examination papers.",
    folderCount: 5,
    icon: folderIcon,
    resourceCount: 12,
    title: "Exams",
    updatedAt: "2 days ago",
  },
  {
    actions: [
      { icon: createElement(Folder, { size: 15 }), label: "Open" },
      { icon: createElement(Settings, { size: 15 }), label: "Manage" },
      { icon: createElement(Ellipsis, { size: 15 }), label: "More" },
    ],
    badge: "28 Items",
    description: "Study materials, guides, notes and references.",
    folderCount: 8,
    icon: folderIcon,
    resourceCount: 28,
    title: "Documents",
    updatedAt: "Yesterday",
  },
  {
    actions: [
      { icon: createElement(Folder, { size: 15 }), label: "Open" },
      { icon: createElement(Settings, { size: 15 }), label: "Manage" },
      { icon: createElement(Ellipsis, { size: 15 }), label: "More" },
    ],
    badge: "16 Items",
    description: "Video lectures, tutorials and recorded sessions.",
    folderCount: 6,
    icon: folderIcon,
    resourceCount: 16,
    title: "Videos",
    updatedAt: "3 days ago",
  },
];
