async function metadata(name, suffix, fetcher) {
  const url = 'https://registry.npmjs.org/' + encodeURIComponent(name) + suffix + '?oroya_release=' + Date.now();
  const response = await fetcher(url, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15000) });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error('Registry lookup failed for ' + name + ': HTTP ' + response.status);
  return response.json();
}
export async function registryVersion(name, version, fetcher = fetch) {
  const result = await metadata(name, '/' + encodeURIComponent(version), fetcher);
  if (!result) return undefined;
  if (result.name !== name || result.version !== version) throw new Error('Unexpected registry version response for ' + name);
  return result.version;
}
export async function registryTag(name, tag, fetcher = fetch) {
  const result = await metadata(name, '', fetcher);
  return result?.['dist-tags']?.[tag];
}
export async function waitForRegistry(read, expected, wait = (ms) => new Promise((done) => setTimeout(done, ms))) {
  for (let attempt = 0; attempt < 90; attempt++) {
    if (await read() === expected) return;
    if (attempt < 89) await wait(2000);
  }
  throw new Error('Registry propagation timeout for ' + expected);
}
