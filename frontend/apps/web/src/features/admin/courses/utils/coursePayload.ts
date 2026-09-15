import type {
  CreateCourseRequest,
  Course,
  UpdateCourseRequest,
} from "@repo/types";
import type { CourseForm } from "../types";

export const toCreateCoursePayload = (
  form: CourseForm,
): CreateCourseRequest => {
  const payload: CreateCourseRequest = {
    name: form.name.trim(),
    status: form.status,
  };
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.thumbnail.trim()) payload.thumbnail = form.thumbnail.trim();
  if (form.durationInDays.trim())
    payload.durationInDays = Number(form.durationInDays);
  if (form.price.trim()) payload.price = Number(form.price);
  if (form.discount.trim()) payload.discount = Number(form.discount);
  return payload;
};

export const toUpdateCoursePayload = (form: CourseForm): UpdateCourseRequest =>
  toCreateCoursePayload(form);

export const toCourseForm = (course: Course): CourseForm => ({
  description: course.description ?? "",
  discount: course.discount ?? "",
  durationInDays: course.durationInDays?.toString() ?? "",
  name: course.name,
  price: course.price ?? "",
  status: course.status,
  thumbnail: course.thumbnail ?? "",
});
