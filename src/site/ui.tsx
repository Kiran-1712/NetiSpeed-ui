import type { ReactNode } from 'react';
import { ArrowRight, Gauge } from 'lucide-react';
import { APP_PATH } from '../utils/site';
import type { Feature } from './content';

/**
 * The white sheet from the dashboard's left column, flush to the left edge with
 * rounded right corners, holding each page's heading. `aside` sits beside it on
 * the charcoal side.
 */
export function PageHero({
  kicker,
  title,
  lead,
  children,
  aside,
  size = 'page',
}: {
  kicker: string;
  title: ReactNode;
  lead: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  size?: 'home' | 'page';
}) {
  return (
    <section className={`s-hero s-hero-${size}`} aria-labelledby="page-title">
      <div className="s-hero-sheet">
        <div className="s-hero-copy">
          <p className="s-kicker">{kicker}</p>
          <h1 id="page-title" className="s-h1">
            {title}
          </h1>
          <p className="s-hero-lead">{lead}</p>
          {children}
        </div>
      </div>
      {aside && <div className="s-hero-aside">{aside}</div>}
    </section>
  );
}

export function SectionHead({ kicker, title, lead, id }: { kicker: string; title: string; lead?: ReactNode; id?: string }) {
  return (
    <div className="s-section-head">
      <p className="s-kicker">{kicker}</p>
      <h2 className="s-h2" id={id}>
        {title}
      </h2>
      {lead && <p className="s-lead">{lead}</p>}
    </div>
  );
}

export function StartTestButton({ label = 'Start speed test' }: { label?: string }) {
  return (
    <a className="s-btn s-btn-dark" href={APP_PATH}>
      <Gauge size={16} aria-hidden="true" />
      {label}
    </a>
  );
}

export function FeatureCard({ feature, badge }: { feature: Feature; badge?: string }) {
  const Icon = feature.icon;
  return (
    <article className="s-card s-feature">
      <div className="s-feature-top">
        <span className="s-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        {badge && <span className="s-badge">{badge}</span>}
      </div>
      <h3 className="s-h3">{feature.title}</h3>
      <p>{feature.body}</p>
    </article>
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

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Long-form text on a white sheet, with a contents list beside it on wide screens. */
export function LegalDocument({ sections, label }: { sections: LegalSection[]; label: string }) {
  return (
    <div className="s-wrap s-legal">
      <nav className="s-toc" aria-label={`${label} contents`}>
        <p className="s-kicker">Contents</p>
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
