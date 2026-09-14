import { StudentExamResourceDetail } from "@repo/types";

export const ExamFolderHero = ({
  data,
}: {
  data: StudentExamResourceDetail;
}) => {
  return (
    <section className="student-exam-hero">
      <div>
        <span className="student-folder-eyebrow">{data.exam.code}</span>
        <h1>{data.exam.title}</h1>
        <p>
          {data.description ??
            "Read the instructions before starting this assessment."}
        </p>
      </div>
      <span
        className={`student-exam-availability ${data.exam.availability.toLowerCase()}`}
      >
        {data.exam.availability}
      </span>
    </section>
  );
};
