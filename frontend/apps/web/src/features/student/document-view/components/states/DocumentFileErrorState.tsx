import { FileText } from "lucide-react";

export const DocumentFileErrorState = ({
  onRetryFile,
}: {
  onRetryFile: () => void;
}) => {
  return (
    <div className="student-document-file-error" role="alert">
      <FileText aria-hidden="true" size={28} />
      <strong>Unable to load this PDF</strong>
      <span>The document storage could not be reached.</span>
      <button onClick={onRetryFile} type="button">
        Retry document
      </button>
    </div>
  );
};
