export interface AddOrganizationFormState {
  address: string;
  code: string;
  description: string;
  email: string;
  name: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  website: string;
}
