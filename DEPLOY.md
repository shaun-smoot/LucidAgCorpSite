# Deploying Lucid AG

This app is a TanStack Start (Vite + React 19) project. The Dockerfile builds
it with Nitro's `node-server` preset and runs it as a standalone Node server.

**Production** runs on **Azure Container Apps (ACA)**, serving `https://lucidag.com`
from an image hosted in **Azure Container Registry (`acrluci`)**. The end-to-end
flow is: build the image (§1) → push to ACR (§2) → deploy/update on ACA (§3).
Sections 4–8 cover running the same image self-hosted with Docker.

| Resource | Value |
| -------- | ----- |
| Registry | `acrluci.azurecr.io` |
| Image | `acrluci.azurecr.io/lucid-ag-corpsite:latest` |
| ACA environment | `aca-lucidag-prod` (West US 2) |
| Container app | `lucid-ag-corpsite` |
| Resource group | `rg-lucidag-corp` |
| Public URL | `https://lucidag.com` |

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (`az`) with
  the `containerapp` extension — for the ACR + ACA production path (§1–3)
- Docker 20.10+ (or Docker Desktop / Podman) — for building/running locally
- For self-hosting (§4–8): a server with ≥512 MB RAM and a reverse proxy for TLS

## 1. Build the image

From the project root:

```bash
docker build -t lucid-ag-corpsite:latest .
```

