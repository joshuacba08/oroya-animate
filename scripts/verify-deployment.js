import { manifest } from './sync-docs.js';
import { readFileSync } from 'node:fs';
import { verificationHeaders } from './deployment-auth.js';
import { deploymentPage } from './deployment-page.js';
const state = process.env.DEPLOYMENT_STORAGE_STATE
  ? JSON.parse(readFileSync(process.env.DEPLOYMENT_STORAGE_STATE, 'utf8')) : { cookies: [] };
const targets = [...new Set([process.env.DEPLOYMENT_URL, process.env.PUBLIC_URL].filter(Boolean))];
if (!targets.length || targets.some((base) => !/^https:\/\//.test(base))) {
  throw new Error('DEPLOYMENT_URL and optional PUBLIC_URL must be HTTPS');
}
for (const base of targets) {
  for (const route of ['/', ...manifest.filter((entry) =>
    ['getting-started', 'scene-graph', 'serialization', 'renderers'].includes(entry.topic)).map((entry) => entry.route)]) {
    const html = await deploymentPage(new URL(route, base), process.env.EXPECTED_COMMIT,
      verificationHeaders(base, process.env.DEPLOYMENT_URL, state), { publicAlias: base === process.env.PUBLIC_URL });
    if (route.endsWith('scene-graph') && !html.includes('setPosition')) throw new Error(route + ': old documentation');
    if (route.endsWith('serialization') && !html.includes('Scene(root?: Node)')) throw new Error(route + ': old root documentation');
    if (route.endsWith('renderers') && !html.includes('SvgRenderer')) throw new Error(route + ': old SVG documentation');
    console.log('200 ' + base + route);
  }
}
