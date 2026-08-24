import type {
  ApiResponse,
  TeacherCourseList,
  TeacherCoursesQuery,
  TeacherDashboardData,
  TeacherResourceList,
  TeacherResourcesQuery,
  TeacherResourceTypeOption,
  TeacherStudentList,
  TeacherStudentsQuery,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const TEACHER_ENDPOINT = "/teacher";

export const teacherApi = {
  findDashboard() {
    return api
      .get<ApiResponse<TeacherDashboardData>>(`${TEACHER_ENDPOINT}/dashboard`)
      .then(unwrapApiData);
  },
  findCourses(query?: TeacherCoursesQuery) {
    return api
      .get<ApiResponse<TeacherCourseList>>(`${TEACHER_ENDPOINT}/courses`, {
        params: query,
      })
      .then(unwrapApiData);
  },
  findResources(query?: TeacherResourcesQuery) {
    return api
      .get<ApiResponse<TeacherResourceList>>(`${TEACHER_ENDPOINT}/resources`, {
        params: query,
      })
      .then(unwrapApiData);
  },
  findResourceTypes() {
    return api
      .get<ApiResponse<TeacherResourceTypeOption[]>>(
        `${TEACHER_ENDPOINT}/resource-types`,
      )
      .then(unwrapApiData);
  },
  findStudents(query?: TeacherStudentsQuery) {
    return api
      .get<ApiResponse<TeacherStudentList>>(`${TEACHER_ENDPOINT}/students`, {
        params: query,
      })
      .then(unwrapApiData);
  },
};
