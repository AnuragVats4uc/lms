import { useMemo } from "react";
import type { DashboardData } from "@repo/types";

import { buildDashboardUpload } from "../utils/builders/buildDashboardUpload";

export const useDashboardUpload = (
  data: DashboardData | undefined,
  navigate: (path: string) => void,
) =>
  useMemo(
    () => (data ? buildDashboardUpload(data, navigate) : null),
    [data, navigate],
  );
