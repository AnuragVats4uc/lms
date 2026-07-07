import { useAuthStore } from "./auth.store";

export const useStudent = () =>
    useAuthStore((state) => state.student);

export const useAccessToken = () =>
    useAuthStore((state) => state.accessToken);

export const useRefreshToken = () =>
    useAuthStore((state) => state.refreshToken);

export const useIsAuthenticated = () =>
    useAuthStore((state) => state.isAuthenticated);