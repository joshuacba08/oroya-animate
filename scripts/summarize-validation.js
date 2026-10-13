import { readFileSync, writeFileSync } from 'node:fs';
import { artifactDigest } from './artifact-digest.js';

const read = (path) => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const browserPath = 'validation/browser.json';
const browserText = readFileSync(browserPath, 'utf8').replace(/^\uFEFF/, '');
const browser = JSON.parse(browserText.slice(browserText.indexOf('{')));
writeFileSync(browserPath, JSON.stringify(browser, null, 2) + '\n');
const unit = Object.fromEntries(['unit-tests', 'unit-node18', 'unit-node20', 'react18'].map((name) => {
  const report = read('validation/' + name + '.json');
  return [name, { passed: report.numPassedTests, failed: report.numFailedTests, files: report.testResults.length, success: report.success }];
}));
const performance = read('validation/performance-latest.json');
const endurance = read('validation/endurance-latest.json');
const packages = read('validation/package-consumers.json');
const digest = artifactDigest();
const errors = [];
for (const [name, evidence] of Object.entries({ performance, endurance, packages })) {
  if (evidence.artifactDigest !== digest) errors.push(name + ' artifacts differ.');
}
if (Object.values(unit).some((result) => !result.success || result.failed)) errors.push('Unit validation failed.');
if (browser.stats.unexpected || browser.stats.flaky || browser.stats.skipped) errors.push('Browser validation failed or incomplete.');
if (performance.errors.length || endurance.errors.length || endurance.durationMs < 1800000) errors.push('Runtime budget failed or incomplete.');
const report = { timestamp: new Date().toISOString(), artifactDigest: digest, unit, browser: browser.stats,
  packages: packages.packages.length, packageChecks: read('validation/package-checks.json'),
  performance: performance.scenarios, endurance: { durationMs: endurance.durationMs, samples: endurance.samples.length, final: endurance.final },
  errors, pending: ['Physical Safari/iOS and Chrome/Android acceptance', 'Remote Windows/Linux CI execution', 'npm authentication/configuration and candidate/stable publication'] };
writeFileSync('validation/local-summary.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exitCode = errors.length ? 1 : 0;
