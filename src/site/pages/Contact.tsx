import { useState } from 'react';
import { Bug, Check, Copy, Handshake, Mail, ShieldCheck, type LucideIcon } from 'lucide-react';
import { CONTACT_EMAIL } from '../../utils/site';
import { pathFor } from '../pages';
import { PageHero, SectionHead } from '../ui';

const mailto = (subject: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

const TOPICS: { icon: LucideIcon; title: string; body: string; subject: string; tips?: string[] }[] = [
  {
    icon: Bug,
    title: 'Support and bug reports',
    body: 'Something not working, or a result that looks wrong? Tell us what happened.',
    subject: 'NetiSpeed support',
    tips: [
      'Web or Android, and your browser or phone model',
      'What you expected and what you saw',
      'A screenshot of the result, if you have one',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Privacy requests',
    body: 'Questions about the privacy policy or a request about your data.',
    subject: 'NetiSpeed privacy request',
  },
  {
    icon: Handshake,
    title: 'Partnerships and press',
    body: 'Ideas for working together, or questions about NetiSpeed for an article.',
    subject: 'NetiSpeed partnership',
  },
];

function EmailCard() {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
    window.setTimeout(() => setCopied('idle'), 2500);
  };

  return (
    <div className="s-card s-card-coral s-email-card">
      <span className="s-icon s-icon-ink" aria-hidden="true">
        <Mail size={18} />
      </span>
      <p className="s-tick s-tick-ink">Email</p>
      <a className="s-email" href={`mailto:${CONTACT_EMAIL}`}>
        {CONTACT_EMAIL}
      </a>
      <div className="s-email-actions">
        <a className="s-btn s-btn-dark s-btn-sm" href={`mailto:${CONTACT_EMAIL}`}>
          Write an email
        </a>
        <button type="button" className="s-btn s-btn-ghost-ink s-btn-sm" onClick={copy}>
          {copied === 'done' ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          {copied === 'done' ? 'Copied' : 'Copy address'}
        </button>
      </div>
      <p className="s-email-status" role="status" aria-live="polite">
        {copied === 'done' && 'Email address copied.'}
        {copied === 'failed' && 'Couldn’t copy automatically. Select the address above instead.'}
      </p>
    </div>
  );
}

export default function Contact() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title="Get in touch"
        lead="The best way to reach NetiSpeed is by email, for support, privacy questions and anything else."
        aside={<EmailCard />}
      />

      <section className="s-section" aria-labelledby="topics">
        <div className="s-wrap">
          <SectionHead
            id="topics"
            kicker="How we can help"
            title="What to write about"
            lead="Every topic goes to the same address. Choose one below to start an email with the subject filled in."
          />
          <div className="s-grid s-grid-3">
            {TOPICS.map(({ icon: Icon, title, body, subject, tips }) => (
              <article key={title} className="s-card s-feature">
                <div className="s-feature-top">
                  <span className="s-icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                </div>
                <h3 className="s-h3">{title}</h3>
                <p>{body}</p>
                {tips && (
                  <>
                    <p className="s-small-head">Helpful to include</p>
                    <ul className="s-ticks">
                      {tips.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </>
                )}
                <a className="s-textlink s-card-link" href={mailto(subject)}>
                  Email about this
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-section-tight" aria-labelledby="before">
        <div className="s-wrap s-prose-grid">
          <SectionHead id="before" kicker="Before you write" title="Good to know" />
          <div className="s-prose">
            <p>
              NetiSpeed has no accounts and doesn’t keep your test results on its own servers, so we can’t look up a test
              for you. If a result seems off, include the numbers or a screenshot.
            </p>
            <p>
              NetiSpeed is an online product and is contacted by email only. We don’t take support requests by phone. For
              how we handle what you send us, see the <a href={pathFor('privacy')}>privacy policy</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
