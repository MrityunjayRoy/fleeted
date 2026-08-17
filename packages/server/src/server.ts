import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createContainer } from './config/container.js';

const env = loadEnv();
const PORT = env.PORT;

const container = createContainer(env.DB_PATH, {
  runMigrations: true,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
});

const app = createApp(container);

const server = app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`[server] received ${signal}, shutting down`);
  server.close(() => {
    console.log('[server] closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
