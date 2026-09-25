import { Check, Info, ShieldCheck, type LucideIcon } from 'lucide-react';
import { hrefFor } from '../hooks/useRoute';
import PlayStoreLink from '../components/PlayStoreLink';
import { CONTACT_EMAIL, PLAY_STORE_URL, POLICY_UPDATED, SITE_OWNER, copyrightLine } from '../utils/site';

export type InfoRoute = 'about' | 'privacy';

const PAGES: { id: InfoRoute; label: string; icon: LucideIcon; description: string }[] = [
  { id: 'about', label: 'About NetiSpeed', icon: Info, description: 'What it measures, and how.' },
  { id: 'privacy', label: 'Privacy policy', icon: ShieldCheck, description: 'What NetiSpeed sends, and where.' },
];

const AT_A_GLANCE = ['No account or sign-in', 'No ads, and your results are never uploaded', 'Test history stays on this device'];

function About() {
  return (
    <>
      <section>
        <h3>What NetiSpeed is</h3>
        <p>
          NetiSpeed is a free internet speed test and set of network diagnostics that works on the web and on
          your phone. It measures download and upload speed, latency, jitter and how much latency rises while
          your connection is busy (bufferbloat), shows how quickly popular services respond from where you are,
          and can show your live connection speed and daily data usage.{' '}
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
            Get it on Google Play
          </a>
          .
        </p>
      </section>

      <section>
        <h3>How the test works</h3>
        <p>
          The speed test downloads and uploads files of increasing size to the nearest server on Cloudflare’s
          global network. Download and upload are reported from the fastest sustained transfers, and latency is
          the median of many small requests.
        </p>
        <p>
          The live connection chart pings Cloudflare once a second, and the service latency tiles time a small
          request to each service’s own content delivery network. Both pause while a speed test runs so the
          measurements don’t skew each other.
        </p>
      </section>

      <section>
        <h3>What it can’t measure</h3>
        <p>
          NetiSpeed’s ping and port checks are timed HTTPS requests rather than raw ICMP packets, and it doesn’t
          read router details. Your results depend on your device, Wi-Fi conditions and whatever else is using
          the connection.
        </p>
      </section>

      <section>
        <h3>Built with</h3>
        <ul>
          <li>Cloudflare’s speed test network for the measurements</li>
          <li>Leaflet, with map data © OpenStreetMap contributors</li>
          <li>ipify, ipwho.is, ipinfo.io and ipapi.co for IP address and provider lookups</li>
          <li>Google Public DNS for DNS lookups</li>
          <li>Simple Icons (CC0) and Lucide for icons, and the Inter typeface</li>
        </ul>
        <p>
          Brand names and logos belong to their owners and are shown only to label each service’s latency. Their
          use doesn’t imply any endorsement.
        </p>
      </section>
    </>
  );
}

