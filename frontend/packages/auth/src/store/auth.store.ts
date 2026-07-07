import { create } from "zustand";
import { Student } from "../types/auth.types";

interface AuthState {
  student: Student | null;

  accessToken: string | null;

  refreshToken: string | null;

  isAuthenticated: boolean;

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

  isAuthenticated: false,

  login: (student, accessToken, refreshToken) =>
    set({
      student,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      student: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    }),

  updateStudent: (student) =>
    set({
      student,
    }),
}));