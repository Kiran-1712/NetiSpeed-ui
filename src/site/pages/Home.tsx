import type { CSSProperties } from 'react';
import { ArrowRight, Check, ChartLine, History, Lock, Radar, Server, Wrench } from 'lucide-react';
import PlayStoreLink from '../../components/PlayStoreLink';
import { APP_FEATURES, AUDIENCES, METRICS, ROADMAP, SERVICE_NAMES } from '../content';
import { pathFor } from '../pages';
import { FeatureCard, PageHero, SectionHead, StartTestButton, TextLink } from '../ui';

// The thresholds gradeFor() in components/Insights.tsx grades against.
const GRADES = [
  ['A+', '< 5 ms'],
  ['A', '< 30 ms'],
  ['B', '< 60 ms'],
  ['C', '< 200 ms'],
  ['D', '< 400 ms'],
  ['F', '400+ ms'],
];

const HERO_POINTS = ['Free, no sign-up', 'No ads', 'Runs in your browser'];

function ProductPreview() {
  return (
    <figure className="s-preview">
      <div className="s-preview-desktop">
        <img
          src="/screens/dashboard.jpg"
          width={1440}
          height={900}
          alt="The NetiSpeed dashboard after a test: a speed dial with download, upload, ping and jitter on the left, and cards for the test server, live connection chart, connection details and service latency on the right."
          fetchPriority="high"
        />
      </div>
      <div className="s-preview-phone">
        <img
          src="/screens/dashboard-mobile.jpg"
          width={390}
          height={844}
          alt="The NetiSpeed speed test on a phone, showing the dial and results."
          loading="lazy"
        />
      </div>
      <figcaption>The NetiSpeed dashboard. Personal network details are blurred.</figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <>
      <PageHero
        size="home"
        kicker="Internet speed test · Web and Android"
        title={
          <>
            Understand Your Internet. <span className="s-accent">Improve Your Connection.</span>
          </>
        }
        lead="NetiSpeed measures your download speed, upload speed, latency, jitter, packet loss and how your connection holds up under load, then rates the overall quality, so you can see what’s really slowing you down."
        aside={<ProductPreview />}
      >
        <div className="s-cta-row">
          <StartTestButton />
          <PlayStoreLink />
        </div>
        <ul className="s-points">
          {HERO_POINTS.map((p) => (
            <li key={p}>
              <Check size={15} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="s-section" aria-labelledby="measures">
        <div className="s-wrap">
          <SectionHead
            id="measures"
            kicker="What it measures"
            title="Six numbers that explain how your internet feels"
            lead="Each test runs against the nearest server on Cloudflare’s global network. Here’s what every number tells you."
          />
          <div className="s-grid s-grid-3">
            {METRICS.map((m) => (
              <article key={m.label} className="s-card s-metric">
                <p className="s-tick" style={{ '--tone': m.tone } as CSSProperties}>
                  {m.label}
                </p>
                <h3 className="s-h3">{m.title}</h3>
                <p>{m.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-section-tight" aria-labelledby="beyond">
        <div className="s-wrap">
          <SectionHead
            id="beyond"
            kicker="Why NetiSpeed"
            title="A fast connection can still feel slow"
            lead="A basic speed test gives you one download number. NetiSpeed looks at what happens around it: latency when the line is busy, how individual services respond, and what your connection is doing right now."
          />

          <div className="s-bento">
            <article className="s-card s-card-coral s-bento-lead">
              <p className="s-tick s-tick-ink">Latency under load</p>
              <ol className="s-grades" aria-label="Bufferbloat grades by how much latency rises under load">
                {GRADES.map(([grade, rise]) => (
                  <li key={grade}>
                    <b>{grade}</b>
                    <span>{rise}</span>
                  </li>
                ))}
              </ol>
              <p className="s-grades-note">Graded by how much latency rises while the line is busy.</p>
              <h3 className="s-h3">Find the lag a speed number hides</h3>
              <p>
                Much of the lag on a home connection comes from latency that climbs when someone starts a download or
                upload. NetiSpeed measures latency again while your line is saturated and grades the increase from A+ to
                F, so you can tell whether calls and games will hold up when the house is busy.
              </p>
            </article>

            <article className="s-card s-bento-wide">
              <div className="s-feature-top">
                <span className="s-icon" aria-hidden="true">
                  <Radar size={18} />
                </span>
              </div>
              <h3 className="s-h3">Service latency for {SERVICE_NAMES.length} services</h3>
              <p>
                Times a small request to each service’s own content network, so you can see which ones are slow from
                where you are.
              </p>
              <ul className="s-chips" aria-label="Services measured">
                {SERVICE_NAMES.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </article>

            <FeatureCard
              feature={{
                icon: ChartLine,
                title: 'Always-on live connection',
                body: 'Pings Cloudflare every second and charts the last minute, so spikes and dropouts show up as they happen.',
              }}
            />
            <FeatureCard
              feature={{
                icon: Lock,
                title: 'Connection details',
                body: 'HTTP/3, TLS 1.3, post-quantum key exchange, IPv6 and WARP, read from Cloudflare’s edge.',
              }}
            />
            <FeatureCard
              feature={{
                icon: Server,
                title: 'Provider and test server',
                body: 'Your provider, IP addresses, approximate location and the Cloudflare data centre you tested against.',
              }}
            />
            <FeatureCard
              feature={{
                icon: Wrench,
                title: 'Network tools',
                body: 'IP lookup, DNS records, HTTPS ping and a port reachability check, in the same place.',
              }}
            />
            <FeatureCard
              feature={{
                icon: History,
                title: 'History on your device',
                body: 'Results are saved in your browser with a trend chart, not on a NetiSpeed server.',
              }}
            />
            <a className="s-card s-more-card" href={pathFor('features')}>
              <h3 className="s-h3">Everything NetiSpeed measures, on the web and Android</h3>
              <span className="s-textlink">
                See every feature
                <ArrowRight size={15} aria-hidden="true" />
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="s-section" aria-labelledby="audience">
        <div className="s-wrap">
          <SectionHead id="audience" kicker="Who it’s for" title="Built for anyone who depends on their connection" />
          <div className="s-grid s-grid-4">
            {AUDIENCES.map((a) => (
              <FeatureCard key={a.title} feature={a} />
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-section-tight" aria-labelledby="android">
        <div className="s-wrap">
          <div className="s-panel s-app-panel">
            <div className="s-app-copy">
              <p className="s-kicker">Android app</p>
              <h2 className="s-h2" id="android">
                NetiSpeed on your phone
              </h2>
              <p className="s-lead">
                The same Cloudflare speed test, plus the things only a phone app can do: live speed in your
                notifications and how much Wi-Fi and mobile data you use each day.
              </p>
              <PlayStoreLink />
            </div>
            <ul className="s-app-list">
              {APP_FEATURES.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <span className="s-icon s-icon-light" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="s-h4">{title}</h3>
                    <p>{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="s-section" aria-labelledby="privacy-first">
        <div className="s-wrap s-split">
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
          />
          <div className="s-split-aside">
            <TextLink href={pathFor('privacy')}>Read the privacy policy</TextLink>
          </div>
        </div>
      </section>

      <section className="s-section s-section-tight" aria-labelledby="roadmap">
        <div className="s-wrap">
          <SectionHead
            id="roadmap"
            kicker="Roadmap"
            title="What we’re working towards"
            lead="These features are planned and not available yet. They may change before they ship."
          />
          <div className="s-grid s-grid-4">
            {ROADMAP.map((r) => (
              <FeatureCard key={r.title} feature={r} badge="Planned" />
            ))}
          </div>
        </div>
      </section>

      <section className="s-section" aria-labelledby="cta">
        <div className="s-wrap">
          <div className="s-cta-band">
            <div>
              <h2 className="s-h2" id="cta">
                See what your connection is really doing.
              </h2>
              <p>It runs in your browser against Cloudflare’s network. No sign-up, nothing to install.</p>
            </div>
            <StartTestButton label="Start speed test" />
          </div>
        </div>
      </section>
    </>
  );
}
