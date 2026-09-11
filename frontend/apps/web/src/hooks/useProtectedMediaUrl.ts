"use client";

import { useEffect, useState } from "react";

import { studentDashboardBannersApi } from "@repo/api";

export function useProtectedMediaUrl(source: string | null | undefined) {
  const [resolved, setResolved] = useState(source ?? "");

  useEffect(() => {
    if (!source || !source.includes("/student-dashboard-banners/media/")) {
      setResolved(source ?? "");
      return;
    }
    let active = true;
    let objectUrl = "";
    void studentDashboardBannersApi
      .loadMedia(source)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setResolved(objectUrl);
      })
      .catch(() => active && setResolved(""));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  return resolved;
}
