import { LIMITATIONS, WEB_FEATURES } from '../content';
import { AndroidSection, FeatureGrid, Label, PageHero, Roadmap, SectionHead, StartTestButton } from '../ui';

const JUMPS = [
  { href: '#web', label: 'On the web', status: 'Available' },
  { href: '#android', label: 'On Android', status: 'Available' },
  { href: '#limits', label: 'What browsers can’t measure', status: 'Good to know' },
  { href: '#roadmap', label: 'Roadmap', status: 'Planned' },
];

const statusClass = (status: string) =>
  status === 'Available' ? 's-status available' : status === 'Planned' ? 's-status planned' : 's-status';

export default function Features() {
  return (
    <>
      <PageHero
        kicker="Features"
        title="Everything NetiSpeed does today"
        lead="NetiSpeed runs in any modern browser and as an Android app. This page lists what’s available now and, separately, what’s planned."
        aside={
          <nav className="s-aside s-jump" aria-label="On this page">
            <Label>On this page</Label>
            <ul>
              {JUMPS.map((j) => (
                <li key={j.href}>
                  <a href={j.href}>
                    {j.label}
                    <span className={statusClass(j.status)}>{j.status}</span>
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
            lead="Open the speed test at app.netispeed.in. Nothing to install and no account."
          />
          {WEB_FEATURES.map((g) => (
            <div key={g.group} className="s-group">
              <h3 className="s-group-title">{g.group}</h3>
              <FeatureGrid items={g.items} cols={2} />
            </div>
          ))}
        </div>
      </section>

      <AndroidSection
        kicker="Available now · Android"
        title="On your phone"
        lead="The Android app runs the same Cloudflare-based speed test and adds features a browser can’t offer. It asks only for the permissions those features need."
      />

      <section className="s-section" aria-labelledby="limits">
        <div className="s-wrap s-split">
          <SectionHead
            id="limits"
            kicker="Good to know"
            title="What browsers can’t measure"
            lead="These are limits of the web platform. Rather than show a made-up number, NetiSpeed leaves these out or labels them."
          />
          <ol className="s-notes">
            {LIMITATIONS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ol>
        </div>
      </section>

      <Roadmap
        kicker="Roadmap · Planned"
        title="Coming later"
        lead="None of these are available yet. They are what we plan to build next, and details may change."
      />
    </>
  );
}
