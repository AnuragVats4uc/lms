import { AxiosInstance } from "axios";

import {
  getAuthManager,
  hasAuthManager,
} from "./auth-manager";

export function setupRequestInterceptor(
  api: AxiosInstance
) {
  api.interceptors.request.use(
    async (config) => {
      if (!hasAuthManager()) {
        return config;
      }

      const accessToken =
         await getAuthManager().getAccessToken();

      if (accessToken) {
        config.headers.Authorization =
          `Bearer ${accessToken}`;
      }

      return config;
    },

    (error) => Promise.reject(error)
  );
}
