import { createServerFn } from "@tanstack/react-start";

import { consultationSchema } from "./consultation.schema";
import { sendConsultationToSlack } from "./consultation.slack.server";

// Server handler for consultation requests. Runs server-only — the handler body
// and its server imports (including the .server.ts Slack helper) are tree-shaken
// from the client bundle.
//
// Delivery: submissions are posted to a Slack channel via an incoming webhook
// (set SLACK_WEBHOOK_URL). If the webhook isn't configured we still succeed and
// log the request; if Slack is configured but the request fails, we surface an
// error so the form can show its fallback (email office@lucidag.com).
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

    const delivery = await sendConsultationToSlack(data);
    if (delivery === "failed") {
      throw new Error("Failed to deliver consultation request to Slack.");
    }

    return { ok: true as const };
  });
