import { BookOpen, Building2, CalendarDays, FileText } from "lucide-react";
import type { StatCardProps } from "@repo/ui/dashboard";
import type { DashboardData } from "@repo/types";

export const buildDashboardStatistics = (
  data: DashboardData,
  navigate: (path: string) => void,
  isSuperAdmin: boolean,
): StatCardProps[] => {
  const statistics: StatCardProps[] = [];
  if (isSuperAdmin) {
    statistics.push({
      color: "green",
      icon: <Building2 aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "Manage Organizations",
      subtitle: `${data.statistics.organizations.active} active organizations`,
      title: "Organizations",
      value: data.statistics.organizations.total,
      onPress: () => navigate("/admin/organizations"),
    });
  }
  statistics.push(
    {
      color: "purple",
      icon: <CalendarDays aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "Manage Sessions",
      subtitle: `${data.statistics.sessions.active} active sessions`,
      title: "Sessions",
      value: data.statistics.sessions.total,
      onPress: () => navigate("/admin/sessions"),
    },
    {
      color: "blue",
      icon: <BookOpen aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "Manage Courses",
      subtitle: `${data.statistics.courses.active} active courses`,
      title: "Courses",
      value: data.statistics.courses.total,
      onPress: () => navigate("/admin/courses"),
    },
    {
      color: "green",
      icon: <FileText aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "Manage Resources",
      subtitle: `${data.statistics.resources.active} active resources`,
      title: "Total Resources",
      value: data.statistics.resources.total,
      onPress: () => navigate("/admin/resources"),
    },
  );
  return statistics;
};
