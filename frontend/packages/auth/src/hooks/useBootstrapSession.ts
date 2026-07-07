import { useEffect, useState } from "react";
import { bootstrapSession } from "../session";

export function useBootstrapSession() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      await bootstrapSession();
      setLoading(false);
    }

    initialize();
  }, []);

  return loading;
}