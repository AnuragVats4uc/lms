import { AxiosInstance } from "axios";

import { getAuthManager } from "./auth-manager";

export function setupRequestInterceptor(
  api: AxiosInstance
) {
  api.interceptors.request.use(
    async (config) => {
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