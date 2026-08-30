"use client";

import { studentsApi } from "@repo/api";
import type {
  StudentResourceActivityEndReason,
  StudentResourceActivityEventType,
} from "@repo/types";
import { useCallback, useEffect, useRef } from "react";

interface ResourceActivityState {
  active?: boolean;
  completed?: boolean;
  pageNumber?: number;
  positionSeconds?: number;
}

interface ResourceActivityOptions {
  enabled: boolean;
  initialActive?: boolean;
  initialPageNumber?: number;
  initialPositionSeconds?: number;
  onHeartbeat?: () => void;
  resourceId: number;
}

export function useResourceActivity({
  enabled,
  initialActive = true,
  initialPageNumber,
  initialPositionSeconds,
  onHeartbeat,
  resourceId,
}: ResourceActivityOptions) {
  const sessionUuidRef = useRef<string | null>(null);
  const sessionPromiseRef = useRef<Promise<string | null> | null>(null);
  const activeRef = useRef(initialActive);
  const completedRef = useRef(false);
  const endedRef = useRef(false);
  const pageNumberRef = useRef(initialPageNumber);
  const positionSecondsRef = useRef(initialPositionSeconds);
  const onHeartbeatRef = useRef(onHeartbeat);

  useEffect(() => {
    onHeartbeatRef.current = onHeartbeat;
  }, [onHeartbeat]);

  useEffect(() => {
    if (!sessionUuidRef.current && initialPageNumber !== undefined) {
      pageNumberRef.current = initialPageNumber;
    }
  }, [initialPageNumber]);

  useEffect(() => {
    if (!sessionUuidRef.current && initialPositionSeconds !== undefined) {
      positionSecondsRef.current = initialPositionSeconds;
    }
  }, [initialPositionSeconds]);

  const getSessionUuid = useCallback(async () => {
    if (sessionUuidRef.current) return sessionUuidRef.current;
    return sessionPromiseRef.current;
  }, []);

  const heartbeat = useCallback(async () => {
    const sessionUuid = await getSessionUuid();
    if (!sessionUuid || endedRef.current) return;
    await studentsApi.heartbeatMyResourceActivity(sessionUuid, {
      active: activeRef.current && document.visibilityState === "visible",
      completed: completedRef.current,
      pageNumber: pageNumberRef.current,
      currentPositionSeconds: positionSecondsRef.current,
    });
    onHeartbeatRef.current?.();
  }, [getSessionUuid]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let ownedSessionUuid: string | null = null;
    let heartbeatInterval: number | undefined;

    endedRef.current = false;
    const startPromise = studentsApi
      .startMyResourceActivity(resourceId, {
        startPositionSeconds: positionSecondsRef.current,
      })
      .then(async (session) => {
        ownedSessionUuid = session.sessionUuid;
        if (cancelled) {
          await studentsApi.endMyResourceActivity(session.sessionUuid, {
            reason: "NAVIGATED_AWAY",
            active:
              activeRef.current && document.visibilityState === "visible",
            currentPositionSeconds: positionSecondsRef.current,
            pageNumber: pageNumberRef.current,
          });
          return null;
        }
        sessionUuidRef.current = session.sessionUuid;
        if (pageNumberRef.current !== undefined) {
          await studentsApi.switchMyDocumentPage(
            session.sessionUuid,
            pageNumberRef.current,
          );
        }
        heartbeatInterval = window.setInterval(
          () => {
            void heartbeat().catch(() => undefined);
          },
          Math.max(5, session.heartbeatSeconds) * 1000,
        );
        return session.sessionUuid;
      })
      .catch(() => null);
    sessionPromiseRef.current = startPromise;

    const onVisibilityChange = () => {
      void heartbeat().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      if (heartbeatInterval !== undefined) {
        window.clearInterval(heartbeatInterval);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (ownedSessionUuid && !endedRef.current) {
        endedRef.current = true;
        void studentsApi
          .endMyResourceActivity(ownedSessionUuid, {
            reason: "NAVIGATED_AWAY",
            active:
              activeRef.current && document.visibilityState === "visible",
            currentPositionSeconds: positionSecondsRef.current,
            pageNumber: pageNumberRef.current,
            completed: completedRef.current,
          })
          .catch(() => undefined);
      }
      if (sessionUuidRef.current === ownedSessionUuid) {
        sessionUuidRef.current = null;
      }
      if (sessionPromiseRef.current === startPromise) {
        sessionPromiseRef.current = null;
      }
    };
  }, [enabled, heartbeat, resourceId]);

  const updateState = useCallback((state: ResourceActivityState) => {
    if (state.active !== undefined) activeRef.current = state.active;
    if (state.completed !== undefined) completedRef.current = state.completed;
    if (state.pageNumber !== undefined)
      pageNumberRef.current = state.pageNumber;
    if (state.positionSeconds !== undefined) {
      positionSecondsRef.current = Math.max(
        0,
        Math.floor(state.positionSeconds),
      );
    }
  }, []);

  const changePage = useCallback(
    async (pageNumber: number) => {
      pageNumberRef.current = pageNumber;
      const sessionUuid = await getSessionUuid();
      if (!sessionUuid || endedRef.current) return;
      await studentsApi.switchMyDocumentPage(sessionUuid, pageNumber);
    },
    [getSessionUuid],
  );

  const recordEvent = useCallback(
    async (
      eventType: StudentResourceActivityEventType,
      details: {
        metadata?: Record<string, unknown>;
        pageNumber?: number;
        videoPositionSeconds?: number;
      } = {},
    ) => {
      const sessionUuid = await getSessionUuid();
      if (!sessionUuid || endedRef.current) return;
      await studentsApi.recordMyResourceActivityEvent(sessionUuid, {
        eventType,
        clientEventId: crypto.randomUUID(),
        pageNumber: details.pageNumber ?? pageNumberRef.current,
        videoPositionSeconds:
          details.videoPositionSeconds ?? positionSecondsRef.current,
        metadata: details.metadata,
      });
    },
    [getSessionUuid],
  );

  const end = useCallback(
    async (
      reason: StudentResourceActivityEndReason,
      state: ResourceActivityState = {},
    ) => {
      updateState(state);
      const sessionUuid = await getSessionUuid();
      if (!sessionUuid || endedRef.current) return;
      endedRef.current = true;
      await studentsApi.endMyResourceActivity(sessionUuid, {
        reason,
        active: activeRef.current && document.visibilityState === "visible",
        currentPositionSeconds: positionSecondsRef.current,
        pageNumber: pageNumberRef.current,
        completed: completedRef.current,
      });
    },
    [getSessionUuid, updateState],
  );

  return { changePage, end, heartbeat, recordEvent, updateState };
}
