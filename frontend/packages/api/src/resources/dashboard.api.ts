import type { ApiResponse, DashboardData, DashboardQuery } from '@repo/types';

import { api } from '../client/axios';
import { unwrapApiData } from '../client/response';

const DASHBOARD_ENDPOINT = '/dashboard';

export const dashboardApi = {
  findSummary(query?: DashboardQuery) {
    return api
      .get<ApiResponse<DashboardData>>(DASHBOARD_ENDPOINT, { params: query })
      .then(unwrapApiData);
  },
};
