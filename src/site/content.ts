import {
  Activity,
  BellRing,
  Bug,
  ChartColumn,
  ChartLine,
  Cpu,
  Gamepad2,
  Gauge,
  Globe,
  History,
  House,
  Laptop,
  Lightbulb,
  ListChecks,
  Lock,
  Network,
  Radar,
  Server,
  Sparkles,
  Timer,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { SERVICES } from '../utils/services';

/**
 * Website copy that more than one page shows. Everything here describes what
 * the product does today, except ROADMAP, which is labelled as planned wherever
 * it appears.
 */

export interface Metric {
  label: string;
  title: string;
  body: string;
  /** CSS colour token for the tick beside the label, stepped for the white page. */
  tone: string;
}

export const METRICS: Metric[] = [
  {
    label: 'Download',
    title: 'Download speed',
    body: 'How fast data reaches you. It decides streaming quality, how long downloads take and how quickly pages load.',
    tone: 'var(--dl-a)',
  },
  {
    label: 'Upload',
    title: 'Upload speed',
    body: 'How fast you can send data. It matters for video calls, cloud backups, live streaming and sharing large files.',
    tone: 'var(--ul-a)',
  },
  {
    label: 'Latency',
    title: 'Ping and latency',
    body: 'The round trip to the nearest test server. Lower latency makes games, calls and browsing feel more responsive.',
    tone: 'var(--ping-a)',
  },
  {
    label: 'Jitter',
    title: 'Jitter',
    body: 'How much latency varies from one moment to the next. High jitter shows up as choppy calls and sudden lag spikes.',
    tone: 'var(--coral)',
  },
  {
    label: 'Under load',
    title: 'Latency under load',
    body: 'How far latency rises while the line is busy, known as bufferbloat, graded from A+ to F.',
    tone: 'var(--warn)',
  },
  {
    label: 'Loss',
    title: 'Packet loss',
    body: 'Requests that never come back. The live connection chart tracks dropped pings, and the Android speed test reports loss.',
    tone: 'var(--bad)',
  },
];

export interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

/** The services the dashboard times, by name, from the same list it probes. */
export const SERVICE_NAMES = SERVICES.map((s) => s.name);

export const WEB_FEATURES: { group: string; items: Feature[] }[] = [
  {
    group: 'Speed test',
    items: [
      {
        icon: Gauge,
        title: 'Download and upload speed',
        body: 'Transfers files of increasing size to the nearest server on Cloudflare’s global network and reports the fastest sustained speed in each direction.',
      },
      {
        icon: Timer,
        title: 'Latency and jitter',
        body: 'The median of 30 small requests on an idle line, and how much they vary.',
      },
      {
        icon: Activity,
        title: 'Bufferbloat grade',
        body: 'Latency measured again while the download and upload saturate your line, graded A+ to F by how far it rises.',
      },
      {
        icon: ListChecks,
        title: 'Quality rating',
        body: 'Each result is rated Excellent, Good, Fair or Poor from its download, upload and latency together.',
      },
    ],
  },
  {
    group: 'Your connection',
    items: [
      {
        icon: Globe,
        title: 'Provider and IP addresses',
        body: 'Your internet provider, public IPv4 and IPv6 addresses, and an approximate location from your IP address on a map.',
      },
      {
        icon: Server,
        title: 'Test server',
        body: 'Which Cloudflare data centre your test runs against, so you know where the numbers were measured to.',
      },
      {
        icon: ChartLine,
        title: 'Live connection',
        body: 'Pings Cloudflare once a second and charts the last 60 seconds, with average latency, jitter and dropped pings. No test needed.',
      },
      {
        icon: Lock,
        title: 'Connection details',
        body: 'HTTP version, TLS version, post-quantum key exchange, encrypted server name, IPv4 or IPv6, and whether Cloudflare WARP is on.',
      },
    ],
  },
  {
    group: 'Beyond the speed test',
    items: [
      {
        icon: Radar,
        title: 'Service latency',
        body: `Times a small request to the content networks of ${SERVICES.length} services across streaming, calls, gaming, social and cloud, and rates each Fast, OK or Slow.`,
      },
      {
        icon: History,
        title: 'History and trends',
        body: 'Every result is saved on your device with its provider and connection type, with a trend chart and a table of past tests.',
      },
      {
        icon: Wrench,
        title: 'Network tools',
        body: 'IP address lookup, DNS record lookup through Google Public DNS, HTTPS ping, and a port reachability check.',
      },
    ],
  },
];

export const APP_FEATURES: Feature[] = [
  {
    icon: Gauge,
    title: 'Speed test with packet loss',
    body: 'Download, upload, latency and packet loss, saved to a history on your phone.',
  },
  {
    icon: BellRing,
    title: 'Live speed in your notifications',
    body: 'Your current download and upload rate, worked out from your phone’s total traffic counters.',
  },
  {
    icon: ChartColumn,
    title: 'Daily and monthly data usage',
    body: 'Wi-Fi and mobile data totals per day and month, with optional usage access you can turn off at any time.',
  },
  {
    icon: Cpu,
    title: 'Device and network details',
    body: 'Your device model, network type and connection details in one place, shown on your phone only.',
  },
];

export const AUDIENCES: Feature[] = [
  {
    icon: House,
    title: 'Everyday internet users',
    body: 'Check whether you’re getting the speed you pay for, and what your numbers mean in plain terms.',
  },
  {
    icon: Laptop,
    title: 'Remote workers',
    body: 'See whether upload, latency and latency under load can keep up with video calls while others share the line.',
  },
  {
    icon: Gamepad2,
    title: 'Gamers',
    body: 'Watch latency, jitter and dropped pings live, and see how game platforms respond from where you are.',
  },
  {
    icon: Network,
    title: 'People troubleshooting',
    body: 'Narrow down whether a problem is your connection, your provider or a single service, with DNS, ping and port tools.',
  },
];

export const ROADMAP: Feature[] = [
  {
    icon: Sparkles,
    title: 'AI explanations of your results',
    body: 'Plain-language explanations of what a result means and what is most likely limiting your connection.',
  },
  {
    icon: Bug,
    title: 'Troubleshooting recommendations',
    body: 'Step-by-step suggestions based on what a test found, such as high latency under load or packet loss.',
  },
  {
    icon: ChartLine,
    title: 'Historical performance insights',
    body: 'Patterns across your saved tests, such as the times of day your connection slows down.',
  },
  {
    icon: Lightbulb,
    title: 'Personalised connectivity guidance',
    body: 'Advice tailored to what you use your connection for, whether that’s calls, gaming or streaming.',
  },
];

/** Limits of the web platform, stated so nobody expects a number the browser can't give. */
export const LIMITATIONS: string[] = [
  'Browsers can’t send raw ICMP packets, so the ping tool and live chart time small HTTPS requests. Those timings include encryption and HTTP overhead.',
  'Wi-Fi signal strength, router details and hop counts aren’t readable from a browser, so the website doesn’t show them.',
  'The port check infers reachability from a web request. It can’t always tell a closed port from one that doesn’t speak HTTP.',
  'Location is estimated from your IP address and reflects where your provider registers it, which can be a city or more away.',
  'Packet loss in the speed test itself needs credentials only Cloudflare’s own site can issue, so on the web, loss comes from the live chart’s dropped pings.',
];
