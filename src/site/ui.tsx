import type { ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import PlayStoreLink from '../components/PlayStoreLink';
import { APP_PATH } from '../utils/site';
import { APP_FEATURES, ROADMAP, type Feature } from './content';

/** Small uppercase label with a coral square, above every heading. */
export function Label({ children }: { children: ReactNode }) {
  return <p className="s-label">{children}</p>;
}

/**
 * The top of every page except home: a large heading on the white page, with
 * an optional `aside` (facts, contents, the email address) beside it.
 */
export function PageHero({
  kicker,
  title,
  lead,
  children,
  aside,
}: {
  kicker: string;
  title: ReactNode;
  lead: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="s-phero" aria-labelledby="page-title">
      <div className="s-wrap s-phero-grid">
        <div className="s-phero-copy">
          <Label>{kicker}</Label>
          <h1 id="page-title" className="s-h1">
            {title}
          </h1>
          <p className="s-phero-lead">{lead}</p>
          {children}
        </div>
        {aside && <div className="s-phero-aside">{aside}</div>}
      </div>
    </section>
  );
}

/**
 * Opens a section on a full-width rule, with the label on the left and the
 * heading beside it. Inside `.s-split` the two stack instead.
 */
export function SectionHead({
  kicker,
  title,
  lead,
  id,
  children,
}: {
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  id?: string;
  children?: ReactNode;
}) {
  return (
    <div className="s-head">
      <Label>{kicker}</Label>
      <div className="s-head-main">
        <h2 className="s-h2" id={id}>
          {title}
        </h2>
        {lead && <p className="s-lead">{lead}</p>}
        {children}
      </div>
    </div>
  );
}

export function StartTestButton({
  label = 'Start speed test',
  tone = 'dark',
  small = false,
}: {
  label?: ReactNode;
  tone?: 'dark' | 'coral';
  small?: boolean;
}) {
  return (
    <a className={`s-btn s-btn-${tone}${small ? ' s-btn-sm' : ''}`} href={APP_PATH}>
      {label}
      <ArrowRight size={small ? 15 : 17} aria-hidden="true" />
    </a>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="s-textlink" href={href}>
      {children}
      <ArrowRight size={15} aria-hidden="true" />
    </a>
  );
}

export function Checks({ items }: { items: string[] }) {
  return (
    <ul className="s-checks">
      {items.map((item) => (
        <li key={item}>
          <Check size={15} strokeWidth={2.5} aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** One feature: a line icon, a title and a sentence, under a hairline. */
export function FeatureItem({ feature, children }: { feature: Feature; children?: ReactNode }) {
  const Icon = feature.icon;
  return (
    <article className="s-item">
      <Icon className="s-item-icon" size={20} strokeWidth={1.75} aria-hidden="true" />
      <h3 className="s-item-title">{feature.title}</h3>
      <p>{feature.body}</p>
      {children}
    </article>
  );
}

export function FeatureGrid({ items, cols }: { items: Feature[]; cols: 2 | 3 | 4 }) {
  return (
    <div className={`s-items s-items-${cols}`}>
      {items.map((f) => (
        <FeatureItem key={f.title} feature={f} />
      ))}
    </div>
  );
}

/** The Android app on a grey band. Home and Features word the intro differently. */
export function AndroidSection({ kicker, title, lead }: { kicker: string; title: string; lead: string }) {
  return (
    <section className="s-section s-band" aria-labelledby="android">
      <div className="s-wrap s-android">
        <div className="s-android-copy">
          <Label>{kicker}</Label>
          <h2 className="s-h2" id="android">
            {title}
          </h2>
          <p className="s-lead">{lead}</p>
          <PlayStoreLink />
        </div>
        <FeatureGrid items={APP_FEATURES} cols={2} />
      </div>
    </section>
  );
}

/** Planned features on a dashed line, so they never read as shipped. */
export function Roadmap({ kicker, title, lead }: { kicker: string; title: string; lead: string }) {
  return (
    <section className="s-section" aria-labelledby="roadmap">
      <div className="s-wrap">
        <SectionHead id="roadmap" kicker={kicker} title={title} lead={lead} />
        <ol className="s-roadmap">
          {ROADMAP.map((r) => (
            <li key={r.title}>
              <p className="s-planned">Planned</p>
              <h3 className="s-item-title">{r.title}</h3>
              <p>{r.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Closing call to action on charcoal. It runs straight into the footer. */
export function CtaBand({ id, title, children, action }: { id: string; title: string; children: ReactNode; action: ReactNode }) {
  return (
    <section className="s-cta" aria-labelledby={id}>
      <div className="s-wrap s-cta-grid">
        <h2 className="s-h2" id={id}>
          {title}
        </h2>
        <div className="s-cta-side">
          {children}
          {action}
        </div>
      </div>
    </section>
  );
}

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Long-form text with a sticky contents list beside it on wide screens. */
export function LegalDocument({ sections, label }: { sections: LegalSection[]; label: string }) {
  return (
    <div className="s-wrap s-legal">
      <nav className="s-toc" aria-label={`${label} contents`}>
        <Label>Contents</Label>
        <ol>
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      <article className="s-doc">
        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
            <h2 id={`${s.id}-title`}>{s.title}</h2>
            {s.body}
          </section>
        ))}
      </article>
    </div>
  );
}
