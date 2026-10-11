#!/usr/bin/env node
import ts from 'typescript';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { manifest, root } from './sync-docs.js';
import { extractExamples } from './docs-examples.js';

const errors = [];
const routes = new Set(['/', '/es', '/ja', '/docs', '/es/docs', '/ja/docs']);
for (const entry of manifest) {
  routes.add(entry.route);
  if (entry.locale === 'en') for (const locale of ['es', 'ja']) routes.add('/' + locale + entry.route);
}
for (const page of ['examples', 'playground', 'learn', 'tutorials']) {
  for (const prefix of ['', '/es', '/ja']) routes.add(prefix + '/' + page);
}
let links = 0;
for (const entry of manifest) {
  const body = readFileSync(resolve(root, entry.source), 'utf8').replace(/\x60{3}[^\n]*\n[\s\S]*?\x60{3}/g, '');
  for (const match of body.matchAll(/\]\(([^\s)]+)\)/g)) {
    const href = match[1].split('#')[0].split('?')[0];
    if (!href || /^[a-z]+:/i.test(href)) continue;
    links++;
    if (href.startsWith('/')) {
      if (!routes.has(href.replace(/\/$/, '') || '/') && !existsSync(resolve(root, 'apps/web/public', href.slice(1)))) {
        errors.push(entry.source + ': missing route ' + href);
      }
    } else if (!existsSync(resolve(root, dirname(entry.source), decodeURIComponent(href)))) {
      errors.push(entry.source + ': missing file ' + href);
    }
  }
}

// Check standalone programs and explicitly grouped tutorial steps across every locale.
const virtual = new Map();
const labels = new Map();
let count = 0;
for (const entry of manifest) {
  for (const example of extractExamples(readFileSync(resolve(root, entry.source), 'utf8'))) {
    const file = resolve(root, 'apps/web/src/__docs_example_' + count++ + (example.jsx ? '.tsx' : '.ts'));
    virtual.set(file, example.code);
    labels.set(file, entry.source);
  }
}
const config = ts.readConfigFile(resolve(root, 'tsconfig.base.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const options = { ...parsed.options, composite: false, noEmit: true, jsx: ts.JsxEmit.ReactJSX };
const host = ts.createCompilerHost(options);
const getSource = host.getSourceFile.bind(host);
host.getSourceFile = (file, version, onError) => virtual.has(resolve(file))
  ? ts.createSourceFile(file, virtual.get(resolve(file)), version, true) : getSource(file, version, onError);
const program = ts.createProgram([...virtual.keys()], options, host);
for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
  errors.push(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') +
    (diagnostic.file ? ' (' + (labels.get(resolve(diagnostic.file.fileName)) ?? diagnostic.file.fileName) + ':' + diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + ')' : ''));
}
for (const error of errors) console.error(error);
console.log(links + ' local links checked; ' + count + ' complete examples compiled; ' + errors.length + ' errors.');
if (errors.length) process.exitCode = 1;
