# Deploying Lucid AG with Docker

This app is a TanStack Start (Vite + React 19) project. The Dockerfile builds
it with Nitro's `node-server` preset and runs it as a standalone Node server.

## Prerequisites

- Docker 20.10+ (or Docker Desktop / Podman)
- A server with at least 512 MB RAM
- A reverse proxy (Nginx, Caddy, Traefik) in front for TLS — recommended

## 1. Build the image

From the project root:

```bash
docker build -t lucid-ag:latest .
```

The build uses [Bun](https://bun.sh) for fast installs/build, then ships a
minimal `node:20-alpine` runtime image (~150 MB).

## 2. Run the container

```bash
docker run -d \
  --name lucid-ag \
  --restart unless-stopped \
  -p 3000:3000 \
  lucid-ag:latest
```

The site is now available at `http://<server-ip>:3000`.

### Environment variables

| Variable | Default       | Purpose                      |
| -------- | ------------- | ---------------------------- |
| `PORT`   | `3000`        | Port the server listens on   |
| `HOST`   | `0.0.0.0`     | Bind address                 |
| `NODE_ENV` | `production`| Runtime mode                 |

Pass with `-e`, e.g. `-e PORT=8080 -p 8080:8080`.

## 3. docker-compose (optional)

```yaml
services:
  web:
    build: .
    image: lucid-ag:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
```

Then: `docker compose up -d --build`

## 4. Reverse proxy with TLS (Nginx example)

```nginx
server {
  listen 443 ssl http2;
  server_name lucidag.com www.lucidag.com;

  ssl_certificate     /etc/letsencrypt/live/lucidag.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/lucidag.com/privkey.pem;

  location / {
    proxy_pass         http://127.0.0.1:3000;
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
  reverse_proxy 127.0.0.1:3000
}
```

## 5. Updating

```bash
git pull
docker build -t lucid-ag:latest .
docker stop lucid-ag && docker rm lucid-ag
docker run -d --name lucid-ag --restart unless-stopped -p 3000:3000 lucid-ag:latest
```

Or with compose: `docker compose up -d --build`.

## 6. Running without Docker

If you'd rather run directly on the host:

```bash
bun install
NITRO_PRESET=node-server bun run build
node dist/server/index.mjs
```

Use `pm2`, `systemd`, or similar to keep it alive.

## Notes

- The default build preset in `vite.config.ts` targets Cloudflare Workers.
  Setting `NITRO_PRESET=node-server` at build time switches Nitro to emit a
  standalone Node server bundle at `dist/server/index.mjs` (with static
  client assets in `dist/client/`) — that's what the Dockerfile copies and
  runs.
- No database or secrets are required for the current site. If you add
  Lovable Cloud features later, pass the relevant `*_URL` / `*_KEY` values
  as container env vars.
