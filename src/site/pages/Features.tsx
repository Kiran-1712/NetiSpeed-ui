import { Info } from 'lucide-react';
import PlayStoreLink from '../../components/PlayStoreLink';
import { APP_FEATURES, LIMITATIONS, ROADMAP, WEB_FEATURES } from '../content';
import { FeatureCard, PageHero, SectionHead, StartTestButton } from '../ui';

const JUMPS = [
  { href: '#web', label: 'On the web', status: 'Available' },
  { href: '#android', label: 'On Android', status: 'Available' },
  { href: '#limits', label: 'What browsers can’t measure', status: 'Good to know' },
  { href: '#roadmap', label: 'Roadmap', status: 'Planned' },
];

export default function Features() {
  return (
    <>
      <PageHero
        kicker="Features"
        title="Everything NetiSpeed does today"
        lead="NetiSpeed runs in any modern browser and as an Android app. This page lists what’s available now and, separately, what’s planned."
        aside={
          <nav className="s-card s-jump" aria-label="On this page">
            <p className="s-kicker">On this page</p>
            <ul>
              {JUMPS.map((j) => (
                <li key={j.href}>
                  <a href={j.href}>
                    {j.label}
                    <span className={`s-status${j.status === 'Planned' ? ' planned' : ''}`}>{j.status}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        }
      >
        <div className="s-cta-row">
          <StartTestButton />
        </div>
      </PageHero>

      <section className="s-section" aria-labelledby="web">
        <div className="s-wrap">
          <SectionHead
            id="web"
            kicker="Available now · Web"
            title="In your browser"
            lead="Open the speed test at netispeed.in. Nothing to install and no account."
          />
          {WEB_FEATURES.map((g) => (
            <div key={g.group} className="s-group">
              <h3 className="s-group-title">{g.group}</h3>
              <div className={`s-grid ${g.items.length === 3 ? 's-grid-3' : 's-grid-4'}`}>
                {g.items.map((f) => (
                  <FeatureCard key={f.title} feature={f} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="s-section s-section-tight" aria-labelledby="android">
        <div className="s-wrap">
          <div className="s-panel s-app-panel">
            <div className="s-app-copy">
              <p className="s-kicker">Available now · Android</p>
              <h2 className="s-h2" id="android">
                On your phone
              </h2>
              <p className="s-lead">
                The Android app runs the same Cloudflare-based speed test and adds features a browser can’t offer. It asks
                only for the permissions those features need.
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

      <section className="s-section" aria-labelledby="limits">
        <div className="s-wrap s-split">
          <SectionHead
            id="limits"
            kicker="Good to know"
            title="What browsers can’t measure"
            lead="These are limits of the web platform. Rather than show a made-up number, NetiSpeed leaves these out or labels them."
          />
          <ul className="s-limits">
            {LIMITATIONS.map((l) => (
              <li key={l}>
                <Info size={16} aria-hidden="true" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="s-section s-section-tight" aria-labelledby="roadmap">
        <div className="s-wrap">
          <SectionHead
            id="roadmap"
            kicker="Roadmap · Planned"
            title="Coming later"
            lead="None of these are available yet. They are what we plan to build next, and details may change."
          />
          <div className="s-grid s-grid-4">
            {ROADMAP.map((r) => (
              <FeatureCard key={r.title} feature={r} badge="Planned" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
