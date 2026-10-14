import SpeedPanel from '../components/SpeedPanel';
import LastTestCard from '../components/LastTestCard';
import AppCard from '../components/AppCard';
import { NetworkCard, ServerCard } from '../components/NetworkCards';
import { LatencyCard, LiveConnectionCard } from '../components/Insights';
import { useLiveLatency } from '../hooks/useLiveLatency';
import type { SpeedTestState } from '../hooks/useSpeedTest';
import type { NetworkInfo } from '../hooks/useNetworkInfo';
import type { ServiceLatency } from '../hooks/useServiceLatency';
import type { TestResult } from '../utils/history';

export type DashboardSub = 'test' | 'network' | 'insights';

interface DashboardPageProps {
  test: SpeedTestState;
  net: NetworkInfo;
  history: TestResult[];
  latency: ServiceLatency;
  /** Which part is shown on a phone; wider screens show everything at once. */
  sub: DashboardSub;
}

export default function DashboardPage({ test, net, history, latency, sub }: DashboardPageProps) {
  const { ping, jitter, isRunning } = test;
  // Runs only while the dashboard is open; paused during a test so the two
  // measurements don't skew each other.
  const live = useLiveLatency(isRunning);

  return (
    <div className="page page-dashboard" data-sub-view={sub}>
      <SpeedPanel test={test} />
      <NetworkCard net={net} mapVisible={sub === 'network'} />
      <ServerCard net={net} ping={ping} jitter={jitter} />
      <AppCard />
      <LiveConnectionCard
        net={net}
        live={live}
        paused={isRunning}
        load={test.phase === 'done' ? test.load : null}
        history={history}
      />
      <LatencyCard latency={latency} paused={isRunning} />
      <LastTestCard history={history} />
    </div>
  );
}
