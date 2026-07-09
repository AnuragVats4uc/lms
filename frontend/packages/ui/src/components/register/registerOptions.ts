import { registerClassOptions } from "../../validation/auth/register.schema";

export interface RegisterOption {
  label: string;
  value: string;
}

export const studentClassOptions: RegisterOption[] =
  registerClassOptions.map((value) => ({
    label: value,
    value,
  }));

export const stateOptions: RegisterOption[] = [
  { label: "Delhi", value: "Delhi" },
  { label: "Haryana", value: "Haryana" },
  { label: "Maharashtra", value: "Maharashtra" },
  { label: "Rajasthan", value: "Rajasthan" },
  { label: "Uttar Pradesh", value: "Uttar Pradesh" },
];

export const cityOptionsByState: Record<
  string,
  RegisterOption[]
> = {
  Delhi: [
    { label: "New Delhi", value: "New Delhi" },
    { label: "Dwarka", value: "Dwarka" },
    { label: "Rohini", value: "Rohini" },
  ],
  Haryana: [
    { label: "Faridabad", value: "Faridabad" },
    { label: "Gurugram", value: "Gurugram" },
    { label: "Hisar", value: "Hisar" },
  ],
  Maharashtra: [
    { label: "Mumbai", value: "Mumbai" },
    { label: "Nagpur", value: "Nagpur" },
    { label: "Pune", value: "Pune" },
  ],
  Rajasthan: [
    { label: "Jaipur", value: "Jaipur" },
    { label: "Jodhpur", value: "Jodhpur" },
    { label: "Udaipur", value: "Udaipur" },
  ],
  "Uttar Pradesh": [
    { label: "Agra", value: "Agra" },
    { label: "Lucknow", value: "Lucknow" },
    { label: "Noida", value: "Noida" },
  ],
};
