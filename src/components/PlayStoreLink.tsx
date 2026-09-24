import { siGoogleplay } from 'simple-icons';
import { PLAY_STORE_URL } from '../utils/site';

const PlayIcon = ({ size }: { size: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d={siGoogleplay.path} />
  </svg>
);

/** `badge` is the store-style button; `inline` is the small footer link. */
export default function PlayStoreLink({ variant = 'badge' }: { variant?: 'badge' | 'inline' }) {
  return (
    <a
      className={variant === 'badge' ? 'play-badge' : 'play-inline'}
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get NetiSpeed on Google Play"
    >
      <PlayIcon size={variant === 'badge' ? 22 : 13} />
      {variant === 'badge' ? (
        <span className="play-text">
          <span className="play-kicker">Get it on</span>
          <span className="play-store">Google Play</span>
        </span>
      ) : (
        'Get the app'
      )}
    </a>
  );
}
