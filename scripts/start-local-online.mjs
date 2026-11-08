/** Starts an isolated web preview backed by the repo's local Supabase stack. */
import { execFileSync, spawn } from 'node:child_process';
const config = JSON.parse(execFileSync('npx', ['--yes', 'supabase', 'status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const child = spawn('npm', ['run', 'web', '--', '--port', '8091', '--localhost'], { cwd: new URL('../mobile', import.meta.url), env: { ...process.env, EXPO_NO_DOTENV: '1', EXPO_PUBLIC_SUPABASE_URL: config.API_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.PUBLISHABLE_KEY }, stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));
