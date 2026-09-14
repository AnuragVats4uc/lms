import type { ChangeEvent } from "react";

import { PLAYBACK_SPEEDS } from "../../constants/videoLesson.constants";

type PlaybackSpeedControlProps = {
  playbackRate: number | undefined;
  onPlaybackSpeed: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export const PlaybackSpeedControl = ({
  onPlaybackSpeed,
  playbackRate,
}: PlaybackSpeedControlProps) => {
  return (
    <label className="student-video-speed-control">
      <span>Speed</span>
      <select
        aria-label="Playback speed"
        onChange={onPlaybackSpeed}
        value={playbackRate}
      >
        {PLAYBACK_SPEEDS.map((rate) => (
          <option key={rate} value={rate}>
            {rate}x
          </option>
        ))}
      </select>
    </label>
  );
};
