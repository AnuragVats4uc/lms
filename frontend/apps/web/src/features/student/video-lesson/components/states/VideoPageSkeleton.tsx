export const VideoPageSkeleton = () => {
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
};
