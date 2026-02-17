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

const tutorials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tutorials' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    order: z.number().default(99),
    duration: z.string().optional(),
  }),
});

export const collections = { docs, 'docs-es': docsEs, 'docs-ja': docsJa, tutorials };
