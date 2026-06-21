import { createServerFn } from "@tanstack/react-start";

import { consultationSchema } from "./consultation.schema";

// Server handler for consultation requests. Runs server-only — the handler body
// and its server imports are tree-shaken from the client bundle.
//
// Delivery is intentionally pluggable: today it validates and logs the request
// server-side. To route submissions to an inbox or CRM, send `data` to an email
// API (Resend, Postmark), a webhook, or a database inside the handler below.
export const submitConsultation = createServerFn({ method: "POST" })
  .inputValidator(consultationSchema)
  .handler(async ({ data }) => {
    console.info("[consultation] new request", {
      name: data.name,
      email: data.email,
      company: data.company,
      role: data.role || undefined,
      interest: data.interest,
      receivedAt: new Date().toISOString(),
    });

    return { ok: true as const };
  });
