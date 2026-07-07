import {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import { getAuthManager } from "./auth-manager";
import { refreshQueue } from "./refresh.queue";

const PUBLIC_AUTH_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
] as const;

export function setupResponseInterceptor(
  api: AxiosInstance
) {
  api.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
      const originalRequest =
        error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

      if (!originalRequest) {
        return Promise.reject(error);
      }

      const requestUrl = originalRequest.url ?? "";

      if (
        PUBLIC_AUTH_PATHS.some((path) =>
          requestUrl.includes(path)
        )
      ) {
        return Promise.reject(error);
      }

      // Ignore non-401 errors
      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }

      // Prevent infinite retry loop
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const auth = getAuthManager();

      /**
       * If another refresh request is already running,
       * wait until it finishes and then retry.
       */
      if (refreshQueue.isRefreshing()) {
        return new Promise((resolve, reject) => {
          refreshQueue.push(
            (newAccessToken) => {
              originalRequest.headers.set(
                "Authorization",
                `Bearer ${newAccessToken}`
              );

              resolve(api(originalRequest));
            },
            reject
          );
        });
      }

      refreshQueue.start();

      try {
        const refreshToken =
          await auth.getRefreshToken();

        if (!refreshToken) {
          throw new Error("Refresh token not found.");
        }

        const tokens =
          await auth.refreshToken(refreshToken);

        await auth.saveTokens(
          tokens.accessToken,
          tokens.refreshToken
        );

        // Retry all queued requests
        refreshQueue.resolve(tokens.accessToken);

        // Retry current request
        originalRequest.headers.set(
          "Authorization",
          `Bearer ${tokens.accessToken}`
        );

        return api(originalRequest);
      } catch (err) {
        refreshQueue.reject(err);

        await auth.logout();

        return Promise.reject(err);
      } finally {
        refreshQueue.stop();
      }
    }
  );
}
