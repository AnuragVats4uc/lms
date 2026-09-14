"use client";

import { UpNextSection } from "./components/UpNextSection";
import { VideoAboutCard } from "./components/VideoAboutCard";
import { VideoLessonBreadcrumb } from "./components/VideoLessonBreadcrumb";
import { VideoLessonHeader } from "./components/VideoLessonHeader";
import { VideoProgressCard } from "./components/VideoProgressCard";
import { VideoPlayer } from "./components/player/VideoPlayer";
import { VideoPageSkeleton } from "./components/states/VideoPageSkeleton";
import { VideoUnavailableState } from "./components/states/VideoUnavailableState";
import { useStudentVideoLesson } from "./hooks/useStudentVideoLesson";
import { useVideoPlayback } from "./hooks/useVideoPlayback";
import type { StudentVideoLessonPageProps } from "./types";

export function StudentVideoLessonPage({
  resourceId,
}: StudentVideoLessonPageProps) {
  const lesson = useStudentVideoLesson(resourceId);
  const playback = useVideoPlayback({
    resource: lesson.detailQuery.data,
    resourceId,
    saveProgress: lesson.saveProgress,
  });

  if (lesson.detailQuery.isLoading) return <VideoPageSkeleton />;

  if (lesson.detailQuery.isError || !lesson.detailQuery.data) {
    return (
      <VideoUnavailableState
        onRetry={() => void lesson.detailQuery.refetch()}
      />
    );
  }

  const resource = lesson.detailQuery.data;

  return (
    <main className="student-video-page">
      <VideoLessonBreadcrumb resource={resource} />
      <VideoLessonHeader resource={resource} />
      <VideoPlayer
        onClickPreview={playback.onClickPreview}
        onEnded={playback.onEnded}
        onError={playback.onError}
        onPause={playback.onPause}
        onPlay={playback.onPlay}
        onPlaybackSpeed={(event) =>
          playback.onPlaybackRateChange(Number(event.target.value))
        }
        onReady={playback.onReady}
        onRetryError={playback.onRetryError}
        onSeeked={playback.onSeeked}
        onTimeUpdate={playback.onTimeUpdate}
        playbackRate={playback.playbackRate}
        playerActivated={playback.playerActivated}
        playerError={playback.playerError}
        playerKey={playback.playerKey}
        playerRef={playback.playerRef}
        playing={playback.playing}
        resource={resource}
      />
      <div className="student-video-information-grid">
        <VideoAboutCard description={resource.description} />
        <VideoProgressCard
          onContinue={playback.startOrContinue}
          progress={resource.progress}
        />
      </div>
      <UpNextSection resources={resource.upNext} />
    </main>
  );
}
