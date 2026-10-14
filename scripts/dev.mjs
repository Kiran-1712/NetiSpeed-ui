// Runs both dev servers: the website on :5173 and the speed test app on :5174.
// Links between them point at these ports in dev (shared/site.ts).
import { spawn } from 'node:child_process';

const apps = [
  { name: 'web-app', color: 36 },
  { name: 'website', color: 35 },
];

const children = apps.map(({ name, color }) => {
  const child = spawn('npm', ['run', 'dev', '-w', name], { stdio: ['inherit', 'pipe', 'pipe'] });
  const prefix = `\x1b[${color}m[${name}]\x1b[0m `;
  const relay = (out) => (chunk) => {
    for (const line of chunk.toString().split('\n')) if (line.trim()) out.write(prefix + line + '\n');
  };
  child.stdout.on('data', relay(process.stdout));
  child.stderr.on('data', relay(process.stderr));
  // If one server dies, stop the other rather than leave half the site up.
  child.on('exit', (code) => {
    for (const other of children) if (other !== child) other.kill();
    process.exitCode = code ?? 0;
  });
  return child;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => children.forEach((c) => c.kill(signal)));
}
