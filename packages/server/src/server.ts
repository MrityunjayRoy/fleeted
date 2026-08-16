import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 4000);

const app = createApp();

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
