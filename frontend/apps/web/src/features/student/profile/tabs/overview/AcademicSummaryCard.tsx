import { BookOpen, Building2, GraduationCap, MapPin } from "lucide-react";
import type { StudentSelfProfile } from "@repo/types";

import { SectionHeading } from "../../components/SectionHeading";
import styles from "../../StudentProfilePage.module.css";

export const AcademicSummaryCard = ({
  profile,
}: {
  profile: StudentSelfProfile;
}) => {
  const enrollment = profile.academic.enrollments[0];
  return (
    <section className={styles.card}>
      <SectionHeading
        icon={GraduationCap}
        kicker="ACADEMIC SNAPSHOT"
        title={enrollment?.session.name ?? "Academic information"}
      />
      <div className={styles.academicSummary}>
        <div>
          <Building2 size={18} />
          <span>
            <small>Institution</small>
            <strong>
              {profile.student.organization?.name ?? "Not assigned"}
            </strong>
          </span>
        </div>
        <div>
          <GraduationCap size={18} />
          <span>
            <small>Education</small>
            <strong>
              {profile.academic.education?.name ?? "Not configured"}
            </strong>
          </span>
        </div>
        <div>
          <MapPin size={18} />
          <span>
            <small>Digital library</small>
            <strong>
              {profile.academic.digitalLibraryLocation?.name ??
                "Not configured"}
            </strong>
          </span>
        </div>
      </div>
      <div className={styles.courseStrip}>
        {(enrollment?.courses ?? []).map((course) => (
          <span key={course.sessionCourseId}>
            <BookOpen size={14} /> {course.name}
          </span>
        ))}
        {!enrollment?.courses.length ? <em>No courses assigned</em> : null}
      </div>
    </section>
  );
};
