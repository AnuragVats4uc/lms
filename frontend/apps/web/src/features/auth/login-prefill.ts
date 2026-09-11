const LOGIN_PREFILL_STORAGE_KEY = "lms.registrationLoginPrefill";
const LOGIN_PREFILL_MAX_AGE_MS = 5 * 60 * 1000;

type LoginPrefill = {
  email?: string;
  password?: string;
  timestamp?: number;
};

export const storeLoginPrefill = (email: string, password: string) => {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    LOGIN_PREFILL_STORAGE_KEY,
    JSON.stringify({
      email,
      password,
      timestamp: Date.now(),
    }),
  );
};

export const consumeLoginPrefill = (queryEmail: string) => {
  if (!queryEmail || typeof window === "undefined") return "";

  const raw = window.sessionStorage.getItem(LOGIN_PREFILL_STORAGE_KEY);
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as LoginPrefill;
    const isFresh =
      typeof parsed.timestamp === "number" &&
      Date.now() - parsed.timestamp < LOGIN_PREFILL_MAX_AGE_MS;

    return isFresh &&
      parsed.email?.trim().toLowerCase() === queryEmail &&
      parsed.password
      ? parsed.password
      : "";
  } catch {
    return "";
  } finally {
    window.sessionStorage.removeItem(LOGIN_PREFILL_STORAGE_KEY);
  }
};
