import type { StudentSelfProfile } from "@repo/types";
import styles from "../../StudentProfilePage.module.css";
import { BookOpen, Building2, CalendarDays, LockKeyhole } from "lucide-react";
import { SectionHeading } from "../../components/SectionHeading";
import { ProfileDetail } from "../../components/details/ProfileDetail";
import { formatDate, sentenceCase } from "../../utils/profileFormatting";

export const AcademicTab = ({ profile }: { profile: StudentSelfProfile }) => {
  return (
    <div className={styles.academicLayout}>
      <div className={styles.readOnlyBanner}>
        <LockKeyhole size={18} />
        <div>
          <strong>Academic details are institute-managed</strong>
          <span>
            Contact your administrator if your student ID, enrollment, or course
            assignment is incorrect.
          </span>
        </div>
      </div>
      <section className={styles.card}>
        <SectionHeading
          icon={Building2}
          kicker="INSTITUTION"
          title={profile.student.organization?.name ?? "Institution details"}
        />
        <div className={styles.detailGrid}>
          <ProfileDetail
            label="Student ID"
            value={profile.student.studentCode}
          />
          <ProfileDetail
            label="Admission number"
            value={profile.student.admissionNumber ?? "Not assigned"}
          />
          <ProfileDetail
            label="Roll number"
            value={profile.student.rollNumber ?? "Not assigned"}
          />
          <ProfileDetail
            label="Education"
            value={profile.academic.education?.name ?? "Not configured"}
          />
          <ProfileDetail
            label="Digital library"
            value={
              profile.academic.digitalLibraryLocation?.name ?? "Not configured"
            }
          />
          <ProfileDetail
            label="Enrollment status"
            value={sentenceCase(profile.student.status)}
          />
        </div>
      </section>
      {profile.academic.enrollments.map((enrollment) => (
        <section className={styles.card} key={enrollment.id}>
          <div className={styles.sessionHeader}>
            <SectionHeading
              icon={CalendarDays}
              kicker="ACADEMIC SESSION"
              title={enrollment.session.name}
            />
            <span>{sentenceCase(enrollment.status)}</span>
          </div>
          <div className={styles.sessionDates}>
            <span>
              <CalendarDays size={15} />
              {formatDate(enrollment.session.startDate)} –{" "}
              {formatDate(enrollment.session.endDate)}
            </span>
            {enrollment.session.code ? (
              <span>{enrollment.session.code}</span>
            ) : null}
          </div>
          <div className={styles.courseGrid}>
            {enrollment.courses.map((course) => (
              <article key={course.sessionCourseId}>
                <div>
                  <BookOpen size={19} />
                </div>
                <span>
                  <small>{course.course.code}</small>
                  <strong>{course.name}</strong>
                  <em>Enrolled course</em>
                </span>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
