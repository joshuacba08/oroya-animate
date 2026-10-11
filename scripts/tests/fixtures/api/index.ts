export * from './a';
export { Direct as Alias, Direct as SecondAlias } from './a';
export type { Shape as RenamedShape } from './a';
/** @public */
export const direct = 1;
export { secret } from './b';
export * from './unresolved';