The build uses [Bun](https://bun.sh) for fast installs/build, then ships a
minimal `node:20-alpine` runtime image (~150 MB).

## 2. Push to Azure Container Registry (ACR)

After building `latest` locally, tag it for the registry and push it to
`acrluci.azurecr.io`.

```bash
# Authenticate to the registry (uses your az login; or `docker login acrluci.azurecr.io`)
az acr login --name acrluci

# Tag the local image for the registry
docker tag lucid-ag-corpsite:latest acrluci.azurecr.io/lucid-ag-corpsite:latest

# Push
docker push acrluci.azurecr.io/lucid-ag-corpsite:latest
```

> Requires the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
> (`az`) and `Docker`. `az acr login` brokers a short-lived token to the Docker
> daemon, so no registry password is stored. Alternatively, log in directly with
> `docker login acrluci.azurecr.io`.

> **Building for ACA (amd64) — recommended.** Azure Container Apps requires
> `linux/amd64`. On an Apple Silicon / ARM machine a local `docker build` produces
> `arm64`, which ACA rejects (`image OS/Arc must be linux/amd64`). Build amd64 in
> the cloud with a single command (no local Docker needed) — it builds in ACR and
> pushes `:latest` in one step:
>
> ```bash
> az acr build --registry acrluci --platform linux/amd64 \
>   --image lucid-ag-corpsite:latest .
> ```
>
> Prefer this over the local build/tag/push above for the ACA workflow.

## 3. Deploy to Azure Container Apps (ACA)

Production runs on Azure Container Apps, pulling the image from ACR. ACA runs
`linux/amd64`, so make sure the image you push is built for that platform — e.g.
`az acr build --platform linux/amd64 -r acrluci -t lucid-ag-corpsite:latest .`
(builds amd64 in Azure) or `docker build --platform linux/amd64 ...` locally.

### Create the environment (one-time)

```bash
az containerapp env create \
  --name aca-lucidag-prod \
  --resource-group rg-lucidag-corp \
  --location westus2
```

### Create the container app

```bash
az containerapp create \
  --name lucid-ag-corpsite \
  --resource-group rg-lucidag-corp \
  --environment aca-lucidag-prod \
  --image acrluci.azurecr.io/lucid-ag-corpsite:latest \
  --registry-server acrluci.azurecr.io \
  --registry-identity system \
  --ingress external \
  --target-port 9000 \
  --cpu 0.5 --memory 1.0Gi \
  --min-replicas 1 --max-replicas 3 \
  --secrets slack-webhook-url="https://hooks.slack.com/services/XXX/YYY/ZZZ" \
  --env-vars NODE_ENV=production SLACK_WEBHOOK_URL=secretref:slack-webhook-url
```

`--ingress external --target-port 9000` publishes the app on HTTPS — ACA
terminates TLS and provides a `*.azurecontainerapps.io` URL, so no separate
reverse proxy is required. The Slack webhook is stored as an ACA **secret** and
referenced by the env var, so it never appears in plain config.

Get the public URL:

```bash
az containerapp show \
  --name lucid-ag-corpsite \
  --resource-group rg-lucidag-corp \
  --query properties.configuration.ingress.fqdn -o tsv
```

### Custom domain & TLS (lucidag.com)

Production serves `https://lucidag.com` with a **free, auto-renewing ACA-managed
certificate**; ACA terminates TLS at ingress (no reverse proxy needed).

1. **DNS** — at the registrar, point the apex at the environment's static IP and
   add the ownership-verification TXT record. The apex (`lucidag.com`) must use an
   `A` record — it cannot be a CNAME.

   | Type | Name | Value |
   | ---- | ---- | ----- |
   | `A` | `@` (`lucidag.com`) | environment static IP (e.g. `4.149.92.151`) |
   | `TXT` | `asuid` (`asuid.lucidag.com`) | the app's `customDomainVerificationId` |

   Look up the current values (they differ per environment/app):

   ```bash
   az containerapp env show -n aca-lucidag-prod -g rg-lucidag-corp \
     --query properties.staticIp -o tsv
   az containerapp show -n lucid-ag-corpsite -g rg-lucidag-corp \
     --query properties.customDomainVerificationId -o tsv
   ```

   For a `www` subdomain instead, use `CNAME www → <app FQDN>` plus `TXT asuid.www`.

2. **Bind the hostname and issue the managed cert** (once DNS has propagated):

   ```bash
   az containerapp hostname add \
     --hostname lucidag.com \
     --name lucid-ag-corpsite \
     --resource-group rg-lucidag-corp

   az containerapp hostname bind \
     --hostname lucidag.com \
     --name lucid-ag-corpsite \
     --resource-group rg-lucidag-corp \
     --environment aca-lucidag-prod \
     --validation-method HTTP
   ```

   `hostname bind` with no `--certificate` provisions the free managed certificate.
   Use `--validation-method HTTP` for the apex `A`-record domain; use `CNAME` for a
   `www` subdomain. Cert issuance takes a few minutes; if `bind` reports a
   validation error, the `asuid`/`A` records haven't propagated — wait and re-run
   `bind` (`add` only needs to run once).

3. **Verify:**

   ```bash
   az containerapp hostname list -n lucid-ag-corpsite -g rg-lucidag-corp -o table
   curl -I https://lucidag.com
   ```

### Update (deploy a new image)

After pushing a fresh `:latest` to ACR (section 2), roll the app with a new
revision suffix:

```bash
az containerapp update \
  --name lucid-ag-corpsite \
  --resource-group rg-lucidag-corp \
  --image acrluci.azurecr.io/lucid-ag-corpsite:latest \
  --revision-suffix v$(date +%Y%m%d%H%M%S)
```

> **Always change the revision suffix when reusing `:latest`.** ACA only rolls a
> new revision when the container template changes. Because the image string
> (`...:latest`) stays the same across deploys, `az containerapp update --image`
> **on its own is a no-op** — ACA keeps running the old revision (and the old
> image digest) even though `az acr build` pushed a new `:latest`. The result is
> a "successful" update that serves stale code. Adding a unique
> `--revision-suffix` (e.g. a timestamp) forces a new revision, which re-resolves
> `:latest` to the newest digest and actually deploys your changes.
>
> Verify the new revision is active and serving the new image:
>
> ```bash
> az containerapp revision list -n lucid-ag-corpsite -g rg-lucidag-corp \
>   --query "[].{name:name, active:properties.active, running:properties.runningState, image:properties.template.containers[0].image, created:properties.createdTime}" \
>   -o table
> ```

> **Registry pull auth.** `--registry-identity system` creates a system-assigned
> managed identity for the app and grants it the `AcrPull` role on `acrluci` (the
> recommended, password-less path used in production). It requires you to have
> role-assignment rights on the registry. If that's restricted and the ACR has the
> admin user enabled, drop `--registry-identity` and pass `--registry-username` /
> `--registry-password` instead.

The Docker sections below (4–8) remain valid for running the same image
self-hosted outside Azure.

## 4. Run the container

```bash
docker run -d \
  --name lucid-ag-corpsite \
  --restart unless-stopped \
  -p 9000:9000 \
  -e SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXX/YYY/ZZZ" \
  acrluci.azurecr.io/lucid-ag-corpsite:latest
```

The site is now available at `http://<server-ip>:9000`.

### Environment variables

| Variable | Default       | Purpose                                          |
| -------- | ------------- | ------------------------------------------------ |
| `PORT`   | `9000`        | Port the server listens on                       |
| `HOST`   | `0.0.0.0`     | Bind address                                     |
| `NODE_ENV` | `production`| Runtime mode                                     |
| `SLACK_WEBHOOK_URL` | _(unset)_ | Slack incoming webhook for consultation requests + Twilio status callbacks |
| `TWILIO_STATUS_CALLBACK_TOKEN` | _(unset)_ | Optional shared secret guarding the Twilio status callback endpoint (see below) |

Pass with `-e`, e.g. `-e PORT=8080 -p 8080:8080`.

> **Consultation form delivery.** Submissions from the “Request a consultation”
> form are posted to Slack via an [incoming webhook](https://api.slack.com/messaging/webhooks).
> Create the webhook for your channel (e.g. _#request-a-consultation_) and pass
> its URL as `SLACK_WEBHOOK_URL`. If the variable is unset, submissions still
> succeed and are logged to the container output but are **not** sent to Slack.
> Treat the webhook URL as a secret — never commit it to the repo.

### Creating the Slack webhook

1. In Slack, create the channel (e.g. `request-a-consultation`).
2. Go to **https://api.slack.com/apps** → **Create New App** → **From scratch**;
   name it (e.g. `Lucid AG Website`) and pick your workspace.
3. Open **Features → Incoming Webhooks** and toggle it **On**.
4. Click **Add New Webhook to Workspace**, choose the channel, and **Allow**.
5. Copy the generated URL — it looks like
   `https://hooks.slack.com/services/T000/B000/XXXX`. Keep it secret.

Optional test before deploying:

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from Lucid AG website setup"}' \
  "$SLACK_WEBHOOK_URL"
```

### Verifying delivery after deploy

Submit the form on the live site (or POST a test payload), then watch the
container logs and your Slack channel:

```bash
docker logs -f lucid-ag-corpsite
```

A successful submission posts a "New consultation request" message to the
channel. If you see `Slack webhook returned 4xx/5xx` in the logs, re-check the
`SLACK_WEBHOOK_URL` value.

### Twilio status callback endpoint

The app exposes a webhook for [Twilio status callbacks](https://www.twilio.com/docs/messaging/guides/track-outbound-message-status)
at:

```
https://lucidag.com/twilio-status-callback
```

Configure that URL as the **Status callback URL** on your Twilio Messaging
Service / phone number. Twilio `POST`s delivery status updates (form-urlencoded);
the endpoint forwards a summary (SID, status, To/From, error code/message) to
Slack. It reuses `SLACK_WEBHOOK_URL`, so updates currently land in the same
_#request-a-consultation_ channel as the consultation form.

- **`GET`** returns a plain-text health check (`200`) for browser/uptime probes —
  it does **not** post to Slack.
- **`POST`** is what Twilio calls; it always returns `204` (logging any Slack
  error) so Twilio doesn't retry-storm on a transient Slack hiccup.

> **Securing the endpoint (optional but recommended).** The URL is publicly
> reachable, so anyone could `POST` to it and post into Slack. Set
> `TWILIO_STATUS_CALLBACK_TOKEN` to a random secret and append it to the callback
> URL as a query param — `https://lucidag.com/twilio-status-callback?token=<secret>`.
> Requests with a missing/incorrect token get `401`. If the variable is unset the
> endpoint is open (fine for initial testing). On ACA, store it as a secret and
> reference it from the env var, e.g.:
>
> ```bash
> az containerapp update \
>   --name lucid-ag-corpsite \
>   --resource-group rg-lucidag-corp \
>   --secrets twilio-status-token="<random-secret>" \
>   --set-env-vars TWILIO_STATUS_CALLBACK_TOKEN=secretref:twilio-status-token
> ```

## 5. docker-compose (optional)

```yaml
services:
  web:
    build: .
    image: acrluci.azurecr.io/lucid-ag-corpsite:latest
    restart: unless-stopped
    ports:
      - "9000:9000"
    environment:
      NODE_ENV: production
      SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/XXX/YYY/ZZZ"
```

Then: `docker compose up -d --build`

## 6. Reverse proxy with TLS (Nginx example)

```nginx
server {
  listen 443 ssl http2;
  server_name lucidag.com www.lucidag.com;

  ssl_certificate     /etc/letsencrypt/live/lucidag.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/lucidag.com/privkey.pem;

  location / {
    proxy_pass         http://127.0.0.1:9000;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_set_header   Upgrade           $http_upgrade;
    proxy_set_header   Connection        "upgrade";
  }
}

server {
  listen 80;
  server_name lucidag.com www.lucidag.com;
  return 301 https://$host$request_uri;
}
```

Caddy is even simpler — a one-liner Caddyfile:

```caddy
lucidag.com {
  reverse_proxy 127.0.0.1:9000
}
```

## 7. Updating

```bash
git pull
docker build -t lucid-ag-corpsite:latest .
docker tag lucid-ag-corpsite:latest acrluci.azurecr.io/lucid-ag-corpsite:latest
docker push acrluci.azurecr.io/lucid-ag-corpsite:latest
docker stop lucid-ag-corpsite && docker rm lucid-ag-corpsite
docker run -d --name lucid-ag-corpsite --restart unless-stopped -p 9000:9000 -e SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXX/YYY/ZZZ" acrluci.azurecr.io/lucid-ag-corpsite:latest
```

Or with compose: `docker compose up -d --build`.

## 8. Running without Docker

If you'd rather run directly on the host:

```bash
bun install
NITRO_PRESET=node-server bun run build
node dist/server/index.mjs
```

Use `pm2`, `systemd`, or similar to keep it alive.

## Codebase orientation (for future changes)

This is a marketing/corporate site, not an app with a database. It's a
**TanStack Start** project (file-based routing + server functions) built with
**Vite 7 + React 19**, styled with **Tailwind CSS v4** and **shadcn/ui** (Radix)
components. Package manager is **Bun**; forms use **react-hook-form + Zod**.

### Where things live

| Area | Path | Notes |
| ---- | ---- | ----- |
| Routes (pages + API) | `src/routes/` | File-based. `index.tsx` = `/`. See [src/routes/README.md](src/routes/README.md) for naming rules. |
| App shell / layout | [src/routes/__root.tsx](src/routes/__root.tsx) | Wraps every page; holds 404 + error boundaries, `<head>`, query client. Keep `<Outlet />`. |
| Home page content | [src/routes/index.tsx](src/routes/index.tsx) | Hero, capabilities grid, ecosystems, CTA. Page copy/capability tiles are defined as arrays at the top of this file. |
| Server functions | `src/lib/api/*.functions.ts` | `createServerFn(...)` handlers — run server-only, tree-shaken from the client bundle. |
| Server-only helpers/secrets | `src/lib/api/*.server.ts`, [src/lib/config.server.ts](src/lib/config.server.ts) | The `.server.ts` suffix keeps code (and secrets like the Slack URL) out of the client bundle. |
| Shared validation schemas | `src/lib/api/*.schema.ts` | Zod schemas imported by both the client form and the server validator. |
| UI primitives | `src/components/ui/` | shadcn/ui components — generated; prefer composing over editing. |
| Generated route tree | [src/routeTree.gen.ts](src/routeTree.gen.ts) | Auto-generated by the router plugin. **Never edit by hand**; it regenerates on `dev`/`build`. |
| SSR entry / error wrapping | [src/server.ts](src/server.ts) | Custom server entry that normalizes catastrophic SSR errors into a friendly page. |

### Key conventions & gotchas

- **Routing is file-based.** Add a page by creating a `.tsx` file in
  `src/routes/`; add an API/webhook by exporting `server.handlers` from a route
  file (see [src/routes/twilio-status-callback.ts](src/routes/twilio-status-callback.ts)).
  Don't create `src/pages/` or `app/` (Next.js/Remix conventions don't apply).
- **`@/` is the path alias** for `src/` (e.g. `@/components/...`,
  `@/lib/api/...`).
- **Env vars:** read `process.env.*` **inside** a function/handler, never at
  module scope — on Cloudflare Workers env binds per-request. Server secrets go
  in `.server.ts` files; only `VITE_`-prefixed vars are safe for the client. See
  the comments in [src/lib/config.server.ts](src/lib/config.server.ts).
- **Two Nitro targets from one source.** Default build targets Cloudflare
  Workers (Lovable sandbox); `NITRO_PRESET=node-server bun run build` emits the
  standalone Node server the Dockerfile runs (see [vite.config.ts](vite.config.ts)
  and the Notes below). Don't add `tanstackStart`/`viteReact`/`tailwindcss`/
  `nitro` plugins manually — `@lovable.dev/vite-tanstack-config` already includes
  them, and duplicates break the build.
- **Forms:** validation rules live once in a Zod schema (e.g.
  [src/lib/api/consultation.schema.ts](src/lib/api/consultation.schema.ts)),
  shared by the react-hook-form resolver and the server function validator.

### Common tasks

- **Edit site copy/sections:** [src/routes/index.tsx](src/routes/index.tsx)
  (most text is in the `capabilities` / `ecosystems` arrays at the top).
- **Change the consultation form fields:** update the Zod schema
  [src/lib/api/consultation.schema.ts](src/lib/api/consultation.schema.ts), the
  form UI [src/components/consultation-dialog.tsx](src/components/consultation-dialog.tsx),
  and the Slack formatter [src/lib/api/consultation.slack.server.ts](src/lib/api/consultation.slack.server.ts).
- **Add a backend integration / webhook:** add a server function under
  `src/lib/api/` (with a `.server.ts` helper for any secret), and/or a route with
  `server.handlers` for an inbound webhook. Wire new secrets through ACA secrets +
  env vars (§3) and document them in the env-var table (§4).
- **Local dev:** `bun install && bun run dev`. Lint with `bun run lint`,
  format with `bun run format`.

> **Deploy reminder.** After merging changes, redeploy by rebuilding the amd64
> image into ACR and rolling a new ACA revision **with a fresh `--revision-suffix`**
> (§2–3). Reusing `:latest` without a new suffix serves stale code.

## Notes

- The default build preset in `vite.config.ts` targets Cloudflare Workers.
  Setting `NITRO_PRESET=node-server` at build time switches Nitro to emit a
  standalone Node server bundle at `dist/server/index.mjs` (with static
  client assets in `dist/client/`) — that's what the Dockerfile copies and
  runs.
- No database or secrets are required for the current site. If you add
  Lovable Cloud features later, pass the relevant `*_URL` / `*_KEY` values
  as container env vars.
- The consultation form posts to Slack through `SLACK_WEBHOOK_URL` (an incoming
  webhook). It is optional for the site to boot, but required for form
  submissions to reach your Slack channel. Keep the URL out of version control.
