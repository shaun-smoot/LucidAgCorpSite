import process from "node:process";

// Server-only Slack delivery for Twilio status callbacks. The .server.ts suffix
// keeps this (and the webhook URL) out of the client bundle. The URL is read
// from process.env at call time — provide it as the container env var
// SLACK_WEBHOOK_URL.
//
// For now this reuses the same webhook as the consultation form, which posts to
// the #request-a-consultation channel. When a dedicated channel exists, point a
// separate webhook at it and read that variable here instead.

export type SlackDeliveryResult = "sent" | "not_configured" | "failed";

// Optional shared-secret guard. When TWILIO_STATUS_CALLBACK_TOKEN is set, the
// callback URL must include a matching `?token=` query param; otherwise any
// caller could post to the Slack channel. When unset, the endpoint is open
// (fine for quick start / testing).
export function isStatusCallbackAuthorized(token: string | null): boolean {
  const expected = process.env.TWILIO_STATUS_CALLBACK_TOKEN;
  if (!expected) return true;
  return token === expected;
}

export async function sendTwilioStatusToSlack(
  params: Record<string, string>,
): Promise<SlackDeliveryResult> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return "not_configured";

  // Twilio sends SMS (Message*/Sms*) or Voice (Call*) status fields depending on
  // the resource. Pull the common ones for a readable summary; the rest are
  // still available in the raw payload that Twilio logged.
  const sid = params.MessageSid ?? params.SmsSid ?? params.CallSid ?? "—";
  const status =
    params.MessageStatus ?? params.SmsStatus ?? params.CallStatus ?? "—";
  const to = params.To ?? "—";
  const from = params.From ?? "—";
  const errorCode = params.ErrorCode;
  const errorMessage = params.ErrorMessage;

  const lines = [
    `*SID:* ${sid}`,
    `*Status:* ${status}`,
    `*To:* ${to}`,
    `*From:* ${from}`,
    errorCode ? `*Error code:* ${errorCode}` : null,
    errorMessage ? `*Error:* ${errorMessage}` : null,
  ].filter(Boolean) as string[];

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "Twilio status callback", emoji: true },
    },
    {
      type: "section",
      fields: lines.map((text) => ({ type: "mrkdwn", text })),
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `Received ${new Date().toUTCString()} · lucidag.com` },
      ],
    },
  ];

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: `Twilio status: ${status} (${sid})`,
        blocks,
      }),
    });
    if (!res.ok) {
      console.error(
        `[twilio-status] Slack webhook returned ${res.status}: ${await res.text()}`,
      );
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[twilio-status] Slack webhook request failed", error);
    return "failed";
  }
}
