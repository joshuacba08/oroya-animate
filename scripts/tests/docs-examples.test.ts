import { describe, expect, it } from 'vitest';
import { extractExamples } from '../docs-examples.js';
const fence = (code: string, info = 'ts') => '\x60\x60\x60' + info + '\n' + code + '\n\x60\x60\x60';
describe('documentation program extraction', () => {
  it('skips setup fragments and checks programs that consume their scene', () => {
    const setup = 'import { Scene } from "@joroya/core";\nconst scene = new Scene();';
    expect(extractExamples(fence(setup))).toEqual([]);
    expect(extractExamples(fence(setup + '\nserialize(scene);'))).toHaveLength(1);
  });
  it('compiles successive tutorial steps once in their declared order', () => {
    const source = '<!-- docs-example:start -->\n' + fence('import { Scene } from "@joroya/core";\nconst scene = new Scene();') +
      '\n## Next step\n' + fence('renderer.mount(scene);') + '\n<!-- docs-example:end -->';
    const examples = extractExamples(source);
    expect(examples).toHaveLength(1);
    expect(examples[0].code.indexOf('const scene')).toBeLessThan(examples[0].code.indexOf('renderer.mount'));
  });
  it('accepts explicit complete TSX and excludes explicit fragments', () => {
    expect(extractExamples(fence('export default function App() { return <div />; }', 'tsx complete'))[0].jsx).toBe(true);
    expect(extractExamples(fence('const scene = new Scene();\nrenderer.mount(scene);', 'ts fragment'))).toEqual([]);
  });
  it('rejects empty grouped programs', () => {
    expect(() => extractExamples('<!-- docs-example:start -->\n<!-- docs-example:end -->')).toThrow('Empty');
  });
});
