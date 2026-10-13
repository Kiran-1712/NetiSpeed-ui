import { useEffect, useState, type CSSProperties } from 'react';
import { ChartLine, History, Lock, Server, Wrench, type LucideIcon } from 'lucide-react';
import PlayStoreLink from '../../components/PlayStoreLink';
import { AUDIENCES, METRICS, SERVICE_NAMES } from '../content';
import { pathFor } from '../pages';
import {
  AndroidSection,
  Checks,
  CtaBand,
  FeatureGrid,
  Label,
  Roadmap,
  SectionHead,
  StartTestButton,
  TextLink,
} from '../ui';

// The thresholds gradeFor() in components/Insights.tsx grades against, coloured
// by the good / fair / poor groups the dashboard shows them in.
const GRADES = [
  { grade: 'A+', rise: '< 5 ms', color: '#34D399' },
  { grade: 'A', rise: '< 30 ms', color: '#7BDDB0' },
  { grade: 'B', rise: '< 60 ms', color: '#F2C14E' },
  { grade: 'C', rise: '< 200 ms', color: '#E0A21B' },
  { grade: 'D', rise: '< 400 ms', color: '#FF8A7A' },
  { grade: 'F', rise: '400+ ms', color: '#FF6B6B' },
];

// Where each numbered pin sits on public/screens/dashboard.jpg, as a share of
// its width and height. Move them if the screenshot is retaken.
const PINS: { x: number; y: number; title: string; body: string }[] = [
  { x: 27.4, y: 27.8, title: 'Speed test', body: 'Download, upload, ping and jitter, with a quality rating.' },
  { x: 94.6, y: 22.6, title: 'Test server', body: 'The Cloudflare data centre your test ran against.' },
  { x: 73.6, y: 52, title: 'Live connection', body: 'A ping every second, plus the bufferbloat grade from your last test.' },
  {
    x: 51.4,
    y: 84.4,
    title: 'Service latency',
    body: `How quickly ${SERVICE_NAMES.length} services respond from where you are.`,
  },
];

const MORE: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ChartLine,
    title: 'Always-on live connection',
    body: 'Pings Cloudflare every second and charts the last minute, so spikes and dropouts show up as they happen.',
  },
  {
    icon: Lock,
    title: 'Connection details',
    body: 'HTTP/3, TLS 1.3, post-quantum key exchange, IPv6 and WARP, read from Cloudflare’s edge.',
  },
  {
    icon: Server,
    title: 'Provider and test server',
    body: 'Your provider, IP addresses, approximate location and the Cloudflare data centre you tested against.',
  },
  {
    icon: Wrench,
    title: 'Network tools',
    body: 'IP lookup, DNS records, HTTPS ping and a port reachability check, in the same place.',
  },
  {
    icon: History,
    title: 'History on your device',
    body: 'Results are saved in your browser with a trend chart, not on a NetiSpeed server.',
  },
];

