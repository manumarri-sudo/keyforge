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

// CORS for dev
app.use('/api/*', cors());

// API routes
app.route('/api', auth);
app.route('/api', provision);
app.route('/api', projects);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

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
