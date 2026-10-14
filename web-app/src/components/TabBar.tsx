import { Gauge, History, Lightbulb, Network, Wrench, type LucideIcon } from 'lucide-react';

/** Phone tabs. Test, Network and Insights are the parts of the dashboard page. */
export type Tab = 'test' | 'network' | 'insights' | 'history' | 'tools';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'test', label: 'Test', icon: Gauge },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'history', label: 'History', icon: History },
  { id: 'tools', label: 'Tools', icon: Wrench },
];

/** Floating pill from the mobile app. Only shown on narrow screens. */
export default function TabBar({ active, onSelect }: { active: Tab | null; onSelect: (tab: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={active === id ? 'active' : undefined}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onSelect(id)}
        >
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
