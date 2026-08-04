# NetiSpeed UI

Browser-based internet speed test and network diagnostics dashboard, built with React 19, TypeScript and Vite.

## Features

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
npm run build    # typecheck (tsc -b) then production build into dist/
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
| `basemaps.cartocdn.com` | Map tiles (light and dark) |

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

Firebase Hosting, configured in `firebase.json` (site `netispeed-61369`, serving `dist/`):

```bash
npm run build
firebase deploy
```
