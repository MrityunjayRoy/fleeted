import { createContainer } from '../config/container.js';
import { loadEnv } from '../config/env.js';
import { seed } from './seed.js';

const env = loadEnv();
const container = createContainer(env.DB_PATH, {
  runMigrations: true,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
});

await seed(container);
console.log('[seed] demo data ready');
