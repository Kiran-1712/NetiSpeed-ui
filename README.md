# NetiSpeed UI

Two separate web apps for NetiSpeed, built with React 19, TypeScript and Vite, deployed as two
Firebase Hosting sites:

| Folder | What it is | Served at | Firebase site |
| --- | --- | --- | --- |
| `website/` | The marketing and legal website | `netispeed.in` | `netispeed-61369` |
| `web-app/` | The speed test and network diagnostics dashboard | `app.netispeed.in` | `netispeed-app` |
| `shared/` | Code both use: site facts, analytics, service list, Play Store link, logo | – | – |

Each app has its own `package.json`, `index.html`, Vite and TypeScript config, and `public/`. The repo
root is an npm workspace that installs both and holds the shared lint and Firebase config. Code in
`shared/` is imported as `@shared/...`.

### Website (`website/`)

| URL | Source |
| --- | --- |
| `/` | `src/pages/Home.tsx` |
| `/features`, `/about`, `/contact` | `src/pages/` |
| `/privacy-policy`, `/terms` | `src/pages/` |

Pages are prerendered to static HTML at build time (`scripts/prerender.mjs`), each with its own title,
description, canonical URL, Open Graph tags and JSON-LD, and then hydrated. Page metadata lives in
`src/pages.ts`, which also drives `sitemap.xml`. Old URLs are redirected: `/speed-test` and `/app` go to
`app.netispeed.in` (in `firebase.json`), and old hash links such as `/#/history` and `/#/privacy` are
handled in `src/main.tsx`.

### Web app (`web-app/`)

The dashboard, hash-routed (`#/history`, `#/tools`) and client-rendered. Its head tags are static in
`index.html`.

### Shared facts

Site-wide facts (both origins, contact email, Play Store URL, policy dates, website page paths) live in
`shared/site.ts`. Links from one app to the other use `WEBSITE_ORIGIN` / `APP_ORIGIN`, which point at
the production domains in builds and at the local dev servers in dev.

## Dashboard features

- **Dashboard** — download/upload throughput, latency and jitter measured against Cloudflare's
  speed test endpoints via [`@cloudflare/speedtest`](https://www.npmjs.com/package/@cloudflare/speedtest),
  with an animated gauge that scales its ceiling to the connection.
- **Network cards** — ISP, IPv4/IPv6 address, approximate geolocation on a Leaflet map, and the
  Cloudflare edge colo the test actually runs against.
- **History** — past results persisted to `localStorage`, with a derived quality rating.
- **Tools** — IP lookup, HTTP ping, DNS record lookup and an HTTP-based port reachability check.

## Getting started

```bash
npm install          # installs both apps (npm workspaces)
npm run dev          # both dev servers: website on :5173, web app on :5174
npm run dev:website  # just the website
npm run dev:app      # just the web app
npm run build        # builds website/dist (typecheck, client, SSR, prerender) and web-app/dist
npm run lint         # eslint over both apps and shared/
```

The dev ports are fixed (`strictPort`) because the two apps link to each other on them.

## External services

No API keys are required, but the app depends on these public endpoints at runtime:

| Service | Used for |
| --- | --- |
| `speed.cloudflare.com` (via `@cloudflare/speedtest`) | Throughput and latency measurement |
| `ipinfo.io` | ISP, city and coordinates (rate-limited without a token; cached per page load) |
| `api4.ipify.org` / `api6.ipify.org` | IPv4- and IPv6-only address resolution |
| `cloudflare.com/cdn-cgi/trace` | Which Cloudflare edge colo is serving the client |
| `dns.google` | DNS-over-HTTPS record lookups |
| `tile.openstreetmap.org` | Map tiles |

## Known browser limitations

These are limits of the web platform, not missing features — the UI hides or labels them rather
than displaying a substitute value:

- **Signal strength (dBm) is not readable from a browser.** The location card instead reports the
  Network Information API's connection estimate, and hides the indicator entirely on Safari and
  Firefox, where that API is unavailable.
- **The ping tool measures HTTPS round-trip time, not ICMP.** Raw sockets are unavailable, so
  timings include TLS and HTTP overhead.
- **The port checker infers reachability from an opaque HTTP request.** It cannot distinguish a
  closed port from one that simply doesn't speak HTTP, and plain-`http` probes are blocked
  outright when the page itself is served over HTTPS (reported as `INCONCLUSIVE`).
- **Geolocation is IP-derived**, so it reflects the ISP's registered location rather than the device.

## Deployment

Firebase Hosting, one project with two sites, configured as hosting targets in `firebase.json` and
`.firebaserc`:

- `website` → site `netispeed-61369`, serving `website/dist/`. Pages are flat HTML files served
  through `cleanUrls` (`/about` → `about.html`), so no SPA rewrite is needed, and unknown URLs get
  `404.html` with a real 404 status.
- `web-app` → site `netispeed-app`, serving `web-app/dist/`, with every path rewritten to
  `index.html`.

```bash
npm run deploy          # build and deploy both
npm run deploy:website  # build and deploy only the website
npm run deploy:app      # build and deploy only the web app
npm run preview         # firebase serve, to check URLs, redirects and 404s locally
```

One-time setup for the web app site: create it (`firebase hosting:sites:create netispeed-app`), then
connect `app.netispeed.in` to it in the Firebase console under Hosting → Add custom domain.
