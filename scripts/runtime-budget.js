import { chromium } from '@playwright/test';
import { cpus, platform, arch } from 'node:os';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { artifactDigest } from './artifact-digest.js';

const mode = process.argv.includes('--endurance') ? 'endurance' : 'performance';
const root = process.cwd(); const destination = resolve(root, 'validation'); mkdirSync(destination, { recursive: true });
let server;
try { await fetch('http://127.0.0.1:4175'); }
catch {
  if (!process.env.npm_execpath) throw new Error('Run this script through pnpm.');
  server = spawn(process.execPath, [process.env.npm_execpath, '--filter', 'editor', 'exec', 'vite', '--config', '../../tests/runtime/vite.config.ts'], { cwd: root, stdio: 'ignore', windowsHide: true });
  for (let i = 0; i < 120; i++) { try { await fetch('http://127.0.0.1:4175'); break; } catch { await new Promise((done) => setTimeout(done, 250)); } }
}
const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }); const page = await context.newPage();
  const errors = []; let javascriptBytes = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', async (response) => { if (/\.(?:js|ts)(?:\?|$)/.test(response.url())) try { javascriptBytes += (await response.body()).length; } catch {} });
  await page.goto('http://127.0.0.1:4175'); await page.waitForFunction(() => document.querySelector('#status')?.textContent === 'Ready');
  const environment = { platform: platform(), arch: arch(), cpu: cpus()[0].model, cores: cpus().length,
    node: process.versions.node.split('.')[0], browser: browser.version(), viewport: '1280x800', dpr: 1 };
  const report = { mode, timestamp: new Date().toISOString(), artifactDigest: artifactDigest(), environment, javascriptBytes: 0, errors };
  if (mode === 'performance') {
    await page.evaluate(() => window.validation.disposeBindings());
    report.scenarios = await page.evaluate(() => window.validation.benchmark()); report.javascriptBytes = javascriptBytes;
    const baseline = resolve(destination, 'performance-baseline.json');
    if (process.argv.includes('--record')) writeFileSync(baseline, JSON.stringify(report, null, 2) + '\n');
    else {
      const reference = JSON.parse(readFileSync(baseline, 'utf8'));
      if (JSON.stringify(environment) !== JSON.stringify(reference.environment)) throw new Error('Performance baseline requires the same machine, Node major and browser version. Record a reference for this environment first.');
      for (const [name, result] of Object.entries(report.scenarios)) {
        for (const metric of ['cpuMedianMs', 'frameMedianMs']) {
          if (result[metric] > reference.scenarios[name][metric] * 1.1) errors.push(name + ' ' + metric + ' regressed by more than 10%.');
        }
      }
    }
  } else {
    const index = process.argv.indexOf('--duration-ms'); const duration = index >= 0 ? Number(process.argv[index + 1]) : 30 * 60 * 1000;
    if (!Number.isFinite(duration) || duration < 1000) throw new Error('Invalid endurance duration.');
    report.durationMs = duration; report.initial = await page.evaluate(() => window.validation.cycles(100));
    const start = Date.now(); let lastFrames = 0; report.samples = [];
    while (Date.now() - start < duration) {
      await new Promise((done) => setTimeout(done, Math.min(30000, duration - (Date.now() - start))));
      const sample = await page.evaluate(() => ({ resources: window.validation.resources(), frames: window.validation.frames() }));
      if (sample.frames <= lastFrames) errors.push('Animation loop stopped.'); lastFrames = sample.frames;
      if (sample.resources.nodes !== report.initial.nodes || sample.resources.geometries !== report.initial.geometries || sample.resources.textures !== report.initial.textures) errors.push('Resource allocations grew during endurance.');
      report.samples.push({ elapsedMs: Date.now() - start, ...sample });
      console.log('Endurance ' + Math.round((Date.now() - start) / 1000) + 's: ' + sample.frames + ' frames, ' + sample.resources.geometries + ' geometries.');
    }
    report.final = await page.evaluate(() => { window.validation.disposeBindings(); return window.validation.dispose(); });
    if (report.final.nodes || report.final.geometries || report.final.textures) errors.push('Owned resources remain after dispose.');
    report.javascriptBytes = javascriptBytes;
  }
  writeFileSync(resolve(destination, mode + '-latest.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(mode + ': ' + errors.length + ' failures.'); if (errors.length) process.exitCode = 1;
} finally { await browser.close(); server?.kill(); }
