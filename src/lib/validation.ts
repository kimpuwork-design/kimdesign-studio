import { z } from "zod";

// ───────────────────────── Auth ─────────────────────────
export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(72),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

// ───────────────────── Public contact ─────────────────────
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(2000, "Message must be under 2000 characters"),
});

// ─────────────────────── Project ───────────────────────
export const projectSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  description: z.string().max(5000).optional().or(z.literal("")),
  status: z.enum(["inquiry", "active", "review", "delivered", "archived"]),
  location: z.string().max(150).optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
  target_date: z.string().optional().or(z.literal("")),
  slug: z.string().trim().regex(/^[a-z0-9-]*$/, "Slug can only contain lowercase letters, numbers and dashes").max(120).optional().or(z.literal("")),
  summary: z.string().max(500).optional().or(z.literal("")),
  content: z.string().max(20000).optional().or(z.literal("")),
  year: z
    .string()
    .optional()
    .refine((v) => !v || (/^\d{4}$/.test(v) && +v >= 1900 && +v <= 2100), {
      message: "Year must be between 1900 and 2100",
    }),
  thumbnail_url: z.string().url("Thumbnail must be a valid URL").max(2000).optional().or(z.literal("")),
});

// ─────────────────────── Invoice ───────────────────────
export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required").max(500),
  qty: z.number().positive("Quantity must be greater than 0"),
  unit_price: z.number().min(0, "Unit price cannot be negative"),
});

export const invoiceSchema = z.object({
  project_id: z.string().uuid("Select a project"),
  currency: z.string().length(3, "Currency must be a 3-letter code"),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});

// ─────────────────────── Lead ───────────────────────
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

// ─────────────────────── File upload ───────────────────────
export const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB

export function validateFile(file: File, allowedExtensions: string[]) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedExtensions.includes(ext)) {
    return `File type .${ext || "unknown"} is not allowed`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `File is larger than 200MB`;
  }
  if (file.size === 0) {
    return `File is empty`;
  }
  return null;
}

// Helper to convert zod error to flat field-error map
export function zodFieldErrors<T>(result: z.SafeParseReturnType<unknown, T>): Record<string, string> {
  const out: Record<string, string> = {};
  if (result.success) return out;
  for (const err of result.error.errors) {
    const key = err.path.join(".") || "_";
    if (!out[key]) out[key] = err.message;
  }
  return out;
}
