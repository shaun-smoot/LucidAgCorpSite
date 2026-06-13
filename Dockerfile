# syntax=docker/dockerfile:1.7

# ---- Build stage ----------------------------------------------------------
FROM oven/bun:1 AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY package.json bun.lockb* bunfig.toml* ./
RUN bun install --frozen-lockfile || bun install

# Copy the rest of the source
COPY . .

# Build for a standalone Node server (overrides the default Cloudflare preset).
# Nitro's node-server preset emits dist/server/index.mjs + dist/client/.
ENV NITRO_PRESET=node-server
RUN bun run build


# ---- Runtime stage --------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=9000 \
    HOST=0.0.0.0

# Copy the built server + client assets
COPY --from=build /app/dist ./dist

EXPOSE 9000

# Nitro's node-server preset entry
CMD ["node", "dist/server/index.mjs"]
