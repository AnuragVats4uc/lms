import { create } from "zustand";
import {
  AuthStatus,
  Student,
} from "../types/auth.types";

export interface AuthState {
  student: Student | null;

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
    student: Student,
    accessToken: string,
    refreshToken: string
  ) => void;

  logout: () => void;

  updateStudent: (student: Student) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  student: null,

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
      student: null,
      accessToken: null,
      refreshToken: null,
      status: "unauthenticated",
      isAuthenticated: false,
      isInitializing: false,
      permissions: [],
      role: null,
    }),

  login: (student, accessToken, refreshToken) =>
    set({
      student,
      accessToken,
      refreshToken,
      status: "authenticated",
      isAuthenticated: true,
      isInitializing: false,
      permissions: student.role ? [student.role] : [],
      role: student.role,
    }),

  logout: () =>
    set({
      student: null,
      accessToken: null,
      refreshToken: null,
      status: "unauthenticated",
      isAuthenticated: false,
      isInitializing: false,
      permissions: [],
      role: null,
    }),

  updateStudent: (student) =>
    set({
      student,
      permissions: student.role ? [student.role] : [],
      role: student.role,
    }),
}));
