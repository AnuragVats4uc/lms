import { authApi } from "../api/auth.api";
import { LoginDto } from "../types/auth.types";

export async function login(data: LoginDto) {
  return authApi.login(data);
}

export async function getMe() {
  return authApi.me();
}

export async function refreshToken(refreshToken: string) {
  return authApi.refresh(refreshToken);
}

export async function logout() {
  return;
}