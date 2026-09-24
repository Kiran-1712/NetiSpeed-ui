import { BellRing, ChartColumn, Gauge, Smartphone, type LucideIcon } from 'lucide-react';
import { siGoogleplay } from 'simple-icons';
import PlayStoreLink from './PlayStoreLink';

const FEATURES: { icon: LucideIcon; label: string }[] = [
  { icon: BellRing, label: 'Live speed in your notifications' },
  { icon: ChartColumn, label: 'Daily Wi-Fi and mobile data usage' },
  { icon: Gauge, label: 'The same Cloudflare speed test' },
];

/** Dashboard promo for the Android app. */
export default function AppCard() {
  return (
    <section className="card area-app app-card" data-sub="network" aria-label="NetiSpeed mobile app">
      <svg className="app-watermark" viewBox="0 0 24 24" aria-hidden="true">
        <path d={siGoogleplay.path} />
      </svg>

      <div className="card-head">
        <span className="micro">Mobile app</span>
        <span className="icon-disc light">
          <Smartphone size={16} />
        </span>
      </div>

      <p className="card-title">NetiSpeed on your phone</p>

      <ul className="app-features">
        {FEATURES.map(({ icon: Icon, label }) => (
          <li key={label}>
            <Icon size={14} />
            {label}
          </li>
        ))}
      </ul>

      <div className="app-cta">
        <PlayStoreLink />
      </div>
    </section>
  );
}
