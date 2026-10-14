import { CONTACT_EMAIL, POLICY_UPDATED, SITE_URL } from '@shared/site';
import { pathFor } from '../pages';
import { Checks, Label, LegalDocument, PageHero, type LegalSection } from '../ui';

const GLANCE = [
  'No accounts and no advertising',
  'Test results are saved on your device, not on a NetiSpeed server',
  'The website uses Google Analytics; the Android app has no analytics',
  'No location permission: location is estimated from your IP address',
  'We don’t sell your information',
];

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <>
        <p>
          This policy explains what information NetiSpeed (“NetiSpeed”, “we”, “us”) processes when you use the website at{' '}
          <a href={SITE_URL}>netispeed.in</a>, its speed test and network tools, and the NetiSpeed Android app. One policy
          covers all of them; where the website and the app differ, it says so.
        </p>
        <p>
          NetiSpeed has no accounts and runs no advertising, and it has no server of its own that receives your test
          results. To measure your connection, though, your device has to talk to other services, and each of them can see
          your IP address. This policy lists every one of them.
        </p>
        <p>Questions or requests about this policy can be sent to {mail}.</p>
      </>
    ),
  },
  {
    id: 'measurements',
    title: 'Speed test and network measurements',
    body: (
      <>
        <p>
          A speed test measures download speed, upload speed, latency, jitter and latency under load (and, in the Android
          app, packet loss) by transferring test data to and from Cloudflare’s network. The live connection chart and the
          service latency tiles time small requests from your device. All of these numbers are calculated on your device.
        </p>
        <p>
          Your results are saved on your device with the date, speeds, latency, packet loss where measured, your internet
          provider, approximate location and connection type. They are not sent to NetiSpeed.
        </p>
        <p>
          When a speed test on the website finishes, Cloudflare’s open-source speed test engine may send the results,
          together with a random session ID, to Cloudflare’s Aggregated Internet Measurement service (aim.cloudflare.com).
          Cloudflare handles that data under its own privacy policy.
        </p>
      </>
    ),
  },
  {
    id: 'ip',
    title: 'IP address and internet provider',
    body: (
      <>
        <p>
          To show your public IP addresses, internet provider and approximate location, your device asks IP lookup services
          for them (see <a href="#third-parties">services your device contacts</a>). Those services, like every server your
          device connects to, receive your IP address as part of the request.
        </p>
        <p>
          The IP lookup tool sends the IP address or hostname you enter to the lookup service. The DNS, ping and port tools
          send the hostname you enter to Google Public DNS or directly to that host.
        </p>
      </>
    ),
  },
  {
    id: 'location',
    title: 'Location',
    body: (
      <>
        <p>
          NetiSpeed never asks for your device’s location and doesn’t use GPS. Any location it shows is an estimate from
          your IP address, usually at city level, and may be off by a city or more.
        </p>
        <p>
          On the website, that approximate location is shown on a map. Map images are loaded from OpenStreetMap’s tile
          servers, which receive the map area being displayed and your IP address.
        </p>
      </>
    ),
  },
  {
    id: 'device',
    title: 'Device information and app permissions',
    body: (
      <>
        <p>The Android app asks only for what its features need:</p>
        <ul>
          <li>
            <strong>Internet and network state</strong>: to run tests and show whether you’re on Wi-Fi or mobile data.
          </li>
          <li>
            <strong>Notifications and a foreground service</strong>: to show your live connection speed while monitoring is
            on. It’s worked out from your device’s total traffic counters, not by reading what you send or receive.
          </li>
          <li>
            <strong>Usage access</strong> (optional): to show how much Wi-Fi and mobile data your device used each day and
            month. NetiSpeed reads totals only, not what individual apps used, and you can turn it off at any time in your
            device settings.
          </li>
        </ul>
        <p>
          The app also reads device details such as make, model, device ID, carrier and battery status, only to show them
          to you on the device screen. They are never sent anywhere.
        </p>
        <p>
          On the website, your browser may report an estimated connection type and speed (the Network Information API).
          It’s read on your device to be shown to you and isn’t sent anywhere.
        </p>
      </>
    ),
  },
  {
    id: 'analytics',
    title: 'Analytics',
    body: (
      <>
        <p>
          The website uses Google Analytics to count visits and see which pages are used. Google Analytics receives the
          pages you open, your browser and device type, screen size, referring site and your approximate location derived
          from your IP address, and it sets cookies to recognise return visits. Your test results and anything you type
          into the tools are not sent to it.
        </p>
        <p>The Android app doesn’t include any analytics or advertising SDK.</p>
      </>
    ),
  },
  {
    id: 'crashes',
    title: 'Crash reporting and diagnostics',
    body: (
      <>
        <p>
          Neither the website nor the Android app includes a crash-reporting or diagnostics SDK. If you have chosen to share
          usage and diagnostics data with Google on your Android device, Google Play may give us aggregated crash and
          stability reports for the app, which don’t identify you.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and local storage',
    body: (
      <>
        <p>The website uses:</p>
        <ul>
          <li>
            <strong>Google Analytics cookies</strong> (<code>_ga</code> and <code>_ga_KGJ56EKQS8</code>), to tell visits
            apart and recognise return visits.
          </li>
          <li>
            <strong>Local storage</strong> in your browser, for your test history (<code>netispeed_history</code>) and your
            light or dark theme (<code>theme</code>). This never leaves your device.
          </li>
        </ul>
        <p>
          The Android app keeps your test history and settings in its own on-device storage. NetiSpeed doesn’t use
          advertising or cross-site tracking cookies.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: 'Services your device contacts',
    body: (
      <>
        <p>To work, NetiSpeed connects your device directly to the following services. Each receives your IP address:</p>
        <ul>
          <li>
            <strong>Cloudflare</strong> (speed.cloudflare.com, cloudflare.com, aim.cloudflare.com): speed test transfers,
            the live ping, connection details such as HTTP and TLS versions, and the measurement reporting described above.
          </li>
          <li>
            <strong>ipify, ipinfo.io, ipwho.is and ipapi.co</strong>: your public IP address, internet provider and
            approximate location. The website uses ipify and ipinfo.io; the app uses ipinfo.io, ipwho.is and ipapi.co.
          </li>
          <li>
            <strong>httpbin.org</strong> (Android app only): a fallback upload target if Cloudflare’s upload endpoint can’t
            be reached. It receives random test data, not your personal data.
          </li>
          <li>
            <strong>OpenStreetMap</strong> (website only): map tiles around your approximate location.
          </li>
          <li>
            <strong>Google Public DNS</strong> (dns.google, website only): hostnames you enter in the DNS lookup tool.
          </li>
          <li>
            <strong>Service latency checks</strong> (website only): small requests, without cookies, to the content delivery
            networks of services such as Netflix, YouTube, Zoom, Steam and GitHub.
          </li>
          <li>
            <strong>Hosts you test</strong>: the ping and port tools send requests directly to the host you enter.
          </li>
          <li>
            <strong>Google Fonts</strong> (website only): serves the Inter and Archivo typefaces.
          </li>
          <li>
            <strong>Google Analytics</strong> (website only): as described under <a href="#analytics">Analytics</a>.
          </li>
          <li>
            <strong>Firebase Hosting</strong> (Google): serves the website and may keep standard access logs, such as IP
            address, time, requested page and browser type.
          </li>
          <li>
            <strong>Google Play</strong>: distributes the Android app under Google’s own terms and privacy policy.
          </li>
        </ul>
        <p>
          Each of these services handles what it receives under its own privacy policy. Some of them operate servers in
          other countries, so your requests may be processed outside the country you’re in.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'How we share information',
    body: (
      <p>
        We don’t sell or rent personal information, and we don’t share your test results with anyone. Apart from the
        services above, which your device contacts directly, we would only disclose information we hold, such as emails
        you send us, if the law requires it.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'Data retention and deletion',
    body: (
      <ul>
        <li>
          <strong>Test history and settings</strong> stay on your device until you delete them. You can delete results on
          the website’s History page, or remove everything by clearing NetiSpeed’s site data in your browser, clearing the
          app’s data or uninstalling the app.
        </li>
        <li>
          <strong>Google Analytics data</strong> is kept for no longer than 14 months, the maximum Google Analytics allows
          for this kind of data.
        </li>
        <li>
          <strong>Emails you send us</strong> are kept for as long as we need them to answer you and deal with any follow-up,
          and you can ask us to delete them.
        </li>
        <li>
          <strong>Data held by third-party services</strong>, such as access logs, is kept according to their own policies.
        </li>
      </ul>
    ),
  },
  {
    id: 'rights',
    title: 'Your choices and rights',
    body: (
      <>
        <ul>
          <li>You can use NetiSpeed without an account and without giving us your name or email address.</li>
          <li>
            You can block or delete cookies in your browser settings, or install Google’s opt-out browser add-on for Google
            Analytics. The speed test works either way.
          </li>
          <li>You can revoke the app’s notification or usage access permissions at any time in Android settings.</li>
        </ul>
        <p>
          Depending on where you live, you may have the right to access, correct or delete personal data about you, or to
          object to how it’s used. Because NetiSpeed doesn’t keep accounts or test results on its own servers, the only
          personal data we usually hold about you is any email you have sent us. To make a request, write to {mail}. You
          may also have the right to complain to your local data protection authority.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        The website is served only over HTTPS, and the connections NetiSpeed makes for lookups and measurements use HTTPS.
        The ping and port tools may send plain requests to the host you choose to test.
      </p>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <p>
        NetiSpeed isn’t directed at children and doesn’t knowingly collect personal information from anyone, including
        children.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        If what NetiSpeed sends or stores changes, this policy will change with it and the date at the top will be updated.
        The current version is always at <a href={pathFor('privacy')}>netispeed.in/privacy-policy</a>.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: <p>For any question about privacy or this policy, email {mail}.</p>,
  },
];

export default function Privacy() {
  return (
    <>
      <PageHero
        kicker={`Last updated ${POLICY_UPDATED}`}
        title="Privacy Policy"
        lead="What NetiSpeed processes on the web and in the Android app, which services your device contacts, and the choices you have."
        aside={
          <div className="s-aside">
            <Label>At a glance</Label>
            <Checks items={GLANCE} />
          </div>
        }
      />
      <LegalDocument sections={SECTIONS} label="Privacy policy" />
    </>
  );
}
