import { Check } from "lucide-react";
import type { PublicRegistrationPage } from "@repo/types";

type CourseInterestSelectorProps = {
  courses: PublicRegistrationPage["courses"];
  onChange: (courseUuids: string[]) => void;
  selectedCourseUuids: string[];
};

export const CourseInterestSelector = ({
  courses,
  onChange,
  selectedCourseUuids,
}: CourseInterestSelectorProps) => (
  <>
    <div className="registration-section-heading">
      <span>Course Interests</span>
      <strong>Which course/exam are you preparing for? *</strong>
      <small>
        Select one or more interests. Your account will receive access to every
        available course in this session.
      </small>
    </div>
    {courses.length ? (
      <div className="registration-course-grid">
        {courses.map((course) => {
          const selected = selectedCourseUuids.includes(course.uuid);
          return (
            <button
              aria-pressed={selected}
              className={
                selected
                  ? "registration-course-choice is-selected"
                  : "registration-course-choice"
              }
              key={course.uuid}
              onClick={() =>
                onChange(
                  selected
                    ? selectedCourseUuids.filter((uuid) => uuid !== course.uuid)
                    : [...selectedCourseUuids, course.uuid],
                )
              }
              type="button"
            >
              <span>{selected ? <Check size={15} /> : null}</span>
              <strong>{course.name}</strong>
            </button>
          );
        })}
      </div>
    ) : (
      <div className="registration-inline-state">
        No courses are currently available for this registration.
      </div>
    )}
  </>
);
