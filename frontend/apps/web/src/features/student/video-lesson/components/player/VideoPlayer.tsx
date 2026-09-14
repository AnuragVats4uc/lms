import type { ChangeEvent, RefObject, SyntheticEvent } from "react";
import ReactPlayer from "react-player";
import type { StudentVideoResourceDetail } from "@repo/types";

import { PlaybackSpeedControl } from "./PlaybackSpeedControl";
import { VideoPlayerError } from "./VideoPlayerError";

type VideoPlayerProps = {
  playerError: boolean;
  playerKey: number;
  playerActivated: boolean;
  resource: StudentVideoResourceDetail;
  playbackRate?: number | undefined;
  playerRef: RefObject<HTMLVideoElement | null>;
  playing: boolean;
  onRetryError: () => void;
  onClickPreview: () => void;
  onEnded: () => void;
  onError: () => void;
  onPause: () => void;
  onPlay: () => void;
  onReady: () => void;
  onSeeked: () => void;
  onTimeUpdate: (event?: SyntheticEvent<HTMLVideoElement>) => void;
  onPlaybackSpeed: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export const VideoPlayer = ({
  playerError,
  playerKey,
  playerActivated,
  resource,
  playerRef,
  playbackRate,
  playing,
  onRetryError,
  onClickPreview,
  onEnded,
  onError,
  onPause,
  onPlay,
  onReady,
  onSeeked,
  onTimeUpdate,
  onPlaybackSpeed,
}: VideoPlayerProps) => {
  return (
    <section className="student-video-player-shell" aria-label="Video player">
      {playerError ? (
        <VideoPlayerError onRetryError={onRetryError} />
      ) : (
        <ReactPlayer
          controls
          height="100%"
          key={playerKey}
          light={
            !playerActivated && resource.thumbnail ? resource.thumbnail : false
          }
          onClickPreview={onClickPreview}
          onEnded={onEnded}
          onError={onError}
          onPause={onPause}
          onPlay={onPlay}
          onReady={onReady}
          onSeeked={onSeeked}
          onTimeUpdate={onTimeUpdate}
          playbackRate={playbackRate}
          playing={playing}
          playsInline
          ref={playerRef}
          src={resource.videoUrl}
          width="100%"
        />
      )}
      {!playerError ? (
        <PlaybackSpeedControl
          playbackRate={playbackRate}
          onPlaybackSpeed={onPlaybackSpeed}
        />
      ) : null}
    </section>
  );
};
