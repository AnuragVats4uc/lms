import { Clock3, FolderTree, ShieldCheck } from "lucide-react";
import type { Folder } from "@repo/types";

export const buildFolderStatistics = ({
  rows,
  total,
}: {
  rows: Folder[];
  total: number;
}) => [
  {
    icon: <FolderTree color="#059669" size={20} />,
    label: "Total Folders",
    value: total,
  },
  {
    icon: <ShieldCheck color="#059669" size={20} />,
    label: "Active Folders",
    value: rows.filter((row) => row.status === "ACTIVE").length,
  },
  {
    icon: <FolderTree color="#2563EB" size={20} />,
    label: "Nested Folders",
    value: rows.filter((row) => row.parentFolderId !== null).length,
  },
  {
    icon: <Clock3 color="#64748B" size={20} />,
    label: "Archived Folders",
    value: rows.filter((row) => row.status === "ARCHIVED").length,
  },
];
