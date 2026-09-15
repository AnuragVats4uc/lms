"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { coursesApi } from "@repo/api";
import type {
  Course,
  CourseStatus,
  CreateCourseRequest,
  UpdateCourseRequest,
} from "@repo/types";
import { courseSchema } from "@repo/validation";
import { CrudManagementPage } from "../components/crud/CrudManagementPage";
import { CourseDetails } from "./components/details/CourseDetails";
import { CourseFormFields } from "./components/form/CourseFormFields";
import { createCourseStats } from "./components/stats/createCourseStats";
import { createCourseColumns } from "./components/table/createCourseColumns";
import { courseStatusOptions, initialCourseForm } from "./constants";
import type { CourseForm } from "./types";
import {
  toCourseForm,
  toCreateCoursePayload,
  toUpdateCoursePayload,
} from "./utils/coursePayload";

const courseColumns = createCourseColumns();

export const CoursesPage = () => (
  <CrudManagementPage<
    Course,
    CourseForm,
    CreateCourseRequest,
    UpdateCourseRequest
  >
    columns={courseColumns}
    create={(payload) => coursesApi.create(payload)}
    description="Manage reusable courses that can be assigned to academic sessions."
    emptyDescription="Create the first course to make it available for session assignments."
    entityLabel="Course"
    formResolver={zodResolver(courseSchema)}
    getDisplayName={(course) => course.name}
    getIsActive={(course) => course.isActive}
    getRowId={(course) => course.id}
    getStats={createCourseStats}
    initialForm={initialCourseForm}
    permissionPrefix="course"
    queryFn={(query) =>
      coursesApi.findAll({
        limit: query.limit,
        page: query.page,
        search: query.search,
        status: query.status as CourseStatus | undefined,
      })
    }
    queryKey={["admin", "courses"]}
    remove={(id) => coursesApi.remove(id)}
    renderDetails={(course) => <CourseDetails course={course} />}
    renderForm={(context) => <CourseFormFields {...context} />}
    setActive={(id, active) => coursesApi.update(id, { isActive: active })}
    statusOptions={courseStatusOptions}
    title="Courses"
    toCreatePayload={toCreateCoursePayload}
    toForm={toCourseForm}
    toUpdatePayload={toUpdateCoursePayload}
    update={(id, payload) => coursesApi.update(id, payload)}
  />
);

export default CoursesPage;
