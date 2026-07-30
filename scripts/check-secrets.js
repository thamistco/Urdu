/* eslint-disable */
/**
 * Refuse to let a credential into the repository.
 *
 * A Google TTS API key was pasted into a chat window during this project's
 * development, and used in memory to generate the voice clips. It was never
 * written to a file — but "never written to a file" was a habit, not a
 * guarantee, and a habit is exactly what fails on the day someone is in a
 * hurry. `.gitignore` protects `.env`; nothing protected a key pasted directly
 * into a script while debugging.
 *
 * This scans what git actually tracks, because that is what gets pushed. It
 * looks for the shapes of real credentials rather than the word "key", so it
 * does not fire on `GOOGLE_TTS_API_KEY` as an environment variable name — which
 * is the correct way to refer to one and appears throughout this repo.
 *
 *   npm run check:secrets
 *
 * A finding here is not a lint warning. If it fires on something already
 * committed, the secret is compromised and must be rotated at the provider —
 * removing it from the working tree does not remove it from git history.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/**
 * Each pattern is a credential *shape*, with the provider it belongs to.
 * Deliberately narrow: a scanner that cries wolf gets switched off, and a
 * switched-off scanner is worse than none because it is believed.
 */
const PATTERNS = [
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: 'Slack token', re: /\bxox[abprs]-[0-9A-Za-z-]{10,}\b/ },
  { name: 'Stripe secret key', re: /\bsk_live_[0-9A-Za-z]{24,}\b/ },
  { name: 'OpenAI key', re: /\bsk-[A-Za-z0-9]{32,}\b/ },
  { name: 'private key block', re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'Supabase service role JWT', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/ },
];

/** Binary and generated files: no credentials, lots of false positives. */
const SKIP = /\.(mp3|png|jpg|jpeg|ico|ttf|woff2?|zip|gz|pdf)$/i;

let files;
try {
  files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
} catch {
  console.log('check:secrets — not a git checkout, nothing tracked to scan. Skipping.');
  process.exit(0);
}

const findings = [];
for (const rel of files) {
  if (SKIP.test(rel)) continue;
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const text = fs.readFileSync(abs, 'utf8');
  text.split('\n').forEach((line, i) => {
    // This file necessarily contains the patterns it looks for.
    if (rel === 'scripts/check-secrets.js') return;
    for (const p of PATTERNS) {
      if (p.re.test(line)) findings.push({ rel, line: i + 1, name: p.name });
    }
  });
}

/**
 * Self-test. A scanner that silently stops matching is the worst possible
 * outcome — it reports "clean" forever. So it is made to find something it
 * should, on a string that is not a real key.
 */
const CANARY = 'AIza' + 'S'.repeat(35);
if (!PATTERNS[0].re.test(CANARY)) {
  console.error('check:secrets — the scanner does not match its own canary. It is broken, not the repo.');
  process.exit(1);
}

if (findings.length) {
  console.error(
    `check:secrets — ${findings.length} possible credential${findings.length === 1 ? '' : 's'} in tracked files:\n`
  );
  for (const f of findings) console.error(`  ${f.rel}:${f.line}  looks like a ${f.name}`);
  console.error('\nIf this is already pushed, the secret is compromised: rotate it at the provider.');
  console.error('Removing it from the working tree does not remove it from git history.');
  process.exit(1);
}
console.log(`check:secrets — ${files.length} tracked files scanned, no credentials found.`);
