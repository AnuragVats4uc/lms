export const DocumentPageSkeleton = () => {
  return (
    <div
      className="student-document-page student-document-skeleton"
      aria-label="Loading document"
    >
      <div className="student-document-skeleton-title" />
      <div className="student-document-layout">
        <div className="student-document-skeleton-viewer" />
        <div className="student-document-side-column">
          {[1, 2, 3, 4].map((item) => (
            <div className="student-document-skeleton-card" key={item} />
          ))}
        </div>
      </div>
    </div>
  );
};
