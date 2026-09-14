import { type MutableRefObject, useCallback, useEffect, useRef } from "react";
import type { UpdateStudentVideoProgressRequest } from "@repo/types";

import { PROGRESS_SAVE_INTERVAL_MS } from "../constants/videoLesson.constants";

type UseVideoProgressPersistenceOptions = {
  currentPositionRef: MutableRefObject<number>;
  resourceId: number;
  saveProgress: (payload: UpdateStudentVideoProgressRequest) => void;
};

export const useVideoProgressPersistence = ({
  currentPositionRef,
  resourceId,
  saveProgress,
}: UseVideoProgressPersistenceOptions) => {
  const lastPersistedAtRef = useRef(0);
  const lastPersistedPositionRef = useRef(0);

  useEffect(() => {
    lastPersistedAtRef.current = 0;
    lastPersistedPositionRef.current = 0;
  }, [resourceId]);

  const persistProgress = useCallback(
    (ended = false, force = false) => {
      const currentPositionSeconds = Math.max(
        0,
        Math.floor(currentPositionRef.current),
      );
      if (!ended && currentPositionSeconds <= 0) return;

      const now = Date.now();
      const enoughTimePassed =
        now - lastPersistedAtRef.current >= PROGRESS_SAVE_INTERVAL_MS;
      const positionChanged =
        Math.abs(currentPositionSeconds - lastPersistedPositionRef.current) >=
        5;
      if (!ended && !force && (!enoughTimePassed || !positionChanged)) return;

      lastPersistedAtRef.current = now;
      lastPersistedPositionRef.current = currentPositionSeconds;
      saveProgress({ currentPositionSeconds, ended });
    },
    [currentPositionRef, saveProgress],
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") persistProgress(false, true);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      persistProgress(false, true);
    };
  }, [persistProgress]);

  return persistProgress;
};
