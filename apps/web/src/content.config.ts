import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docsSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  order: z.number().default(99),
  category: z.string().default('guide'),
});

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: docsSchema,
});

const docsEs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs-es' }),
  schema: docsSchema,
});

const docsJa = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs-ja' }),
  schema: docsSchema,
});

const tutorialSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  order: z.number().default(99),
  duration: z.string().optional(),
});

const tutorials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tutorials' }),
  schema: tutorialSchema,
});

// Localized tutorial collections. Each holds the *translated* version of a
// tutorial whose slug matches a file in the default `tutorials/` collection.
// The locale pages prefer the localized version and fall back to the default
// when no translation exists — this lets us ship English-only legacy
// tutorials alongside fully-localized new ones without a big-bang migration.
const tutorialsEs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tutorials-es' }),
  schema: tutorialSchema,
});

const tutorialsJa = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tutorials-ja' }),
  schema: tutorialSchema,
});

export const collections = {
  docs,
  'docs-es': docsEs,
  'docs-ja': docsJa,
  tutorials,
  'tutorials-es': tutorialsEs,
  'tutorials-ja': tutorialsJa,
};
