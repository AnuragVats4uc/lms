import { z } from "zod/v4";

const optionalNumericString = (message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), message);

export const studentSchema = z.object({
  admissionNumber: z.string().trim().max(50).or(z.literal("")),
  dateOfBirth: z.string().trim().min(1, "Date of birth is required"),
  digitalLibraryLocationUuid: z
    .string()
    .trim()
    .min(1, "Select a Digital Library Location"),
  educationOptionUuid: z.string().trim().min(1, "Select an education option"),
  email: z.string().trim().email("Enter a valid email address"),
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(100),
  gender: z.string().trim().min(1, "Select gender"),
  lastName: z.string().trim().max(100),
  organizationId: optionalNumericString("Select a valid organization"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d()\s-]{7,20}$/, "Enter a valid phone number"),
  rollNumber: z.string().trim().max(50).or(z.literal("")),
  sessionCourseIds: z.array(z.string()).min(1, "Select at least one course"),
  sessionId: z.string().trim().regex(/^\d+$/, "Select a session"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
