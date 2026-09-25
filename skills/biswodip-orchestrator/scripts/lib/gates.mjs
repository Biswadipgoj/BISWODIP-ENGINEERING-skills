// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Automated security gates for a target repository. These gates produce EVIDENCE and HINTS;
// they do not replace the manual review, threat model or adversarial pass in MASTER-PROMPT.md.

import fs from 'node:fs';
import path from 'node:path';
import { c, log, table, paintStatus, which, run, exists, readJSON, writeJSON, walk, timestamp, IS_WIN } from './common.mjs';
import { paths } from './core.mjs';
import { strixRun } from './strix.mjs';

const SKIP_DIRS = new Set(['.git', 'node_modules', '.biswodip', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', 'coverage',
  'strix_runs', '__pycache__', '.venv', 'venv', 'env', 'target', '.turbo', '.cache', 'vendor', '.terraform', '.gradle', 'Pods', '.idea', '.vscode']);
const MAX_BYTES = 2 * 1024 * 1024;
// Vendored agent skills are third-party content installed by this system, not the project's own code.
// Scanning them buries real findings in noise. Override with --include-skills.
const SKILL_DIR_PREFIXES = ['.claude/skills', '.codex/skills', '.cursor/skills', '.agents/skills', '.github/skills'];

const PLACEHOLDER = /(your[_-]?|example|changeme|change_me|placeholder|dummy|sample|xxx+|<[^>]+>|\$\{|\{\{|process\.env|os\.environ|getenv|REPLACE|TODO|redacted|\*\*\*|fake|test[_-]?key|PASTE_)/i;

export const SECRET_RULES = [
  { id: 'private-key', severity: 'critical', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/ },
  { id: 'aws-access-key-id', severity: 'critical', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { id: 'github-token', severity: 'critical', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/ },
  { id: 'gitlab-token', severity: 'critical', re: /\bglpat-[A-Za-z0-9_-]{20,}\b/ },
  { id: 'slack-token', severity: 'high', re: /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/ },
  { id: 'slack-webhook', severity: 'high', re: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]{20,}/ },
  { id: 'stripe-live-key', severity: 'critical', re: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/ },
  { id: 'google-api-key', severity: 'high', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'anthropic-key', severity: 'critical', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { id: 'openrouter-key', severity: 'critical', re: /\bsk-or-v1-[A-Za-z0-9]{32,}\b/ },
  { id: 'openai-key', severity: 'critical', re: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b/ },
  { id: 'twilio-key', severity: 'high', re: /\bSK[0-9a-fA-F]{32}\b/ },
  { id: 'sendgrid-key', severity: 'high', re: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/ },
  { id: 'npm-token', severity: 'critical', re: /\bnpm_[A-Za-z0-9]{36}\b/ },
  { id: 'jwt', severity: 'medium', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { id: 'credential-in-url', severity: 'high', re: /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss|amqps?|mssql):\/\/[^\s:@/'"]+:([^\s@/'"]{3,})@/i, group: 1 },
  { id: 'generic-secret-assignment', severity: 'medium', re: /\b(?:api[_-]?key|secret[_-]?key|client[_-]?secret|auth[_-]?token|access[_-]?token|private[_-]?key|password|passwd)\b\s*[:=]\s*['"]([^'"\s]{12,})['"]/i, group: 1 },
];

// Heuristics: they point a reviewer at code worth reading. Each is a HINT (UNVERIFIED), not a finding.
export const RISK_RULES = [
  { id: 'public-env-secret', severity: 'high', re: /\b(?:NEXT_PUBLIC|VITE|REACT_APP|EXPO_PUBLIC|PUBLIC|NUXT_PUBLIC|GATSBY)_[A-Z0-9_]*(?:SECRET|PRIVATE|PASSWORD|SERVICE_ROLE|ADMIN_KEY)[A-Z0-9_]*/, why: 'client-exposed env var name suggests a secret is shipped to the browser (SKILL §7)' },
  { id: 'token-in-web-storage', severity: 'high', re: /(?:localStorage|sessionStorage)\.setItem\(\s*['"`][^'"`]*(?:token|jwt|auth|session|refresh)[^'"`]*['"`]/i, why: 'auth token in Web Storage is readable by any XSS (SKILL §8)' },
  { id: 'tls-verification-disabled', severity: 'high', re: /(?:rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0|verify\s*=\s*False|InsecureSkipVerify\s*:\s*true)/, why: 'TLS certificate verification disabled' },
  { id: 'cors-wildcard', severity: 'medium', re: /Access-Control-Allow-Origin['"]?\s*[:,]\s*['"]\*['"]|origin\s*:\s*['"]\*['"]|origin\s*:\s*true/, why: 'wildcard/reflected CORS — dangerous with credentials (SKILL §13)' },
  { id: 'dangerous-html-sink', severity: 'medium', re: /dangerouslySetInnerHTML|\.innerHTML\s*=|v-html=|bypassSecurityTrust(?:Html|Script|Url)|\{@html\s/, why: 'HTML sink — confirm input is sanitized (XSS)' },
  { id: 'dynamic-code-exec', severity: 'medium', re: /\beval\s*\(|new\s+Function\s*\(|\bexec\s*\(\s*`[^`]*\$\{|child_process[^\n]*exec\([^)]*\+|subprocess\.[a-z_]+\([^)]*shell\s*=\s*True|os\.system\(/, why: 'dynamic code/command execution — injection risk' },
  { id: 'sql-string-building', severity: 'medium', re: /(?:query|execute|raw|\$queryRawUnsafe|\$executeRawUnsafe)\s*\(\s*(?:`[^`]*\$\{|['"][^'"]*(?:SELECT|INSERT|UPDATE|DELETE)[^'"]*['"]\s*\+)/i, why: 'SQL built from strings — use parameters (SKILL §10)' },
  { id: 'float-money', severity: 'medium', re: /\b(?:parseFloat|Number|float)\s*\(\s*[^)]*\b(?:amount|price|balance|total|fee|cost|subtotal)\b/i, why: 'floating-point money handling (SKILL §11)' },
  { id: 'client-trusted-authz-field', severity: 'medium', re: /(?:req\.body|request\.json|req\.query|params)\s*(?:\.|\[['"])\s*(?:isAdmin|role|userId|tenantId|ownerId|price|amount|paymentStatus)\b/, why: 'server reads an authority field from the client — confirm it is re-validated (SKILL §6)' },
  { id: 'debug-route', severity: 'low', re: /['"`]\/(?:debug|__debug__|test-login|dev-login|backdoor|admin-bypass|_internal)\b/i, why: 'debug/development route — must not ship (SKILL §26)' },
  { id: 'sensitive-console-log', severity: 'low', re: /console\.(?:log|debug|info)\([^)]*\b(?:password|token|secret|apiKey|authorization)\b/i, why: 'secret-bearing value logged (SKILL §17)' },
  { id: 'jwt-none-or-no-verify', severity: 'high', re: /algorithms?\s*[:=]\s*\[?\s*['"]none['"]|jwt\.decode\([^)]*verify\s*=\s*False|verify_signature['"]?\s*:\s*False/i, why: 'JWT signature not verified' },
];

const TEXT_EXT_SKIP = /\.(png|jpe?g|gif|webp|ico|bmp|svgz|pdf|zip|gz|tgz|bz2|xz|7z|rar|jar|war|class|so|dylib|dll|exe|bin|wasm|woff2?|ttf|otf|eot|mp[34]|mov|avi|webm|ogg|wav|flac|lock|min\.js|map)$/i;

export function listFiles(root, extraExclude = []) {
  const ex = extraExclude.map((e) => e.replace(/\\/g, '/').replace(/\/+$/, ''));
  const excluded = (rel) => ex.some((e) => rel === e || rel.startsWith(e + '/'));
  let files = null;
  if (exists(path.join(root, '.git')) && which('git')) {
    const r = run('git', ['-C', root, 'ls-files', '-co', '--exclude-standard', '-z'], { timeout: 60000 });
    if (r.code === 0) files = r.stdout.split('\0').filter(Boolean);
  }
  if (!files) files = walk(root, { ignore: SKIP_DIRS });
  return files.filter((f) => !f.split('/').some((seg) => SKIP_DIRS.has(seg)) && !excluded(f));
}

export function mask(s) { const v = String(s); return v.length <= 8 ? '****' : `${v.slice(0, 4)}…(${v.length} chars)`; }

export function scanText(rel, text, rules, { placeholders = true } = {}) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 4000) continue; // minified / generated
    if (/biswodip-allow-secret|gitleaks:allow|nosec|pragma: allowlist secret/i.test(line)) continue;
    for (const rule of rules) {
      const m = line.match(rule.re);
      if (!m) continue;
      const value = rule.group ? m[rule.group] : m[0];
      if (placeholders && rule.id.startsWith('generic') && PLACEHOLDER.test(line)) continue;
      if (placeholders && rule.id === 'credential-in-url' && PLACEHOLDER.test(value)) continue;
      out.push({ rule: rule.id, severity: rule.severity, file: rel, line: i + 1, match: mask(value), why: rule.why });
    }
  }
  return out;
}

function scanRepo(root, exclude, includeSkills) {
  const secrets = [], risks = [], envFiles = [];
  let scanned = 0;
  const skipSkills = (rel) => !includeSkills && SKILL_DIR_PREFIXES.some((p) => rel === p || rel.startsWith(p + '/'));
  for (const rel of listFiles(root, exclude)) {
    if (skipSkills(rel)) continue;
    const base = path.posix.basename(rel);
    if (/^\.env(\..+)?$/.test(base) && !/\.(example|sample|template|dist|defaults?)$/.test(base)) envFiles.push({ rule: 'env-file-in-repo', severity: 'high', file: rel, line: 0, match: '—', why: 'environment file present in the working tree/index — must be untracked and never committed' });
    if (TEXT_EXT_SKIP.test(rel)) continue;
    const abs = path.join(root, rel);
    let st; try { st = fs.statSync(abs); } catch { continue; }
    if (!st.isFile() || st.size > MAX_BYTES) continue;
    const buf = fs.readFileSync(abs);
    if (buf.subarray(0, 8000).includes(0)) continue;
    const text = buf.toString('utf8');
    scanned++;
    secrets.push(...scanText(rel, text, SECRET_RULES));
    if (/\.(m?[jt]sx?|cjs|vue|svelte|py|rb|go|java|kt|php|cs|rs|swift|dart)$/i.test(rel)) risks.push(...scanText(rel, text, RISK_RULES, { placeholders: false }));
  }
  return { scanned, secrets: [...envFiles, ...secrets], risks };
}

function tracked(root, rel) {
  if (!exists(path.join(root, '.git'))) return null;
  return run('git', ['-C', root, 'ls-files', '--error-unmatch', rel], { timeout: 20000 }).code === 0;
}

function dependencyAudits(root, logFile) {
  const out = [];
  const has = (f) => exists(path.join(root, f));
  const npm = IS_WIN ? 'npm.cmd' : 'npm';
  const add = (ecosystem, status, detail, counts = null) => out.push({ ecosystem, status, detail, counts });
  const parseNpm = (txt) => { try { const j = JSON.parse(txt); return j.metadata?.vulnerabilities || null; } catch { return null; } };
  if (has('package-lock.json') || has('npm-shrinkwrap.json')) {
    if (!which('npm')) add('npm', 'BLOCKED', 'npm not installed');
    else { const r = run(npm, ['audit', '--json', '--omit=dev'], { cwd: root, timeout: 180000, logFile }); const v = parseNpm(r.stdout); add('npm', v ? 'RAN' : 'BLOCKED', v ? 'npm audit --omit=dev' : `npm audit failed: ${r.stderr.trim().split('\n').pop() || 'no JSON output (offline?)'}`, v); }
  }
  if (has('pnpm-lock.yaml')) {
    if (!which('pnpm')) add('pnpm', 'BLOCKED', 'pnpm not installed');
    else { const r = run(IS_WIN ? 'pnpm.cmd' : 'pnpm', ['audit', '--json', '--prod'], { cwd: root, timeout: 180000, logFile }); const v = parseNpm(r.stdout); add('pnpm', v ? 'RAN' : 'BLOCKED', v ? 'pnpm audit --prod' : 'pnpm audit produced no JSON (offline?)', v); }
  }
  if (has('yarn.lock')) add('yarn', which('yarn') ? 'UNVERIFIED' : 'BLOCKED', 'run `yarn npm audit` (Berry) or `yarn audit` (v1) manually — output formats differ');
  if (has('requirements.txt') || has('pyproject.toml') || has('Pipfile.lock') || has('poetry.lock') || has('uv.lock')) {
    if (!which('pip-audit')) add('python', 'BLOCKED', 'pip-audit not installed (pipx install pip-audit)');
    else {
      const args = has('requirements.txt') ? ['-r', 'requirements.txt', '-f', 'json'] : ['-f', 'json'];
      const r = run('pip-audit', args, { cwd: root, timeout: 300000, logFile });
      let n = null; try { const j = JSON.parse(r.stdout); n = (j.dependencies || j).reduce((a, d) => a + (d.vulns?.length || 0), 0); } catch { /* keep null */ }
      add('python', n == null ? 'BLOCKED' : 'RAN', n == null ? 'pip-audit produced no JSON' : `pip-audit: ${n} known vulnerabilities`, n == null ? null : { total: n });
    }
  }
  if (has('Cargo.lock')) add('rust', which('cargo-audit') ? 'UNVERIFIED' : 'BLOCKED', which('cargo-audit') ? 'run `cargo audit` and record output' : 'cargo-audit not installed');
  if (has('go.sum')) add('go', which('govulncheck') ? 'UNVERIFIED' : 'BLOCKED', which('govulncheck') ? 'run `govulncheck ./...` and record output' : 'govulncheck not installed');
  if (!out.length) add('—', 'N/A', 'no supported lockfile found (a missing lockfile is itself a supply-chain finding if the project has dependencies)');
  return out;
}

function projectChecks(root, logFile) {
  const pj = readJSON(path.join(root, 'package.json'), null);
  const out = [];
  if (!pj?.scripts) return out;
  const pm = exists(path.join(root, 'pnpm-lock.yaml')) ? 'pnpm' : exists(path.join(root, 'yarn.lock')) ? 'yarn' : 'npm';
  const bin = IS_WIN ? `${pm}.cmd` : pm;
  for (const s of ['lint', 'typecheck', 'type-check', 'check', 'test', 'build']) {
    if (!pj.scripts[s]) continue;
    if (s === 'test' && /no test specified/.test(pj.scripts[s])) { out.push({ check: s, status: 'N/A', detail: 'placeholder test script' }); continue; }
    const r = run(bin, ['run', s], { cwd: root, timeout: 20 * 60 * 1000, logFile, env: { ...process.env, CI: '1' } });
    out.push({ check: `${pm} run ${s}`, status: r.code === 0 ? 'VERIFIED' : 'FAILED', detail: `exit ${r.code} in ${(r.ms / 1000).toFixed(1)}s`, tail: (r.stdout + r.stderr).trim().split('\n').slice(-15).join('\n') });
  }
  return out;
}

export function runGates(opts) {
  const root = path.resolve(opts.root || '.');
  const P = paths(root);
  const outDir = path.join(P.evidence, `security-gates-${timestamp()}`);
  const failOn = opts.failOn || 'high';
  const order = ['low', 'medium', 'high', 'critical'];
  log.title(`Security gates — ${root}`);

  const scan = scanRepo(root, [].concat(opts.exclude || []), opts.includeSkills);
  for (const s of scan.secrets) s.tracked = tracked(root, s.file);
  log.ok(`scanned ${scan.scanned} text files${opts.includeSkills ? '' : ' (vendored agent skill directories excluded — use --include-skills to scan them)'}`);

  const deps = opts.skipAudit ? [{ ecosystem: '—', status: 'SKIPPED', detail: '--skip-audit' }] : dependencyAudits(root, P.commandLog);
  const checks = opts.projectChecks ? projectChecks(root, P.commandLog) : [];
  let strix = null;
  if (opts.strix) strix = strixRun({ ...opts, root, targetDir: opts.targetDir || '.' });

  // Gate table
  const gates = [];
  const worst = (list) => list.reduce((w, f) => (order.indexOf(f.severity) > order.indexOf(w) ? f.severity : w), 'low');
  gates.push({ gate: 'G1 Secrets in repository', status: scan.secrets.length ? 'FAILED' : 'VERIFIED', detail: scan.secrets.length ? `${scan.secrets.length} candidate(s), worst ${worst(scan.secrets)}` : 'no known secret patterns (pattern scan only — also scan git history and build output)' });
  gates.push({ gate: 'G2 Code risk hints', status: scan.risks.length ? 'UNVERIFIED' : 'VERIFIED', detail: scan.risks.length ? `${scan.risks.length} hint(s) need manual review` : 'no heuristic hits (does not prove absence)' });
  const depFail = deps.some((d) => d.counts && ((d.counts.critical || 0) + (d.counts.high || 0) > 0));
  const depBlocked = deps.some((d) => d.status === 'BLOCKED');
  gates.push({ gate: 'G3 Dependency vulnerabilities', status: depFail ? 'FAILED' : depBlocked ? 'BLOCKED' : deps.every((d) => ['N/A', 'SKIPPED'].includes(d.status)) ? 'N/A' : deps.some((d) => d.status === 'UNVERIFIED') ? 'UNVERIFIED' : 'VERIFIED', detail: deps.map((d) => `${d.ecosystem}:${d.status}${d.counts ? ` ${JSON.stringify(d.counts)}` : ''}`).join(' · ') });
  if (opts.projectChecks) gates.push({ gate: 'G4 Build / lint / types / tests', status: !checks.length ? 'N/A' : checks.some((x) => x.status === 'FAILED') ? 'FAILED' : 'VERIFIED', detail: checks.map((x) => `${x.check}:${x.status}`).join(' · ') || 'no package.json scripts' });
  else gates.push({ gate: 'G4 Build / lint / types / tests', status: 'SKIPPED', detail: 'run with --project-checks' });
  gates.push({ gate: 'G5 Strix authorized pentest', status: !strix ? 'SKIPPED' : { CLEAN: 'VERIFIED', FINDINGS: 'FAILED', INCOMPLETE: 'UNVERIFIED', BLOCKED: 'BLOCKED', REFUSED: 'BLOCKED', DRY: 'SKIPPED' }[strix.evidence.status] || 'FAILED', detail: strix ? `${strix.evidence.status}: ${strix.evidence.summary || ''}` : 'run with --strix --app-url http://127.0.0.1:<port>' });
  gates.push({ gate: 'G6 Manual gates (MASTER-PROMPT §5–§33)', status: 'OPEN', detail: 'threat model, authorization matrix, adversarial pass and evidence matrix are human/agent work — not automatable' });

  log.title('Findings');
  if (scan.secrets.length) table(['SEVERITY', 'RULE', 'LOCATION', 'VALUE', 'TRACKED'], scan.secrets.map((f) => [sevPaint(f.severity), f.rule, `${f.file}:${f.line}`, f.match, f.tracked == null ? '?' : f.tracked ? c.red('yes') : 'no']));
  else log.ok('no secret candidates');
  if (scan.risks.length) {
    log.raw('');
    const shown = scan.risks.slice(0, opts.verbose ? Infinity : 40);
    table(['SEVERITY', 'HINT', 'LOCATION'], shown.map((f) => [sevPaint(f.severity), f.rule, `${f.file}:${f.line}`]));
    if (shown.length < scan.risks.length) log.info(`… ${scan.risks.length - shown.length} more in report.json (use --verbose)`);
  }
  log.title('Gate summary');
  table(['GATE', 'STATUS', 'DETAIL'], gates.map((g) => [g.gate, paintStatus(g.status), g.detail.length > 110 ? g.detail.slice(0, 107) + '…' : g.detail]));

  const threshold = order.indexOf(failOn);
  const blocking = scan.secrets.filter((f) => order.indexOf(f.severity) >= threshold);
  const failed = blocking.length > 0 || depFail || checks.some((x) => x.status === 'FAILED') || strix?.evidence.status === 'FINDINGS';
  const report = { tool: 'biswodip run-security-gates', generatedAt: new Date().toISOString(), root, failOn, gates, secrets: scan.secrets, risks: scan.risks, dependencies: deps, projectChecks: checks, strix: strix?.evidence || null,
    note: 'Automated gates are evidence inputs. Release status is decided only by MASTER-PROMPT §31–§35.' };
  if (!opts.noWrite) {
    writeJSON(path.join(outDir, 'report.json'), report);
    fs.writeFileSync(path.join(outDir, 'report.md'), toMarkdown(report));
    log.ok(`evidence written: ${path.relative(root, outDir) || outDir}`);
  }
  (failed ? log.err : log.ok)(failed ? `security gates FAILED (threshold: ${failOn}) — see findings above` : 'automated gates passed their threshold — manual gates remain OPEN');
  return { code: failed ? 1 : 0, report };
}

function sevPaint(s) { return ({ critical: c.red, high: c.red, medium: c.yellow, low: c.gray })[s](s.toUpperCase()); }

function toMarkdown(r) {
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
  const L = [`# Security Gates Report`, '', `- Generated: ${r.generatedAt}`, `- Root: \`${r.root}\``, `- Fail threshold: ${r.failOn}`, '', '> Automated gates are evidence inputs. Release status is decided only by MASTER-PROMPT §31–§35.', '',
    '## Gates', '', '| Gate | Status | Detail |', '|---|---|---|', ...r.gates.map((g) => `| ${esc(g.gate)} | ${g.status} | ${esc(g.detail)} |`), '',
    '## Secret candidates', '', r.secrets.length ? '| Severity | Rule | Location | Value (masked) | Tracked |\n|---|---|---|---|---|\n' + r.secrets.map((f) => `| ${f.severity} | ${f.rule} | \`${esc(f.file)}:${f.line}\` | ${esc(f.match)} | ${f.tracked == null ? '?' : f.tracked ? 'yes' : 'no'} |`).join('\n') : '_None found by pattern scan._', '',
    'If a real secret is confirmed: rotate it, remove it from history and artifacts, add prevention, verify the replacement (SKILL §7). Never paste the value into this report.', '',
    '## Code risk hints (UNVERIFIED — review each)', '', r.risks.length ? '| Severity | Hint | Location | Why |\n|---|---|---|---|\n' + r.risks.map((f) => `| ${f.severity} | ${f.rule} | \`${esc(f.file)}:${f.line}\` | ${esc(f.why)} |`).join('\n') : '_No heuristic hits._', '',
    '## Dependency audits', '', '| Ecosystem | Status | Detail |', '|---|---|---|', ...r.dependencies.map((d) => `| ${d.ecosystem} | ${d.status} | ${esc(d.detail)}${d.counts ? ` \`${JSON.stringify(d.counts)}\`` : ''} |`), ''];
  if (r.projectChecks.length) L.push('## Project checks', '', ...r.projectChecks.flatMap((x) => [`### ${x.check} — ${x.status}`, '', x.detail, '', x.tail ? '```text\n' + x.tail + '\n```' : '', '']));
  if (r.strix) L.push('## Strix', '', '```json', JSON.stringify(r.strix, null, 2), '```', '');
  return L.join('\n');
}
