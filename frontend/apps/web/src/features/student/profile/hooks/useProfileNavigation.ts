import { useEffect, useState } from "react";

import { tabs } from "../constants";
import type { ProfileTab } from "../types";

export const useProfileNavigation = () => {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  useEffect(() => {
    const selectHashTab = () => {
      const requestedTab = window.location.hash.slice(1) as ProfileTab;
      if (tabs.some((tab) => tab.id === requestedTab))
        setActiveTab(requestedTab);
    };
    selectHashTab();
    window.addEventListener("hashchange", selectHashTab);
    return () => window.removeEventListener("hashchange", selectHashTab);
  }, []);

  return { activeTab, setActiveTab };
};
