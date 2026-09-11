import { useEffect, useState } from "react";

import {
  LOGIN_PREFILL_MAX_AGE_MS,
  LOGIN_PREFILL_STORAGE_KEY,
} from "../constants";

type LoginPrefill = {
  email?: string;
  password?: string;
  timestamp?: number;
};

export const useLoginPrefill = (queryEmail: string) => {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!queryEmail || typeof window === "undefined") return;

    const raw = window.sessionStorage.getItem(LOGIN_PREFILL_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as LoginPrefill;
      const isFresh =
        typeof parsed.timestamp === "number" &&
        Date.now() - parsed.timestamp < LOGIN_PREFILL_MAX_AGE_MS;

      if (
        isFresh &&
        parsed.email?.trim().toLowerCase() === queryEmail &&
        parsed.password
      ) {
        setPassword(parsed.password);
      }
    } finally {
      window.sessionStorage.removeItem(LOGIN_PREFILL_STORAGE_KEY);
    }
  }, [queryEmail]);

  return password;
};
