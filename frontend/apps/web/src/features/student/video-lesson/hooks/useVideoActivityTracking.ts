import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useResourceActivity } from "../../activity/useResourceActivity";

type UseVideoActivityTrackingOptions = {
  currentPositionRef: MutableRefObject<number>;
  enabled: boolean;
  initialPositionSeconds: number;
  resourceId: number;
};

export const useVideoActivityTracking = ({
  currentPositionRef,
  enabled,
  initialPositionSeconds,
  resourceId,
}: UseVideoActivityTrackingOptions) => {
  const pendingInitialPlayEventRef = useRef(false);
  const [activityStarted, setActivityStarted] = useState(false);
  const activity = useResourceActivity({
    enabled: enabled && activityStarted,
    initialActive: false,
    initialPositionSeconds,
    resourceId,
  });
  const { recordEvent } = activity;

  useEffect(() => {
    setActivityStarted(false);
    pendingInitialPlayEventRef.current = false;
  }, [resourceId]);

  useEffect(() => {
    if (!activityStarted || !pendingInitialPlayEventRef.current) return;

    pendingInitialPlayEventRef.current = false;
    void recordEvent("VIDEO_PLAY", {
      videoPositionSeconds: currentPositionRef.current,
    }).catch(() => undefined);
  }, [activityStarted, currentPositionRef, recordEvent]);

  const recordPlay = useCallback(() => {
    activity.updateState({
      active: true,
      positionSeconds: currentPositionRef.current,
    });
    if (!activityStarted) {
      pendingInitialPlayEventRef.current = true;
      setActivityStarted(true);
      return;
    }
    void activity
      .recordEvent("VIDEO_PLAY", {
        videoPositionSeconds: currentPositionRef.current,
      })
      .catch(() => undefined);
  }, [activity, activityStarted, currentPositionRef]);

  const recordPause = useCallback(() => {
    activity.updateState({
      active: false,
      positionSeconds: currentPositionRef.current,
    });
    void activity
      .recordEvent("VIDEO_PAUSE", {
        videoPositionSeconds: currentPositionRef.current,
      })
      .catch(() => undefined);
  }, [activity, currentPositionRef]);

  const recordSeek = useCallback(() => {
    void activity
      .recordEvent("VIDEO_SEEK", {
        videoPositionSeconds: currentPositionRef.current,
      })
      .catch(() => undefined);
  }, [activity, currentPositionRef]);

  const recordComplete = useCallback(() => {
    const completedState = {
      active: false,
      completed: true,
      positionSeconds: currentPositionRef.current,
    };
    activity.updateState(completedState);
    void activity
      .recordEvent("VIDEO_COMPLETE", {
        videoPositionSeconds: currentPositionRef.current,
      })
      .then(() => activity.end("COMPLETED", completedState))
      .catch(() => undefined);
  }, [activity, currentPositionRef]);

  const updatePosition = useCallback(
    (active: boolean) => {
      activity.updateState({
        active,
        positionSeconds: currentPositionRef.current,
      });
    },
    [activity, currentPositionRef],
  );

  return {
    recordComplete,
    recordPause,
    recordPlay,
    recordSeek,
    updatePosition,
  };
};
