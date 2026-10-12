# NetiSpeed UI

The netispeed.in website and its browser-based internet speed test and network diagnostics dashboard,
built with React 19, TypeScript and Vite.

## Structure

| URL | What it is | Source |
| --- | --- | --- |
| `/` | Homepage | `src/site/pages/Home.tsx` |
| `/features`, `/about`, `/contact` | Product pages | `src/site/pages/` |
| `/privacy-policy`, `/terms` | Legal pages | `src/site/pages/` |
| `/speed-test` (`#/history`, `#/tools`) | The dashboard, unchanged, hash-routed | `src/App.tsx`, `src/pages/` |

The website pages are prerendered to static HTML at build time (`scripts/prerender.mjs`), each with its
own title, description, canonical URL, Open Graph tags and JSON-LD, and then hydrated. Page metadata
lives in `src/site/pages.ts`, which also drives `sitemap.xml`. The dashboard is client-rendered and loaded
on demand, so the website never downloads the speed test engine or the map. Old links such as
`/#/history` and `/#/privacy` are redirected in `src/main.tsx`.

Site-wide facts (contact email, Play Store URL, policy dates) live in `src/utils/site.ts`.

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
npm install
npm run dev      # dev server with HMR
npm run build    # typecheck, client build, SSR build, then prerender pages + sitemap into dist/
npm run preview  # serve the production build locally
npm run lint     # eslint
```

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

Firebase Hosting, configured in `firebase.json` (site `netispeed-61369`, serving `dist/`). Pages are
flat HTML files served through `cleanUrls` (`/about` → `about.html`), so no SPA rewrite is needed, and
unknown URLs get `404.html` with a real 404 status.

```bash
npm run build
firebase serve --only hosting   # check clean URLs, redirects and 404s locally
firebase deploy --only hosting
```
