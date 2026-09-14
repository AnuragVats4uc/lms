import type { StudentExamSectionSummary } from "@repo/types";

type ExamSectionsCardProps = {
  sections: StudentExamSectionSummary[];
};

export const ExamSectionsCard = ({ sections }: ExamSectionsCardProps) => (
  <section className="student-exam-card">
    <h2>Sections</h2>
    {sections.map((section) => (
      <article className="student-exam-section" key={section.id}>
        <div>
          <strong>{section.name}</strong>
          <span>{section.subjects.join(", ")}</span>
        </div>
        <div>
          <span>{section.questionCount} questions</span>
          <span>{section.durationMinutes} min</span>
          <span>{section.maximumMarks} marks</span>
        </div>
      </article>
    ))}
  </section>
);
