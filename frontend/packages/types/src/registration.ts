import type { PaginatedData } from "./api";

export type RegistrationPageStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type RegistrationFieldType = "TEXT" | "SELECT" | "RADIO" | "TEXTAREA";

export interface RegistrationFieldOption {
  id?: number;
  uuid?: string;
  optionKey: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface RegistrationField {
  id?: number;
  uuid?: string;
  fieldKey: string;
  label: string;
  fieldType: RegistrationFieldType;
  isRequired: boolean;
  placeholder: string | null;
  helpText: string | null;
  sortOrder: number;
  isActive: boolean;
  options: RegistrationFieldOption[];
}

export interface RegistrationCourseOption {
  id?: number;
  uuid: string;
  name: string;
  courseCode?: string;
  description?: string | null;
}

export interface RegistrationMasterOption {
  id: number;
  uuid: string;
  organizationId: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicRegistrationMasterOption {
  uuid: string;
  name: string;
}

export type RegistrationMasterOptionList =
  PaginatedData<RegistrationMasterOption>;

export interface RegistrationMasterOptionQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateRegistrationMasterOptionRequest {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateRegistrationMasterOptionRequest {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface PublicRegistrationPage {
  organization: {
    name: string;
    logo: string | null;
    email: string | null;
    phone: string | null;
  };
  registration: {
    slug: string;
    title: string;
    description: string | null;
    primaryColor: string;
    accentColor: string;
    heroImage: string | null;
    submitButtonText: string;
    successTitle: string;
    successMessage: string;
    registrationEnabled: boolean;
  };
  fields: RegistrationField[];
  educationOptions: PublicRegistrationMasterOption[];
  digitalLibraryLocations: PublicRegistrationMasterOption[];
  courses: RegistrationCourseOption[];
  session: {
    name: string;
  };
}

export interface AdminRegistrationPage {
  id: number;
  uuid: string;
  organizationId: number;
  sessionId: number;
  slug: string;
  title: string;
  description: string | null;
  logoOverride: string | null;
  heroImage: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  submitButtonText: string;
  successTitle: string;
  successMessage: string | null;
  registrationEnabled: boolean;
  status: RegistrationPageStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: number;
    name: string;
    code: string;
    logo: string | null;
  };
  session: {
    id: number;
    name: string;
    code: string | null;
    status: string;
  };
  fields: RegistrationField[];
  selectedSessionCourseUuids: string[];
  selectedEducationOptionUuids: string[];
  selectedDigitalLibraryLocationUuids: string[];
  courses: RegistrationCourseOption[];
}

export type AdminRegistrationPageList = PaginatedData<AdminRegistrationPage>;

export interface RegistrationFieldPayload {
  fieldKey: string;
  label: string;
  fieldType: RegistrationFieldType;
  isRequired?: boolean;
  placeholder?: string;
  helpText?: string;
  sortOrder?: number;
  isActive?: boolean;
  options?: Array<{
    optionKey: string;
    label: string;
    sortOrder?: number;
    isActive?: boolean;
  }>;
}

export interface CreateRegistrationPageRequest {
  sessionId: number;
  slug: string;
  title?: string;
  description?: string;
  logoOverride?: string;
  heroImage?: string;
  primaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  supportPhone?: string;
  submitButtonText?: string;
  successTitle?: string;
  successMessage?: string;
  registrationEnabled?: boolean;
  status?: RegistrationPageStatus;
  fields?: RegistrationFieldPayload[];
  selectedSessionCourseUuids?: string[];
  selectedEducationOptionUuids?: string[];
  selectedDigitalLibraryLocationUuids?: string[];
}

export interface UpdateRegistrationPageRequest extends Partial<CreateRegistrationPageRequest> {
  isActive?: boolean;
}

export interface PublicRegistrationSubmitRequest {
  firstName: string;
  lastName?: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email?: string;
  educationOptionUuid: string;
  digitalLibraryLocationUuid: string;
  customAnswers?: Record<string, string>;
  selectedSessionCourseUuids: string[];
}

export interface PublicRegistrationSubmitResponse {
  successTitle: string;
  successMessage: string;
  student: {
    uuid: string;
    firstName: string;
    lastName: string | null;
  };
  organization: {
    name: string;
  };
  session: {
    name: string;
  };
  selectedCourses: Array<{
    uuid: string;
    name: string;
  }>;
  loginAvailable: boolean;
}
