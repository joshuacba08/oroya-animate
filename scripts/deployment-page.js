/** Wait for public alias propagation while keeping immutable-build checks strict. */
export async function deploymentPage(url, expectedCommit, headers, {
  publicAlias = false, fetcher = fetch, wait = (ms) => new Promise((done) => setTimeout(done, ms)),
} = {}) {
  const attempts = publicAlias ? 30 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const target = new URL(url);
    if (publicAlias && expectedCommit) target.searchParams.set('oroya_verify', expectedCommit + '-' + attempt);
    const response = await fetcher(target, { signal: AbortSignal.timeout(20000), headers: { ...headers, 'cache-control': 'no-cache' } });
    if (!response.ok) throw new Error(url + ': HTTP ' + response.status);
    const html = await response.text();
    if (!html.includes('Oroya')) throw new Error(url + ': unexpected page');
    if (!expectedCommit || html.includes('content="' + expectedCommit + '"')) return html;
    if (attempt + 1 < attempts) await wait(2000);
  }
  throw new Error(url + ': unexpected deployment commit after propagation wait');
}
