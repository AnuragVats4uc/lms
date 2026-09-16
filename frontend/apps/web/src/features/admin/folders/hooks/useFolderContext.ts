import { useState } from "react";

export const useFolderContext = (initialSessionCourseId: number | null) => {
  const [selectedSessionCourseId, setSelectedSessionCourseId] = useState<
    number | null
  >(initialSessionCourseId);

  return { selectedSessionCourseId, setSelectedSessionCourseId };
};
