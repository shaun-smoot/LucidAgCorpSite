import process from "node:process";

import type { ConsultationInput } from "./consultation.schema";

// Server-only Slack delivery. The .server.ts suffix keeps this out of the
// client bundle, so the webhook URL never reaches the browser. The URL is read
// from process.env at call time (per-request) — provide it as the container env
// var SLACK_WEBHOOK_URL.

export type SlackDeliveryResult = "sent" | "not_configured" | "failed";

export async function sendConsultationToSlack(
  data: ConsultationInput,
): Promise<SlackDeliveryResult> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return "not_configured";

  const lines = [
    `*Name:* ${data.name}`,
    `*Email:* ${data.email}`,
    `*Company:* ${data.company}`,
    data.role ? `*Role:* ${data.role}` : null,
    data.phone ? `*Phone:* ${data.phone}` : null,
    data.interest ? `*Interest:* ${data.interest}` : null,
  ].filter(Boolean) as string[];

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "New consultation request", emoji: true },
    },
    {
      type: "section",
      fields: lines.map((text) => ({ type: "mrkdwn", text })),
    },
  ];

  if (data.message) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Message:*\n${data.message}` },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      { type: "mrkdwn", text: `Received ${new Date().toUTCString()} · lucidag.com` },
    ],
  });

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: `New consultation request from ${data.name} (${data.company})`,
        blocks,
      }),
    });
    if (!res.ok) {
      console.error(`[consultation] Slack webhook returned ${res.status}: ${await res.text()}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[consultation] Slack webhook request failed", error);
    return "failed";
  }
}
