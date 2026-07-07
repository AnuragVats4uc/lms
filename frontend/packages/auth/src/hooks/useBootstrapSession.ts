import { useEffect, useState } from "react";
import { bootstrapSession } from "../session";

let bootstrapPromise: Promise<boolean> | null = null;

export function useBootstrapSession() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      bootstrapPromise ??= bootstrapSession();
      await bootstrapPromise;

      if (isMounted) {
        setLoading(false);
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  return loading;
}
