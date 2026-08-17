import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DB_PATH: z.string().min(1).default('./data/fleeted.db'),
  JWT_SECRET: z.string().min(16).default('fleeted-dev-secret-change-me-123456'),
  JWT_EXPIRES_IN: z.string().min(1).default('24h'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return EnvSchema.parse(source);
}
