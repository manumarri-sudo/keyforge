import { Hono } from 'hono';
import { listProjects, getProject, getEnvContent, exportProject, deleteProject } from '../../store/projects.js';
import { getProvider } from '../../providers/registry.js';
import { getCredential } from '../../store/keychain.js';
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

  // Attempt to revoke API-created keys
  const revocationErrors: string[] = [];
  for (const [providerId, service] of Object.entries(project.services)) {
    if (service.method === 'api' && service.keyId) {
      const provider = getProvider(providerId);
      if (!provider?.revokeKey) continue;

      const stored = await getCredential(providerId);
      if (!stored) continue;

      try {
        const mergedCreds = { ...stored.credentials };
        if (stored.metadata) {
          for (const [k, v] of Object.entries(stored.metadata)) {
            mergedCreds[`_${k}`] = v;
          }
        }
        await provider.revokeKey(service.keyId, mergedCreds);
        logAudit({ event: 'key_revoked', providerId, projectName: name });
      } catch (e) {
        revocationErrors.push(`${providerId}: ${(e as Error).message}`);
      }
    }
  }

  try {
    deleteProject(name);
    logAudit({ event: 'project_deleted', projectName: name });
    return c.json({
      success: true,
      revocationErrors: revocationErrors.length > 0 ? revocationErrors : undefined,
    });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

export default projects;
