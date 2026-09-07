export type StudentLandingCardType = "SYSTEM_LMS" | "CUSTOM";

export interface StudentLandingCard {
  id: number;
  uuid: string;
  organizationId: number;
  type: StudentLandingCardType;
  systemKey: string | null;
  title: string;
  description: string;
  ctaLabel: string;
  destinationUrl: string;
  imageUrl: string | null;
  imageAlt: string | null;
  openInNewTab: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateStudentLandingCardRequest {
  title: string;
  description: string;
  ctaLabel: string;
  destinationUrl: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  openInNewTab?: boolean;
}

export interface UpdateStudentLandingCardRequest
  extends Partial<CreateStudentLandingCardRequest> {
  isActive?: boolean;
}
