"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Check,
  Clock3,
  FileText,
  Play,
  RotateCcw,
  UserRound,
  Video,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import ReactPlayer from "react-player";
import { studentsApi } from "@repo/api";
import type {
  StudentVideoProgress,
  StudentVideoResourceDetail,
  StudentVideoUpNextResource,
  UpdateStudentVideoProgressRequest,
} from "@repo/types";

const PROGRESS_SAVE_INTERVAL_MS = 15_000;
const DESCRIPTION_PREVIEW_LENGTH = 310;

export function StudentVideoLessonPage({ resourceId }: { resourceId: number }) {
  const queryClient = useQueryClient();
  const playerRef = useRef<HTMLVideoElement>(null);
  const currentPositionRef = useRef(0);
  const lastPersistedAtRef = useRef(0);
  const lastPersistedPositionRef = useRef(0);
  const resumeAppliedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [playerActivated, setPlayerActivated] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playerError, setPlayerError] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const detailQueryKey = ["student-video-resource", resourceId] as const;
  const detailQuery = useQuery({
    queryFn: () => studentsApi.findMyVideoResource(resourceId),
    queryKey: detailQueryKey,
    staleTime: 30_000,
  });
  const progressMutation = useMutation({
    mutationFn: (payload: UpdateStudentVideoProgressRequest) =>
      studentsApi.updateMyVideoProgress(resourceId, payload),
    onSuccess: (progress) => {
      queryClient.setQueryData<StudentVideoResourceDetail>(
        detailQueryKey,
        (current) => (current ? { ...current, progress } : current),
      );
    },
  });
  const saveProgress = progressMutation.mutate;

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
    [saveProgress],
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

  if (detailQuery.isLoading) return <VideoPageSkeleton />;

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="student-video-state-card" role="alert">
        <Video aria-hidden="true" size={30} />
        <h1>Video unavailable</h1>
        <p>
          This lesson may not exist, may not be published, or may not belong to
          one of your enrolled courses.
        </p>
        <div>
          <button onClick={() => void detailQuery.refetch()} type="button">
            Try again
          </button>
          <Link href="/student/resources">Back to resources</Link>
        </div>
      </div>
    );
  }

  const resource = detailQuery.data;
  const description = resource.description?.trim() ?? "";
  const descriptionIsLong = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const visibleDescription =
    descriptionIsLong && !descriptionExpanded
      ? `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}…`
      : description;

  const applyResumePosition = () => {
    const player = playerRef.current;
    const savedPosition = resource.progress.currentPositionSeconds;
    if (!player || savedPosition <= 0) return;
    player.currentTime = savedPosition;
    currentPositionRef.current = savedPosition;
  };

  const startOrContinue = () => {
    setPlayerActivated(true);
    setPlaying(true);
    applyResumePosition();
  };

  const onPlayerReady = () => {
    if (resumeAppliedRef.current) return;
    resumeAppliedRef.current = true;
    applyResumePosition();
  };

  const syncCurrentPosition = (event?: SyntheticEvent<HTMLVideoElement>) => {
    const eventPosition = event?.currentTarget?.currentTime;
    const playerPosition = playerRef.current?.currentTime;
    const nextPosition =
      typeof eventPosition === "number" && Number.isFinite(eventPosition)
        ? eventPosition
        : playerPosition;

    if (typeof nextPosition === "number" && Number.isFinite(nextPosition)) {
      currentPositionRef.current = nextPosition;
    }
  };

  const onTimeUpdate = (event?: SyntheticEvent<HTMLVideoElement>) => {
    syncCurrentPosition(event);
    persistProgress();
  };

  return (
    <main className="student-video-page">
      <nav aria-label="Breadcrumb" className="student-video-breadcrumb">
        <Link href="/student/my-courses">My Courses</Link>
        <span>/</span>
        <Link href="/student/resources">{resource.course.sessionName}</Link>
        <span>/</span>
        <Link
          href={`/student/resources?search=${encodeURIComponent(resource.course.name)}`}
        >
          {resource.course.name}
        </Link>
        <span>/</span>
        <span title={resource.title}>{resource.title}</span>
      </nav>

      <header className="student-video-heading">
        <h1>{resource.title}</h1>
        <div className="student-video-meta" aria-label="Video details">
          <span>
            <Video aria-hidden="true" size={16} /> Video
          </span>
          {resource.durationInSeconds != null ? (
            <span>
              <Clock3 aria-hidden="true" size={16} />
              {formatDurationLabel(resource.durationInSeconds)}
            </span>
          ) : null}
          {resource.instructor ? (
            <span>
              <UserRound aria-hidden="true" size={16} />
              {resource.instructor.name}
            </span>
          ) : null}
        </div>
      </header>

      <section className="student-video-player-shell" aria-label="Video player">
        {playerError ? (
          <div className="student-video-player-error" role="alert">
            <Video aria-hidden="true" size={34} />
            <strong>Unable to load this video</strong>
            <span>The video source could not be reached.</span>
            <button
              onClick={() => {
                setPlayerError(false);
                setPlayerKey((current) => current + 1);
              }}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={15} /> Retry video
            </button>
          </div>
        ) : (
          <ReactPlayer
            controls
            height="100%"
            key={playerKey}
            light={
              !playerActivated && resource.thumbnail
                ? resource.thumbnail
                : false
            }
            onClickPreview={() => setPlayerActivated(true)}
            onEnded={() => {
              const duration = resource.durationInSeconds;
              if (duration) currentPositionRef.current = duration;
              setPlaying(false);
              persistProgress(true, true);
            }}
            onError={() => setPlayerError(true)}
            onPause={() => {
              setPlaying(false);
              syncCurrentPosition();
              persistProgress(false, true);
            }}
            onPlay={() => {
              setPlayerActivated(true);
              setPlaying(true);
            }}
            onReady={onPlayerReady}
            onSeeked={() => {
              syncCurrentPosition();
              persistProgress(false, true);
            }}
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
          <label className="student-video-speed-control">
            <span>Speed</span>
            <select
              aria-label="Playback speed"
              onChange={(event) => setPlaybackRate(Number(event.target.value))}
              value={playbackRate}
            >
              {[0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </section>

      <div className="student-video-information-grid">
        <section className="student-video-about-card">
          <h2>About this video</h2>
          {visibleDescription ? (
            <p>{visibleDescription}</p>
          ) : (
            <p className="student-video-muted-copy">
              No description has been provided for this lesson.
            </p>
          )}
          {descriptionIsLong ? (
            <button
              onClick={() => setDescriptionExpanded((current) => !current)}
              type="button"
            >
              {descriptionExpanded ? "Show Less" : "Show More"}
            </button>
          ) : null}
        </section>

        <VideoProgressCard
          onContinue={startOrContinue}
          progress={resource.progress}
        />
      </div>

      <UpNextSection resources={resource.upNext} />
    </main>
  );
}

function VideoProgressCard({
  onContinue,
  progress,
}: {
  onContinue: () => void;
  progress: StudentVideoProgress;
}) {
  const percentage = Math.max(0, Math.min(100, progress.percentage));
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const hasStarted = progress.currentPositionSeconds > 0;

  return (
    <section className="student-video-progress-card">
      <h2>Your Progress</h2>
      <div className="student-video-progress-body">
        <div
          aria-label={`${percentage}% completed`}
          className="student-video-progress-ring"
        >
          <svg aria-hidden="true" viewBox="0 0 104 104">
            <circle className="track" cx="52" cy="52" r={radius} />
            <circle
              className="value"
              cx="52"
              cy="52"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div>
            <strong>{percentage}%</strong>
            <span>Completed</span>
          </div>
        </div>
        <dl>
          <div>
            <dt>Last watched</dt>
            <dd>{formatLastWatched(progress.lastWatchedAt)}</dd>
          </div>
        </dl>
      </div>
      {progress.status !== "COMPLETED" ? (
        <button onClick={onContinue} type="button">
          <Play aria-hidden="true" fill="currentColor" size={14} />
          {hasStarted ? "Continue Watching" : "Start Watching"}
        </button>
      ) : (
        <div className="student-video-complete-label">
          <Check aria-hidden="true" size={15} /> Completed
        </div>
      )}
    </section>
  );
}

function UpNextSection({
  resources,
}: {
  resources: StudentVideoUpNextResource[];
}) {
  return (
    <section className="student-video-up-next">
      <h2>Up Next</h2>
      {resources.length ? (
        <div className="student-video-up-next-grid">
          {resources.map((resource) => {
            const isVideo = resource.resourceType.code === "VIDEO";
            const href = isVideo
              ? `/student/resources/${resource.id}/video`
              : `/student/resources/${resource.id}`;
            return (
              <article className="student-video-next-card" key={resource.id}>
                <Link
                  aria-label={`Open ${resource.title}`}
                  className="student-video-next-visual"
                  href={href}
                  style={
                    resource.thumbnail
                      ? { backgroundImage: `url("${resource.thumbnail}")` }
                      : undefined
                  }
                >
                  <span className={isVideo ? "video" : "document"}>
                    {isVideo ? (
                      <Play aria-hidden="true" fill="currentColor" size={18} />
                    ) : (
                      <FileText aria-hidden="true" size={20} />
                    )}
                  </span>
                </Link>
                <div className="student-video-next-copy">
                  <Link href={href}>{resource.title}</Link>
                  <span>
                    {formatResourceType(resource)}
                    {isVideo && resource.durationInSeconds != null
                      ? ` · ${formatDuration(resource.durationInSeconds)}`
                      : ""}
                  </span>
                  <Link className="student-video-next-action" href={href}>
                    {isVideo ? "Play Next" : "View Document"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="student-video-up-next-empty">
          You have reached the end of the published resources in this course.
        </p>
      )}
    </section>
  );
}

function VideoPageSkeleton() {
  return (
    <div
      aria-label="Loading video lesson"
      className="student-video-page student-video-skeleton"
    >
      <div className="student-video-skeleton-breadcrumb" />
      <div className="student-video-skeleton-heading" />
      <div className="student-video-skeleton-player" />
      <div className="student-video-information-grid">
        <div className="student-video-skeleton-card" />
        <div className="student-video-skeleton-card" />
      </div>
    </div>
  );
}

function formatResourceType(resource: StudentVideoUpNextResource) {
  if (resource.resourceType.code === "VIDEO") return "Video";
  const mimeType = resource.mimeType?.toLowerCase() ?? "";
  if (mimeType.includes("pdf")) return "PDF Document";
  return "Document";
}

function formatDurationLabel(totalSeconds: number) {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} min`;
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatLastWatched(value: string | null) {
  if (!value) return "Not watched yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (sameDay(date, today)) return `Today, ${time}`;
  if (sameDay(date, yesterday)) return `Yesterday, ${time}`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
