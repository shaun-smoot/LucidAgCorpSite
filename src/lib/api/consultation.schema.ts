import { z } from "zod";

// Shared schema for the "Request a consultation" form. Imported by both the
// client form (react-hook-form resolver) and the server function validator so
// validation rules stay in one place.

export const interestAreas = [
  "AI Strategy",
  "Enterprise AI Integration",
  "Operations Intelligence",
  "Governance & Assurance",
  "Workforce Enablement",
  "Not sure yet",
] as const;

export const consultationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Please enter a valid email address."),
  company: z.string().trim().min(2, "Please enter your company."),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  interest: z.enum(interestAreas).optional(),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ConsultationInput = z.infer<typeof consultationSchema>;
