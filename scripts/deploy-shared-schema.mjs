/** Apply only Dicey's additive migrations without changing a shared app's migration ledger. */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const project = 'ldokicqlaienedeetjyj'; // q-me: explicitly selected by the owner for the beta
const apply = process.argv.includes('--apply');
const root = new URL('../', import.meta.url);
function read(sql) {
  const result = execFileSync('npx', ['--yes', 'supabase', 'db', 'query', `--remote=${project}`, '--read-only', sql], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(result).rows;
}
const existing = read("select table_name from information_schema.tables where table_schema='public' and table_name like 'dicey_%'").map(row => row.table_name);
if (existing.length && !existing.includes('dicey_schema_migrations')) throw new Error('Dicey objects exist without a ledger; review before deploying');
const applied = existing.includes('dicey_schema_migrations') ? new Set(read('select version from public.dicey_schema_migrations').map(row => row.version)) : new Set();
const migrations = readdirSync(new URL('../supabase/migrations/', import.meta.url)).filter(name => /^\d+_.*\.sql$/.test(name)).sort().filter(name => !applied.has(name.split('_')[0]));
console.log(`Target: q-me (${project}). Pending Dicey migrations: ${migrations.join(', ') || 'none'}`);
if (!apply || !migrations.length) { if (!apply) console.log('Review complete; run with --apply to execute. q-me migration history is not modified.'); process.exit(0); }
const folder = mkdtempSync(join(tmpdir(), 'dicey-shared-'));
try {
  const sql = ['begin;', `create table if not exists public.dicey_schema_migrations (version text primary key, applied_at timestamptz not null default now());
    alter table public.dicey_schema_migrations enable row level security;
    revoke all on public.dicey_schema_migrations from public, anon, authenticated;
    grant all on public.dicey_schema_migrations to service_role;`,
    ...migrations.map(name => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8') + `\ninsert into public.dicey_schema_migrations(version) values ('${name.split('_')[0]}');`), 'commit;'].join('\n');
  const file = join(folder, 'migrations.sql'); writeFileSync(file, sql);
  execFileSync('npx', ['--yes', 'supabase', 'db', 'query', `--remote=${project}`, '--file', file, '--yes'], { cwd: root, stdio: 'inherit' });
  console.log('Applied Dicey migrations transactionally; q-me tables and migration ledger left unchanged.');
} finally { rmSync(folder, { recursive: true, force: true }); }
