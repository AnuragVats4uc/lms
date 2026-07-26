import { create } from "zustand";
import {
  AuthUser,
  AuthStatus,
} from "../types/auth.types";

export interface AuthState {
  currentUser: AuthUser | null;

  accessToken: string | null;

  refreshToken: string | null;

  status: AuthStatus;

  isAuthenticated: boolean;

  isInitializing: boolean;

  permissions: string[];

  role: string | null;

  setInitializing: () => void;

  setUnauthenticated: () => void;

  login: (
    user: AuthUser,
    accessToken: string,
    refreshToken: string
  ) => void;

  logout: () => void;

  updateUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,

  accessToken: null,

  refreshToken: null,

  status: "idle",

  isAuthenticated: false,

  isInitializing: false,

  permissions: [],

  role: null,

  setInitializing: () =>
    set({
      status: "initializing",
      isInitializing: true,
    }),

  setUnauthenticated: () =>
    set({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      status: "unauthenticated",
      isAuthenticated: false,
      isInitializing: false,
      permissions: [],
      role: null,
    }),

  login: (user, accessToken, refreshToken) =>
    set({
      currentUser: user,
      accessToken,
      refreshToken,
      status: "authenticated",
      isAuthenticated: true,
      isInitializing: false,
      permissions: user.permissions ?? [],
      role: user.role ?? user.roles?.[0] ?? null,
    }),

  logout: () =>
    set({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      status: "unauthenticated",
      isAuthenticated: false,
      isInitializing: false,
      permissions: [],
      role: null,
    }),

  updateUser: (user) =>
    set({
      currentUser: user,
      permissions: user.permissions ?? [],
      role: user.role ?? user.roles?.[0] ?? null,
    }),
}));
