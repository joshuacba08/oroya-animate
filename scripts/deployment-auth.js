import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Restrict generated authorization cookies to this deployment's exact hostname.
export function storageFromCookieJar(text, deploymentUrl) {
  const hostname = new URL(deploymentUrl).hostname;
  const cookies = [];
  for (const original of text.split(/\r?\n/)) {
    const httpOnly = original.startsWith('#HttpOnly_');
    const line = httpOnly ? original.slice('#HttpOnly_'.length) : original;
    if (!line || line.startsWith('#')) continue;
    const [domain, , path, secure, expiry, name, value] = line.split('\t');
    if (!name || value === undefined) continue;
    const normalized = domain.replace(/^\./, '');
    if (hostname !== normalized && !hostname.endsWith('.' + normalized)) {
      throw new Error('Unexpected authorization cookie domain');
    }
    cookies.push({ name, value, domain: hostname, path, secure: secure === 'TRUE',
      expires: Number(expiry) || -1, httpOnly, sameSite: 'Lax' });
  }
  return { cookies, origins: [] };
}

export function verificationHeaders(url, deploymentUrl, state) {
  if (new URL(url).origin !== new URL(deploymentUrl).origin) return {};
  const cookie = state.cookies.map(({ name, value }) => name + '=' + value).join('; ');
  return cookie ? { cookie } : {};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.env.RUNNER_TEMP || !process.env.DEPLOYMENT_URL) throw new Error('Expected deployment job environment');
  const state = storageFromCookieJar(
    readFileSync(join(process.env.RUNNER_TEMP, 'vercel-deployment-cookies.txt'), 'utf8'),
    process.env.DEPLOYMENT_URL);
  writeFileSync(join(process.env.RUNNER_TEMP, 'vercel-deployment-state.json'), JSON.stringify(state), { mode: 0o600 });
  console.log('Prepared scoped authentication for protected deployment checks.');
}
