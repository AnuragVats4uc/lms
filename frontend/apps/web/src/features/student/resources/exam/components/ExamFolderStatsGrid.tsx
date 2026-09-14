import { StudentExamResourceDetail } from "@repo/types";
import { ExamStat } from "./ExamStat";
import { CheckCircle2, Clock3, FileQuestion, Trophy } from "lucide-react";

export const ExamFolderStatsGrid = ({
  data,
}: {
  data: StudentExamResourceDetail;
}) => {
  return (
    <section className="student-exam-stat-grid">
      <ExamStat
        icon={Clock3}
        value={`${data.exam.durationMinutes} min`}
        label="Exam duration"
      />
      <ExamStat
        icon={FileQuestion}
        value={String(data.exam.questionCount)}
        label="Questions"
      />
      <ExamStat
        icon={Trophy}
        value={String(data.exam.maximumMarks)}
        label="Maximum marks"
      />
      <ExamStat
        icon={CheckCircle2}
        value={`${data.exam.attemptsUsed}/${data.exam.attemptLimit}`}
        label="Attempts used"
      />
    </section>
  );
};
