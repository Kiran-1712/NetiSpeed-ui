import type { ReactNode } from 'react';
import { APP_PATH, CONTACT_EMAIL, PLAY_STORE_URL } from '../../utils/site';
import { AUDIENCES, SERVICE_NAMES } from '../content';
import { pathFor } from '../pages';
import { FeatureCard, PageHero, SectionHead, TextLink } from '../ui';

const FACTS: { label: string; value: ReactNode }[] = [
  { label: 'Product', value: 'NetiSpeed' },
  { label: 'What it is', value: 'Internet speed test and network diagnostics' },
  {
    label: 'Platforms',
    value: (
      <>
        <a href={APP_PATH}>Web</a> and{' '}
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
          Android
        </a>
      </>
    ),
  },
  { label: 'Price', value: 'Free, no account' },
  { label: 'Stage', value: 'Early stage, in active development' },
  { label: 'Contact', value: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> },
];

export default function About() {
  return (
    <>
      <PageHero
        kicker="About"
        title="About NetiSpeed"
        lead="NetiSpeed is an internet speed test and set of network diagnostics for the web and Android. It exists to make internet performance easy to understand and troubleshoot."
        aside={
          <dl className="s-card s-facts" aria-label="NetiSpeed at a glance">
            {FACTS.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        }
      />

      <section className="s-section" aria-labelledby="problem">
        <div className="s-wrap s-prose-grid">
          <SectionHead id="problem" kicker="The problem" title="Most people only notice their connection when it fails" />
          <div className="s-prose">
            <p>
              A video call freezes, a game lags or a page hangs, and the usual answer is to run a speed test. It returns a
              single download number that often looks fine and rarely explains what went wrong.
            </p>
            <p>
              What decides how a connection feels is usually somewhere else: latency, jitter, packet loss, how much latency
              rises when someone else starts a download, or one service being slow from where you are. Those are harder to
              measure and harder still to interpret.
            </p>
          </div>
        </div>
      </section>

      <section className="s-section s-section-tight" aria-labelledby="what">
        <div className="s-wrap s-prose-grid">
          <SectionHead id="what" kicker="What NetiSpeed does" title="The numbers behind how your internet feels" />
          <div className="s-prose">
            <p>
              NetiSpeed measures download and upload speed, latency and jitter against the nearest server on Cloudflare’s
              global network, then measures latency again while your line is saturated to grade bufferbloat. Alongside the
              test, it charts your live latency every second, times how quickly {SERVICE_NAMES.length} popular services respond, and shows
              the details of your connection, from your provider to the HTTP and TLS versions in use.
            </p>
            <p>
              Results are rated in plain terms and saved on your device, so you can compare them over time. The Android app
              adds packet loss to the speed test, live speed in your notifications and daily data usage.
            </p>
            <TextLink href={pathFor('features')}>See every feature</TextLink>
          </div>
        </div>
      </section>

      <section className="s-section" aria-labelledby="who">
        <div className="s-wrap">
          <SectionHead id="who" kicker="Who it’s for" title="For anyone who depends on their connection" />
          <div className="s-grid s-grid-4">
            {AUDIENCES.map((a) => (
              <FeatureCard key={a.title} feature={a} />
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-section-tight" aria-labelledby="mission">
        <div className="s-wrap">
          <div className="s-panel s-mission">
            <p className="s-kicker">Mission</p>
            <h2 className="s-h2" id="mission">
              Make internet performance easy to understand and troubleshoot.
            </h2>
          </div>
        </div>
      </section>

      <section className="s-section" aria-labelledby="stage">
        <div className="s-wrap s-prose-grid">
          <SectionHead id="stage" kicker="Where we are" title="An early-stage product in active development" />
          <div className="s-prose">
            <p>
              NetiSpeed is in active, early development. The web speed test and network tools at netispeed.in are
              available now and free to use without an account. The Android app is in its first releases on Google Play.
            </p>
            <p>
              Features marked <strong>Planned</strong> on this site, including AI explanations of results and
              troubleshooting recommendations, are not available yet. We don’t publish usage figures, and nothing on this
              site is a testimonial or an endorsement.
            </p>
          </div>
        </div>
      </section>

      <section className="s-section s-section-tight" aria-labelledby="how">
        <div className="s-wrap s-prose-grid">
          <SectionHead id="how" kicker="How it works" title="Measured against Cloudflare’s network" />
          <div className="s-prose">
            <p>
              The speed test downloads and uploads files of increasing size to the nearest server on Cloudflare’s global
              network. Download and upload are reported from the fastest sustained transfers, and latency is the median of
              many small requests.
            </p>
            <p>
              The live connection chart pings Cloudflare once a second, and the service latency tiles time a small request to
              each service’s own content delivery network. Both pause while a speed test runs, so the measurements don’t skew
              each other.
            </p>
            <p>
              Results depend on your device, your Wi-Fi and whatever else is using your connection, so a single test is a
              snapshot rather than a guarantee.
            </p>
          </div>
        </div>
      </section>

      <section className="s-section" aria-labelledby="credits">
        <div className="s-wrap s-prose-grid">
          <SectionHead id="credits" kicker="Built with" title="Open services and libraries" />
          <div className="s-prose">
            <ul>
              <li>Cloudflare’s speed test network and its open-source speed test engine for the measurements</li>
              <li>Leaflet, with map data © OpenStreetMap contributors</li>
              <li>ipify, ipinfo.io, ipwho.is and ipapi.co for IP address and provider lookups</li>
              <li>Google Public DNS for DNS lookups</li>
              <li>Simple Icons (CC0) and Lucide for icons, and the Inter typeface</li>
            </ul>
            <p>
              Brand names and logos belong to their owners. They’re shown only to label each service’s latency and don’t
              imply any endorsement or partnership.
            </p>
          </div>
        </div>
      </section>

      <section className="s-section s-section-tight" aria-labelledby="talk">
        <div className="s-wrap">
          <div className="s-cta-band">
            <div>
              <h2 className="s-h2" id="talk">
                Questions, feedback or partnership ideas?
              </h2>
              <p>
                Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </p>
            </div>
            <a className="s-btn s-btn-dark" href={pathFor('contact')}>
              Contact us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
