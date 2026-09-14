import { StudentDocumentProgress } from "@repo/types";
import { formatEnum } from "../utils/formatEnumLabel";

export const ProgressBadge = ({
  status,
}: {
  status: StudentDocumentProgress["status"];
}) => {
  return (
    <span className={`student-document-status ${status.toLowerCase()}`}>
      {formatEnum(status)}
    </span>
  );
};
