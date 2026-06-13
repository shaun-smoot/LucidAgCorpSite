// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Allow overriding the Nitro preset at build time so the same source can target
// Cloudflare (default in the Lovable sandbox) or a standalone Node server (Docker).
// Example: `NITRO_PRESET=node-server bun run build`
const nitroPreset = process.env.NITRO_PRESET;

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Force-enable the nitro deploy plugin outside the Lovable sandbox so
  // `bun run build` always emits a deployable server bundle. When a preset is
  // provided (e.g. NITRO_PRESET=node-server for Docker), emit to ./dist so the
  // output path matches the sandbox build.
  nitro: nitroPreset
    ? {
        preset: nitroPreset,
        output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
      }
    : true,
});
