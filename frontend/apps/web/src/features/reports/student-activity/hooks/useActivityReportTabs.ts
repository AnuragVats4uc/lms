import { useEffect, useState } from "react";

export type ActivityReportTab =
  "overview" | "timeline" | "resources" | "access";

const validTabs: ActivityReportTab[] = [
  "overview",
  "timeline",
  "resources",
  "access",
];

export const useActivityReportTabs = () => {
  const [activeTab, setActiveTab] = useState<ActivityReportTab>("overview");
  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.slice(1) as ActivityReportTab;
      if (validTabs.includes(hash)) setActiveTab(hash);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);
  const selectTab = (tab: ActivityReportTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  };
  return { activeTab, selectTab };
};
