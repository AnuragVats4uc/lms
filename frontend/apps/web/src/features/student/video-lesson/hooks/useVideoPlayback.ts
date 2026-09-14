import { type SyntheticEvent, useCallback, useRef, useState } from "react";
import type {
  StudentVideoResourceDetail,
  UpdateStudentVideoProgressRequest,
} from "@repo/types";

import { useVideoActivityTracking } from "./useVideoActivityTracking";
import { useVideoProgressPersistence } from "./useVideoProgressPersistence";

type UseVideoPlaybackOptions = {
  resource?: StudentVideoResourceDetail;
  resourceId: number;
  saveProgress: (payload: UpdateStudentVideoProgressRequest) => void;
};

export const useVideoPlayback = ({
  resource,
  resourceId,
  saveProgress,
}: UseVideoPlaybackOptions) => {
  const playerRef = useRef<HTMLVideoElement>(null);
  const currentPositionRef = useRef(0);
  const resumeAppliedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [playerActivated, setPlayerActivated] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playerError, setPlayerError] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const persistProgress = useVideoProgressPersistence({
    currentPositionRef,
    resourceId,
    saveProgress,
  });
  const activity = useVideoActivityTracking({
    currentPositionRef,
    enabled: Boolean(resource),
    initialPositionSeconds: resource?.progress.currentPositionSeconds ?? 0,
    resourceId,
  });

  const applyResumePosition = useCallback(() => {
    const player = playerRef.current;
    const savedPosition = resource?.progress.currentPositionSeconds ?? 0;
    if (!player || savedPosition <= 0) return;

    player.currentTime = savedPosition;
    currentPositionRef.current = savedPosition;
  }, [resource?.progress.currentPositionSeconds]);

  const startOrContinue = useCallback(() => {
    setPlayerActivated(true);
    setPlaying(true);
    applyResumePosition();
  }, [applyResumePosition]);

  const handleReady = useCallback(() => {
    if (resumeAppliedRef.current) return;
    resumeAppliedRef.current = true;
    applyResumePosition();
  }, [applyResumePosition]);

  const syncCurrentPosition = useCallback(
    (event?: SyntheticEvent<HTMLVideoElement>) => {
      const eventPosition = event?.currentTarget?.currentTime;
      const playerPosition = playerRef.current?.currentTime;
      const nextPosition =
        typeof eventPosition === "number" && Number.isFinite(eventPosition)
          ? eventPosition
          : playerPosition;

      if (typeof nextPosition === "number" && Number.isFinite(nextPosition)) {
        currentPositionRef.current = nextPosition;
        activity.updatePosition(playing);
      }
    },
    [activity, playing],
  );

  const handleTimeUpdate = useCallback(
    (event?: SyntheticEvent<HTMLVideoElement>) => {
      syncCurrentPosition(event);
      persistProgress();
    },
    [persistProgress, syncCurrentPosition],
  );

  const handlePlay = useCallback(() => {
    setPlayerActivated(true);
    setPlaying(true);
    activity.recordPlay();
  }, [activity]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    syncCurrentPosition();
    persistProgress(false, true);
    activity.recordPause();
  }, [activity, persistProgress, syncCurrentPosition]);

  const handleSeeked = useCallback(() => {
    syncCurrentPosition();
    persistProgress(false, true);
    activity.recordSeek();
  }, [activity, persistProgress, syncCurrentPosition]);

  const handleEnded = useCallback(() => {
    if (resource?.durationInSeconds) {
      currentPositionRef.current = resource.durationInSeconds;
    }
    setPlaying(false);
    persistProgress(true, true);
    activity.recordComplete();
  }, [activity, persistProgress, resource?.durationInSeconds]);

  const retry = useCallback(() => {
    setPlayerError(false);
    setPlayerKey((current) => current + 1);
  }, []);

  return {
    onClickPreview: () => setPlayerActivated(true),
    onEnded: handleEnded,
    onError: () => setPlayerError(true),
    onPause: handlePause,
    onPlay: handlePlay,
    onPlaybackRateChange: setPlaybackRate,
    onReady: handleReady,
    onRetryError: retry,
    onSeeked: handleSeeked,
    onTimeUpdate: handleTimeUpdate,
    playbackRate,
    playerActivated,
    playerError,
    playerKey,
    playerRef,
    playing,
    startOrContinue,
  };
};
