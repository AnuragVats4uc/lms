import { useEffect, useState } from "react";

import { consumeLoginPrefill } from "../../login-prefill";

export const useLoginPrefill = (queryEmail: string) => {
  const [password, setPassword] = useState("");

  useEffect(() => {
    const prefilledPassword = consumeLoginPrefill(queryEmail);
    if (prefilledPassword) setPassword(prefilledPassword);
  }, [queryEmail]);

  return password;
};
