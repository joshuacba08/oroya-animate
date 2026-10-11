import { manifest } from './sync-docs.js';
const targets = [...new Set([process.env.DEPLOYMENT_URL, process.env.PUBLIC_URL].filter(Boolean))];
if (!targets.length || targets.some((base) => !/^https:\/\//.test(base))) {
  throw new Error('DEPLOYMENT_URL and optional PUBLIC_URL must be HTTPS');
}
for (const base of targets) {
  for (const route of ['/', ...manifest.filter((entry) =>
    ['getting-started', 'scene-graph', 'serialization'].includes(entry.topic)).map((entry) => entry.route)]) {
    const response = await fetch(new URL(route, base), { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(base + route + ': HTTP ' + response.status);
    const html = await response.text();
    if (!html.includes('Oroya')) throw new Error(base + route + ': unexpected page');
    if (process.env.EXPECTED_COMMIT && !html.includes('content="' + process.env.EXPECTED_COMMIT + '"')) {
      throw new Error(base + route + ': unexpected deployment commit');
    }
    if (route.endsWith('scene-graph') && !html.includes('setPosition')) throw new Error(route + ': old documentation');
    if (route.endsWith('serialization') && !html.includes('Scene(root?: Node)')) throw new Error(route + ': old root documentation');
    console.log(response.status + ' ' + base + route);
  }
}
