import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { createDbClient } from './client.js';

const dbPath = process.env.DB_PATH ?? './data/fleeted.db';
mkdirSync(dirname(dbPath), { recursive: true });

const db = createDbClient(dbPath);
migrate(db, {
  migrationsFolder: fileURLToPath(new URL('./migrations', import.meta.url)),
});

console.log(`[db] migrations applied (${dbPath})`);
