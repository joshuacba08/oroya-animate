import ts from 'typescript';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd(); const baselinePath = resolve(root, 'scripts/api-baseline.json');
const normalize = (value) => value.replace(/import\("[^"]+"\)\./g, '').replace(/\bReact\.JSX\./g, 'JSX.');
export function snapshotAPI(originalRef) {
  const paths = readdirSync(resolve(root, 'packages')).map((name) => resolve(root, 'packages', name, 'src/index.ts'));
  const config = ts.readConfigFile(resolve(root, 'tsconfig.base.json'), ts.sys.readFile);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  const host = ts.createCompilerHost(options); const originalRead = host.readFile.bind(host);
  if (originalRef) {
    const files = spawnSync('git', ['ls-tree', '-r', '--name-only', originalRef, 'packages'], { encoding: 'utf8' });
    if (files.status) throw new Error(files.stderr);
    const originals = new Set(files.stdout.trim().split('\n').map((file) => resolve(root, file)));
    host.readFile = (file) => {
      if (!originals.has(resolve(file))) return originalRead(file);
      const result = spawnSync('git', ['show', originalRef + ':' + relative(root, file).replaceAll('\\', '/')], { encoding: 'utf8' });
      if (result.status) throw new Error(result.stderr);
      return result.stdout;
    };
  }
  const program = ts.createProgram(paths, options, host); const checker = program.getTypeChecker(); const entries = {};
  const describe = (type, signatures = type.getCallSignatures()) => {
    if (signatures.length) return { signatures: signatures.map((signature) => ({
      parameters: signature.parameters.map((parameter) => ({
        type: normalize(checker.typeToString(checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? parameter.declarations[0]), undefined, ts.TypeFormatFlags.NoTruncation)),
        optional: !!(parameter.flags & ts.SymbolFlags.Optional) || parameter.declarations?.some((declaration) => !!declaration.questionToken || !!declaration.initializer),
      })), returns: normalize(checker.typeToString(signature.getReturnType(), undefined, ts.TypeFormatFlags.NoTruncation)),
    })) };
    return { type: normalize(checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)) };
  };
  for (const file of paths) {
    const source = program.getSourceFile(file); const module = source && checker.getSymbolAtLocation(source); if (!module) continue;
    for (const exported of checker.getExportsOfModule(module)) {
      const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]; if (!declaration) continue;
      const key = relative(root, file).replaceAll('\\', '/') + ':' + exported.name;
      const type = symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias) ? checker.getDeclaredTypeOfSymbol(symbol) : checker.getTypeOfSymbolAtLocation(symbol, declaration);
      const members = {};
      if (ts.isEnumDeclaration(declaration)) {
        entries[key] = { enumeration: Object.fromEntries(declaration.members.map((member) => [member.name.getText(), checker.getConstantValue(member)])) };
      } else if (symbol.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) {
        for (const member of type.getProperties()) {
          const declarations = member.declarations ?? [];
          if (declarations.some((item) => item.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword))) continue;
          const location = member.valueDeclaration ?? declarations[0]; if (!location) continue;
          members[member.name] = { ...describe(checker.getTypeOfSymbolAtLocation(member, location)), optional: !!(member.flags & ts.SymbolFlags.Optional) };
        }
        entries[key] = { members };
        if (symbol.flags & ts.SymbolFlags.Class) {
          const valueType = checker.getTypeOfSymbolAtLocation(symbol, declaration);
          entries[key].constructors = describe(valueType, valueType.getConstructSignatures());
          entries[key].statics = {};
          for (const member of valueType.getProperties()) {
            if (member.name === 'prototype') continue;
            const location = member.valueDeclaration ?? member.declarations?.[0];
            if (location && !location.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword || modifier.kind === ts.SyntaxKind.ProtectedKeyword)) entries[key].statics[member.name] = describe(checker.getTypeOfSymbolAtLocation(member, location));
          }
        }
      } else entries[key] = describe(type);
    }
  }
  return entries;
}

export function compareAPI(baseline, current) {
  const failures = [];
  const typeCompatible = (old, next) => old === next || next === 'unknown' || (next === 'string' && /^(?:"[^"]+"\s*\|?\s*)+$/.test(old));
  const check = (old, next, key) => {
    if (!next) { failures.push(key + ' removed'); return; }
    if (old.members) {
      for (const [name, member] of Object.entries(old.members)) check(member, next.members?.[name], key + '.' + name);
      // A new required interface property can break consumers constructing it.
      if (key.includes('Def') || key.endsWith('Options') || key.endsWith('Props')) for (const [name, member] of Object.entries(next.members ?? {})) {
        if (!(name in old.members) && !member.optional) failures.push(key + '.' + name + ' adds a required property');
      }
      if (old.constructors) check(old.constructors, next.constructors, key + '.constructor');
      for (const [name, member] of Object.entries(old.statics ?? {})) check(member, next.statics?.[name], key + '.' + name);
    } else if (old.enumeration) {
      for (const [name, value] of Object.entries(old.enumeration)) if (next.enumeration?.[name] !== value) failures.push(key + '.' + name + ' changed enum value');
    } else if (old.signatures) {
      for (const signature of old.signatures) {
        if (!next.signatures?.some((candidate) => candidate.returns === signature.returns &&
          signature.parameters.every((parameter, i) => candidate.parameters[i] && typeCompatible(parameter.type, candidate.parameters[i].type) && (!parameter.optional || candidate.parameters[i].optional)) &&
          candidate.parameters.slice(signature.parameters.length).every((parameter) => parameter.optional))) failures.push(key + ' changed a call signature');
      }
    } else if (!typeCompatible(old.type, next.type)) failures.push(key + ' changed type: ' + old.type + ' -> ' + next.type);
    if (old.optional && !next.optional) failures.push(key + ' is now required');
  };
  for (const [key, value] of Object.entries(baseline)) check(value, current[key], key);
  return failures;
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/api-compatibility.js')) {
  const index = process.argv.indexOf('--baseline-from');
  if (index >= 0) writeFileSync(baselinePath, JSON.stringify(snapshotAPI(process.argv[index + 1]), null, 2) + '\n');
  else {
    const failures = compareAPI(JSON.parse(readFileSync(baselinePath, 'utf8')), snapshotAPI());
    failures.forEach((failure) => console.error(failure)); console.log('API compatibility: ' + failures.length + ' changes needing review.'); process.exitCode = failures.length ? 1 : 0;
  }
}