function ProductShot() {
  return (
    <div className="s-stage">
      <div className="s-wrap">
        <figure className="s-shot">
          {/* Tilts and scales as one piece while it scrolls in; the figure itself stays put to track scroll. */}
          <div className="s-shot-body">
            <div className="s-shot-frame">
              <img
                src="/screens/dashboard.jpg"
                width={1440}
                height={900}
                alt="The NetiSpeed dashboard after a test: a speed dial with download, upload, ping and jitter on the left, and cards for the test server, live connection chart, connection details and service latency on the right."
                fetchPriority="high"
              />
              {PINS.map((p, i) => (
                <span key={p.title} className="s-pin" style={{ left: `${p.x}%`, top: `${p.y}%` }} aria-hidden="true">
                  {i + 1}
                </span>
              ))}
            </div>
            <div className="s-shot-phone">
              <img
                src="/screens/dashboard-mobile.jpg"
                width={390}
                height={844}
                alt="The NetiSpeed speed test on a phone, showing the dial and results."
                loading="lazy"
              />
            </div>
          </div>
          <figcaption>The NetiSpeed dashboard. Personal network details are blurred.</figcaption>
        </figure>

        <ol className="s-legend" aria-label="What the numbered parts of the dashboard show">
          {PINS.map((p, i) => (
            <li key={p.title}>
              <span className="s-pin" aria-hidden="true">
                {i + 1}
              </span>
              <b>{p.title}</b>
              <span>{p.body}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const HERO_POINTS = ['Free, no sign-up', 'No ads', 'Runs in your browser'];

// How the headline finishes "Understand your …". Colours are the dashboard's
// series colours, each at least 3:1 on white for large text.
const WORDS: { text: string; color?: string }[] = [
  { text: 'internet.' },
  { text: 'download speed.', color: '#0A936A' },
  { text: 'upload speed.', color: '#4F46E5' },
  { text: 'latency.', color: '#D9551F' },
  { text: 'jitter.', color: '#EC6B3A' },
  { text: 'bufferbloat.', color: '#B07D0E' },
  { text: 'packet loss.', color: '#D93A37' },
];

/** Steps through WORDS. The prerendered page shows the first, and it stays there with reduced motion. */
function useRotatingWord(ms: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((n) => (n + 1) % WORDS.length), ms);
    return () => window.clearInterval(timer);
  }, [ms]);
  return index;
}

function Hero() {
  const index = useRotatingWord(2200);
  const word = WORDS[index];
  return (
    <section className="s-hero" aria-labelledby="page-title">
      <div className="s-wrap">
        <Label>Internet speed test · Web and Android</Label>
        <h1 id="page-title" className="s-hero-title">
          <span className="s-sr">Understand your internet. Improve your connection.</span>
          <span aria-hidden="true">
            <span className="s-hero-line">Understand your</span>
            <span className="s-hero-slot">
              <span key={index} className="s-hero-word" style={{ color: word.color }}>
                {word.text}
              </span>
            </span>
            <span className="s-hero-sub">Improve your connection.</span>
          </span>
        </h1>
        <div className="s-cta-row">
          <StartTestButton />
          <PlayStoreLink />
        </div>
        <Checks items={HERO_POINTS} />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />

      <ProductShot />

      <section className="s-section" aria-labelledby="measures">
        <div className="s-wrap">
          <SectionHead
            id="measures"
            kicker="What it measures"
            title="Six numbers that explain how your internet feels"
            lead="Each test runs against the nearest server on Cloudflare’s global network. Here’s what every number tells you."
          />
          <div className="s-spec">
            {METRICS.map((m, i) => (
              <article key={m.label} className="s-spec-item" style={{ '--tone': m.tone } as CSSProperties}>
                <div className="s-spec-top">
                  <p className="s-tick">{m.label}</p>
                  <span className="s-spec-n" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="s-h3">{m.title}</h3>
                <p>{m.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-night" aria-labelledby="beyond">
        <div className="s-wrap s-bloat">
          <div className="s-bloat-copy">
            <Label>Why NetiSpeed</Label>
            <h2 className="s-h2" id="beyond">
              A fast connection can still feel slow
            </h2>
            <p className="s-lead">
              A basic speed test gives you one download number. NetiSpeed looks at what happens around it: latency when
              the line is busy, how individual services respond, and what your connection is doing right now.
            </p>
          </div>

          <div className="s-bloat-panel">
            <p className="s-tick">Latency under load</p>
            <ol className="s-scale" aria-label="Bufferbloat grades by how much latency rises under load">
              {GRADES.map((g) => (
                <li key={g.grade} style={{ '--c': g.color } as CSSProperties}>
                  <b>{g.grade}</b>
                  <span>{g.rise}</span>
                </li>
              ))}
            </ol>
            <p className="s-scale-note">Graded by how much latency rises while the line is busy.</p>
            <h3 className="s-h3">Find the lag a speed number hides</h3>
            <p>
              Much of the lag on a home connection comes from latency that climbs when someone starts a download or
              upload. NetiSpeed measures latency again while your line is saturated and grades the increase from A+ to F,
              so you can tell whether calls and games will hold up when the house is busy.
            </p>
          </div>
        </div>
      </section>

      <section className="s-section" aria-labelledby="more">
        <div className="s-wrap">
          <SectionHead
            id="more"
            kicker="Beyond the speed test"
            title="What else NetiSpeed shows you"
            lead="Alongside the test, the dashboard shows what your connection is doing right now and how the services you use respond."
          />
          <div className="s-more">
            <div className="s-more-lead">
              <h3 className="s-h3">Service latency for {SERVICE_NAMES.length} services</h3>
              <p>
                Times a small request to each service’s own content network, so you can see which ones are slow from where
                you are.
              </p>
              <ul className="s-services" aria-label="Services measured">
                {SERVICE_NAMES.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
            <ul className="s-rows">
              {MORE.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <Icon className="s-item-icon" size={20} strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="s-item-title">{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
              <li className="s-rows-more">
                <TextLink href={pathFor('features')}>See everything NetiSpeed measures, on the web and Android</TextLink>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="s-section" aria-labelledby="audience">
        <div className="s-wrap">
          <SectionHead id="audience" kicker="Who it’s for" title="Built for anyone who depends on their connection" />
          <FeatureGrid items={AUDIENCES} cols={4} />
        </div>
      </section>

      <AndroidSection
        kicker="Android app"
        title="NetiSpeed on your phone"
        lead="The same Cloudflare speed test, plus the things only a phone app can do: live speed in your notifications and how much Wi-Fi and mobile data you use each day."
      />

      <section className="s-section" aria-labelledby="privacy-first">
        <div className="s-wrap">
          <SectionHead
            id="privacy-first"
            kicker="Privacy"
            title="No account. No ads. Your history stays with you."
            lead={
              <>
                NetiSpeed has no sign-up and no advertising, and your results are saved on your device rather than on a
                NetiSpeed server. The website uses Google Analytics to count visits. To measure your connection, your
                device has to talk to services such as Cloudflare, and the privacy policy lists every one of them.
              </>
            }
          >
            <TextLink href={pathFor('privacy')}>Read the privacy policy</TextLink>
          </SectionHead>
        </div>
      </section>

      <Roadmap
        kicker="Roadmap"
        title="What we’re working towards"
        lead="These features are planned and not available yet. They may change before they ship."
      />

      <CtaBand id="cta" title="See what your connection is really doing." action={<StartTestButton tone="coral" />}>
        <p>It runs in your browser against Cloudflare’s network. No sign-up, nothing to install.</p>
      </CtaBand>
    </>
  );
}
