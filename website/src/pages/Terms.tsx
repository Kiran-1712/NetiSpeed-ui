import { CONTACT_EMAIL, SITE_URL, TERMS_UPDATED } from '@shared/site';
import { pathFor } from '../pages';
import { Checks, Label, LegalDocument, PageHero, type LegalSection } from '../ui';

const GLANCE = [
  'Free to use, no account needed',
  'Results are estimates, not certified measurements',
  'Only test hosts you own or are allowed to test',
  'Provided as is, to the extent the law allows',
];

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: 'agreement',
    title: 'About these terms',
    body: (
      <>
        <p>
          These terms apply to your use of the NetiSpeed website at <a href={SITE_URL}>netispeed.in</a>, its speed test and
          network tools, and the NetiSpeed Android app (together, “NetiSpeed” or “the service”). By using NetiSpeed you agree
          to them. If you don’t agree, please don’t use the service.
        </p>
        <p>
          How we handle information is described in the <a href={pathFor('privacy')}>privacy policy</a>, which forms part of
          these terms.
        </p>
      </>
    ),
  },
  {
    id: 'service',
    title: 'The service',
    body: (
      <p>
        NetiSpeed measures internet performance, such as download and upload speed, latency, jitter and latency under load,
        and provides network diagnostic tools. It is free to use and doesn’t require an account. Some features are only
        available in the Android app, and features marked “Planned” on this website are not available yet.
      </p>
    ),
  },
  {
    id: 'use',
    title: 'Permitted use',
    body: (
      <p>
        You may use NetiSpeed to test and troubleshoot connections for personal use or within your own organisation. You
        may share your own results, including screenshots, as long as you don’t present them as an official or certified
        measurement or as endorsed by NetiSpeed.
      </p>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <>
        <p>When using NetiSpeed, you agree not to:</p>
        <ul>
          <li>
            use the ping, port or lookup tools against hosts or networks you don’t own or aren’t authorised to test, or to
            scan, probe or attack any system;
          </li>
          <li>
            run tests or tools automatically, at high volume or in a way designed to load NetiSpeed or the third-party
            services it uses, including Cloudflare’s test servers;
          </li>
          <li>interfere with, disrupt or try to gain unauthorised access to the service or its infrastructure;</li>
          <li>copy, resell or reframe the service, or remove or alter its notices, except where the law allows;</li>
          <li>use NetiSpeed in breach of any applicable law.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'accuracy',
    title: 'Measurement accuracy',
    body: (
      <>
        <p>
          Results are estimates. They depend on your device, browser, Wi-Fi conditions, other activity on your network, the
          test server, your provider’s routing and conditions on the internet at the time. Two tests run moments apart can
          give different results.
        </p>
        <p>
          Browsers can’t send raw network packets, so the website’s ping and port tools time web requests, which include
          encryption and HTTP overhead. Locations are estimated from IP addresses and may be inaccurate.
        </p>
        <p>
          NetiSpeed is not a certified measurement service. Its results shouldn’t be relied on as the only evidence in a
          dispute with an internet provider, or for safety-critical or contractual decisions.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: 'Third-party services',
    body: (
      <>
        <p>
          NetiSpeed relies on third-party services to work, including Cloudflare for measurements, IP lookup providers,
          OpenStreetMap, Google Public DNS and Google Analytics. The full list is in the{' '}
          <a href={`${pathFor('privacy')}#third-parties`}>privacy policy</a>. Their availability is outside our control, and
          your use of them is also subject to their own terms.
        </p>
        <p>
          Service names and logos shown in NetiSpeed belong to their owners. They are used only to identify each service
          whose latency is measured and don’t imply any endorsement or partnership.
        </p>
      </>
    ),
  },
  {
    id: 'android',
    title: 'The Android app',
    body: (
      <p>
        The Android app is distributed through Google Play, and Google Play’s terms also apply to downloading it. The app
        asks for the permissions described in the privacy policy, and you can revoke optional permissions at any time in
        your device settings.
      </p>
    ),
  },
  {
    id: 'ip-rights',
    title: 'Intellectual property',
    body: (
      <p>
        The NetiSpeed name, logo, design and content are owned by NetiSpeed. These terms don’t give you any right to use
        them other than to use the service. Open-source components used in NetiSpeed remain under their own licences.
      </p>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and changes to the service',
    body: (
      <p>
        We try to keep NetiSpeed available and working, but we don’t guarantee that it will be uninterrupted or error-free.
        We may change, suspend or discontinue any part of the service at any time, including features described on this
        website.
      </p>
    ),
  },
  {
    id: 'warranty',
    title: 'Disclaimer',
    body: (
      <p>
        To the extent permitted by law, NetiSpeed is provided “as is” and “as available”, without warranties of any kind,
        whether express or implied, including warranties of accuracy, fitness for a particular purpose and
        non-infringement.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <>
        <p>
          To the extent permitted by law, NetiSpeed will not be liable for any indirect, incidental, special or
          consequential loss, or for any loss of data, revenue or profit, arising from your use of, or inability to use, the
          service or any decision made on the basis of its results.
        </p>
        <p>
          Nothing in these terms limits any liability that cannot be limited under applicable law, or any rights you have as
          a consumer that cannot be waived.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these terms as NetiSpeed changes. The date at the top shows when they last changed, and the current
        version is always at <a href={pathFor('terms')}>netispeed.in/terms</a>. Continuing to use NetiSpeed after a change
        means you accept the updated terms.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: <p>Questions about these terms can be sent to {mail}.</p>,
  },
];

export default function Terms() {
  return (
    <>
      <PageHero
        kicker={`Last updated ${TERMS_UPDATED}`}
        title="Terms of Service"
        lead="The ground rules for using the NetiSpeed website, speed test, network tools and Android app."
        aside={
          <div className="s-aside">
            <Label>At a glance</Label>
            <Checks items={GLANCE} />
          </div>
        }
      />
      <LegalDocument sections={SECTIONS} label="Terms of service" />
    </>
  );
}
