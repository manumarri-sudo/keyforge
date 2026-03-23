import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import auth from './routes/auth.js';
import provision from './routes/provision.js';
import projects from './routes/projects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = new Hono();

// CORS - restrict to localhost origins only
app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) return 'http://localhost:4000'; // same-origin requests
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return origin;
    }
    return 'http://localhost:4000';
  },
}));

// Global error handler
app.onError((err, c) => {
  console.error(`[KeyForge] Error: ${err.message}`);
  return c.json({ error: 'Internal server error' }, 500);
});

// Request body size limit (1MB) via middleware
app.use('/api/*', async (c, next) => {
  const contentLength = c.req.header('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1_048_576) {
    return c.json({ error: 'Request body too large' }, 413);
  }
  await next();
});

// API routes
app.route('/api', auth);
app.route('/api', provision);
app.route('/api', projects);

// Health check
app.get('/api/health', async (c) => {
  const projectRoot = path.resolve(__dirname, '../..');
  const dataDir = path.join(projectRoot, 'data');
  const writable = (() => {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      const testFile = path.join(dataDir, '.health-check');
      fs.writeFileSync(testFile, '');
      fs.unlinkSync(testFile);
      return true;
    } catch { return false; }
  })();
  return c.json({ status: 'ok', dataDir: writable ? 'writable' : 'read-only' });
});

// In production/dev, serve the built frontend from dist/web
const projectRoot = path.resolve(__dirname, '../..');
const distPath = path.join(projectRoot, 'dist', 'web');
if (fs.existsSync(distPath)) {
  app.use('/*', serveStatic({ root: path.relative(process.cwd(), distPath) }));
  // SPA fallback
  app.get('*', (c) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return c.html(fs.readFileSync(indexPath, 'utf-8'));
    }
    return c.text('Not found', 404);
  });
}

const port = 4000;
console.log(`KeyForge server running at http://localhost:${port}`);
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });

export default app;
