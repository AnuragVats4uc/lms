import { createElement } from "react";
import { BookOpen, Building2, CalendarDays, Folder } from "lucide-react";
import type { TreeNodeItem } from "@repo/ui/dashboard";

const folder = createElement(Folder, { size: 14, strokeWidth: 2.2 });

export const dashboardTree: TreeNodeItem[] = [
  {
    expanded: true,
    icon: createElement(Building2, { size: 15, strokeWidth: 2.2 }),
    id: "org-acme",
    label: "Acme Corporation",
    children: [
      {
        expanded: true,
        icon: createElement(CalendarDays, { size: 15, strokeWidth: 2.2 }),
        id: "session-spring",
        label: "Spring 2025",
        children: [
          {
            expanded: true,
            icon: createElement(BookOpen, { size: 15, strokeWidth: 2.2 }),
            id: "course-data-structures",
            label: "Data Structures",
            selected: true,
            children: [
              { id: "getting-started", icon: folder, label: "Getting Started" },
              { id: "module-basics", icon: folder, label: "Module 1: Basics" },
              {
                id: "module-linear",
                icon: folder,
                label: "Module 2: Linear Structures",
              },
              {
                expanded: true,
                id: "module-trees",
                icon: folder,
                label: "Module 3: Trees",
                children: [
                  { id: "exams", icon: folder, label: "Exams" },
                  { id: "documents", icon: folder, label: "Documents" },
                  { id: "videos", icon: folder, label: "Videos" },
                ],
              },
              { id: "module-graphs", icon: folder, label: "Module 4: Graphs" },
              {
                id: "projects",
                icon: folder,
                label: "Project & Assignments",
              },
            ],
          },
        ],
      },
    ],
  },
];