function Privacy() {
  return (
    <>
      <section>
        <h3>The short version</h3>
        <p>
          This policy applies to NetiSpeed everywhere you use it, on the web and in the app. NetiSpeed has no
          accounts and runs no advertising. The website uses Google Analytics to count visits, which sets
          cookies. NetiSpeed has no server of its own that receives your results. To measure your connection, though, your device has to talk to other services,
          and each of them can see your IP address. This page lists every one of them.
        </p>
      </section>

      <section>
        <h3>What stays on your device</h3>
        <p>
          Your recent test results are saved only on your device, with the date, speeds, latency, packet loss,
          provider, approximate location and connection type of each. So are your settings, such as light or
          dark theme. None of it is sent anywhere. You can delete results on the History page, or remove
          everything by clearing NetiSpeed’s site or app data, or by uninstalling the app.
        </p>
      </section>

      <section>
        <h3>Services NetiSpeed contacts</h3>
        <ul>
          <li>
            <strong>Cloudflare</strong> (speed.cloudflare.com, cloudflare.com) runs the speed test transfers, the
            live ping and connection details such as HTTP and TLS versions. When a test finishes, Cloudflare’s
            speed test engine may also send the results with a random session ID to Cloudflare’s Aggregated
            Internet Measurement service (aim.cloudflare.com).
          </li>
          <li>
            <strong>ipify</strong> and <strong>ipinfo.io</strong> return your public IP address, internet
            provider and approximate location
            (city and region, from your IP address, not GPS). The IP lookup tool also sends the address or
            hostname you enter.
          </li>
          <li>
            <strong>OpenStreetMap</strong> map tile servers receive the map area around that approximate location.
          </li>
          <li>
            <strong>Google Public DNS</strong> (dns.google) receives the hostname you enter in the DNS lookup tool.
          </li>
          <li>
            <strong>Service latency checks</strong> send small requests, without cookies, to the content delivery
            networks of services such as Netflix, YouTube, Zoom, Steam and GitHub.
          </li>
          <li>
            <strong>Hosts you test</strong>. The ping and port tools send requests directly to the host you enter.
          </li>
          <li>
            <strong>Google Fonts</strong> serves the Inter typeface.
          </li>
          <li>
            <strong>Google Analytics</strong> (website only) receives which pages you open, your browser and
            device type, and your approximate location from your IP address, and sets cookies to recognise
            return visits. Your test results are not sent to it.
          </li>
        </ul>
        <p>
          Each of these services handles what it receives under its own privacy policy. The server that hosts
          NetiSpeed may also keep standard access logs, such as IP address, time and device type.
        </p>
      </section>

      <section>
        <h3>Permissions</h3>
        <p>NetiSpeed only asks for what it needs to measure your connection:</p>
        <ul>
          <li>
            <strong>Internet and network state</strong>: to run tests and show whether you’re on Wi-Fi or mobile
            data.
          </li>
          <li>
            <strong>Notifications</strong>: to show your live connection speed while monitoring is on. It’s worked
            out from your device’s total traffic counters, not by reading what you send.
          </li>
          <li>
            <strong>Usage access</strong> (optional): to show how much Wi-Fi and mobile data your device used each
            day and month. NetiSpeed reads totals only, not what individual apps used, and you can turn it off at
            any time in your settings.
          </li>
          <li>
            <strong>Device details</strong>: your device’s make, model, device ID, carrier and battery status are
            read only to be shown to you, and are never sent anywhere.
          </li>
        </ul>
      </section>

      <section>
        <h3>Location</h3>
        <p>
          NetiSpeed never asks for your device’s location. Any location it shows is an estimate from your IP
          address and may be off by a city or more.
        </p>
      </section>

      <section>
        <h3>Children</h3>
        <p>
          NetiSpeed isn’t directed at children and doesn’t knowingly collect personal information from anyone.
        </p>
      </section>

      <section>
        <h3>Changes</h3>
        <p>
          If what NetiSpeed sends or stores changes, this policy will change with it, and the date at the top will
          be updated.
        </p>
      </section>

      {CONTACT_EMAIL && (
        <section>
          <h3>Contact</h3>
          <p>
            Questions about privacy can go to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>
      )}
    </>
  );
}

export default function InfoPage({ page }: { page: InfoRoute }) {
  const current = PAGES.find((p) => p.id === page) ?? PAGES[0];
  const CurrentIcon = current.icon;

  return (
    <div className="page page-info">
      <section className="lead area-lead" aria-label="Information">
        <div className="lead-head">
          <span className="micro">{SITE_OWNER}</span>
          <h1 className="lead-title">{page === 'privacy' ? 'Privacy' : 'About'}</h1>
        </div>

        <nav className="tool-list" aria-label="Information pages">
          {PAGES.map(({ id, label, icon: Icon, description }) => (
            <a
              key={id}
              href={hrefFor(id)}
              className={`tool-item${page === id ? ' active' : ''}`}
              aria-current={page === id ? 'page' : undefined}
            >
              <span className="tool-icon">
                <Icon size={16} />
              </span>
              <span className="tool-text">
                <span className="tool-name">{label}</span>
                <span className="tool-desc">{description}</span>
              </span>
            </a>
          ))}
        </nav>

        <div className="get-app">
          <div className="get-app-text">
            <span className="micro">Get the app</span>
            <p>Speed tests, live speed in your notifications and daily data usage.</p>
          </div>
          <PlayStoreLink />
        </div>

        <ul className="glance" aria-label="At a glance">
          {AT_A_GLANCE.map((item) => (
            <li key={item}>
              <Check size={14} />
              {item}
            </li>
          ))}
        </ul>

        {/* Wide screens show this in the footer instead. */}
        <p className="notice lead-note info-copy">{copyrightLine()}</p>
      </section>

      <section className="card area-work" aria-label={current.label}>
        <div className="work-head">
          <span className="icon-disc light">
            <CurrentIcon size={16} />
          </span>
          <div>
            <h2 className="work-title">{current.label}</h2>
            <p className="work-desc">{page === 'privacy' ? `Last updated ${POLICY_UPDATED}` : current.description}</p>
          </div>
        </div>

        <article className="prose">{page === 'privacy' ? <Privacy /> : <About />}</article>
      </section>
    </div>
  );
}
