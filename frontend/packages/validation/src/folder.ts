import { z } from "zod/v4";

export const folderSchema = z.object({
  color: z
    .string()
    .trim()
    .regex(/^#?[0-9a-f]{3,8}$/iu, "Color must be a valid hex color")
    .or(z.literal("")),
  description: z.string().trim().max(2000),
  icon: z.string().trim().max(80),
  name: z.string().trim().min(1, "Folder name is required").max(150),
  parentFolderId: z.string().trim().refine((value) => value === "" || /^\d+$/.test(value), "Select a valid parent folder"),
  sortOrder: z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 0, "Sort order must be a non-negative whole number"),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

export type FolderFormValues = z.infer<typeof folderSchema>;
