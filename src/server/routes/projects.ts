import { Hono } from 'hono';
import { listProjects, getProject, getEnvContent, exportProject, deleteProject } from '../../store/projects.js';
import { logAudit } from '../../store/audit.js';

const projects = new Hono();

// GET /api/projects
projects.get('/projects', async (c) => {
  const all = listProjects();
  return c.json(all);
});

// GET /api/projects/:name/env
projects.get('/projects/:name/env', async (c) => {
  const { name } = c.req.param();
  const env = getEnvContent(name);
  if (!env) return c.json({ error: 'Project not found' }, 404);
  return c.text(env);
});

// POST /api/projects/:name/export
projects.post('/projects/:name/export', async (c) => {
  const { name } = c.req.param();
  const body = await c.req.json<{ targetPath: string }>();
  if (!body.targetPath) return c.json({ error: 'Missing targetPath' }, 400);

  try {
    exportProject(name, body.targetPath);
    logAudit({ event: 'project_exported', projectName: name });
    return c.json({ success: true, path: body.targetPath });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

// DELETE /api/projects/:name
projects.delete('/projects/:name', async (c) => {
  const { name } = c.req.param();
  const project = getProject(name);
  if (!project) return c.json({ error: 'Project not found' }, 404);
  try {
    deleteProject(name);
    logAudit({ event: 'project_exported', projectName: name, detail: 'deleted' });
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

export default projects;
