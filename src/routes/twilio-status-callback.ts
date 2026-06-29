import { createFileRoute } from "@tanstack/react-router";

import {
  isStatusCallbackAuthorized,
  sendTwilioStatusToSlack,
} from "@/lib/api/twilio-status.slack.server";

// Twilio status callback endpoint.
//
// Configure this URL as the Twilio "Status callback URL", e.g.
//   https://lucidag.com/twilio-status-callback
//
// Twilio POSTs status updates here as application/x-www-form-urlencoded; we
// forward a summary to Slack (#request-a-consultation for now) and return 204.
// A GET returns a plain-text health check so the endpoint can be verified in a
// browser without triggering a Slack message.
//
// Optional hardening: set TWILIO_STATUS_CALLBACK_TOKEN and append
// `?token=<value>` to the callback URL so arbitrary callers can't post to Slack.

async function parseTwilioParams(
  request: Request,
): Promise<Record<string, string>> {
  const params: Record<string, string> = {};
  const contentType = request.headers.get("content-type") ?? "";

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    for (const [key, value] of form.entries()) {
      params[key] = typeof value === "string" ? value : value.name;
    }
  } else if (contentType.includes("application/json")) {
    try {
      const json = (await request.json()) as Record<string, unknown>;
      for (const [key, value] of Object.entries(json)) {
        params[key] = String(value);
      }
    } catch {
      // Ignore a malformed body — we still return 204 so Twilio doesn't retry.
    }
  }

  return params;
}

export const Route = createFileRoute("/twilio-status-callback")({
  server: {
    handlers: {
      GET: () =>
        new Response("Twilio status callback endpoint is live.", {
          status: 200,
          headers: { "content-type": "text/plain; charset=utf-8" },
        }),

      POST: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token");
        if (!isStatusCallbackAuthorized(token)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const params = await parseTwilioParams(request);
        try {
          const result = await sendTwilioStatusToSlack(params);
          if (result === "failed") {
            console.error("[twilio-status] failed to deliver status to Slack");
          }
        } catch (error) {
          // A Slack hiccup must not fail Twilio's callback — log and 204 so
          // Twilio treats it as delivered and doesn't retry.
          console.error("[twilio-status] error handling callback", error);
        }

        // Twilio expects a 2xx; an empty 204 is the convention for callbacks.
        return new Response(null, { status: 204 });
      },
    },
  },
});
