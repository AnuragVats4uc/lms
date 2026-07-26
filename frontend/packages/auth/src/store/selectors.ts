import { useAuthStore } from "./auth.store";

export const useCurrentUser = () =>
    useAuthStore((state) => state.currentUser);

export const useAccessToken = () =>
    useAuthStore((state) => state.accessToken);

export const useRefreshToken = () =>
    useAuthStore((state) => state.refreshToken);

export const useIsAuthenticated = () =>
    useAuthStore((state) => state.isAuthenticated);

export const useAuthStatus = () =>
    useAuthStore((state) => state.status);

export const useIsAuthInitializing = () =>
    useAuthStore((state) => state.isInitializing);

export const useUserRole = () =>
    useAuthStore((state) => state.role);

export const useUserPermissions = () =>
    useAuthStore((state) => state.permissions);
