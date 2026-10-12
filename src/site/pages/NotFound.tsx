import { pathFor } from '../pages';
import { PageHero, StartTestButton } from '../ui';

export default function NotFound() {
  return (
    <PageHero
      kicker="404"
      title="This page doesn’t exist"
      lead="The link may be out of date, or the address may have a typo."
    >
      <div className="s-cta-row">
        <StartTestButton />
        <a className="s-btn s-btn-outline" href={pathFor('home')}>
          Go to the home page
        </a>
      </div>
    </PageHero>
  );
}
