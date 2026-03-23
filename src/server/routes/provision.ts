import { Hono } from 'hono';
import { getProvider } from '../../providers/registry.js';
import { getCredential } from '../../store/keychain.js';
import { createProject, writeEnv, type ProjectService } from '../../store/projects.js';
import { logAudit } from '../../store/audit.js';

const provision = new Hono();

function maskKey(value: string): string {
  if (value.length <= 12) return '****';
  return value.slice(0, 8) + '****' + value.slice(-4);
}

const PROJECT_NAME_RE = /^[a-z0-9][a-z0-9-]{0,49}$/;

provision.post('/provision', async (c) => {
  const body = await c.req.json<{ projectName: string; providerIds: string[] }>();
  const { projectName, providerIds } = body;

  if (!projectName || !PROJECT_NAME_RE.test(projectName)) {
    return c.json({ error: 'Invalid project name. Use lowercase letters, numbers, and hyphens (1-50 chars).' }, 400);
  }
  if (!providerIds || providerIds.length === 0) {
    return c.json({ error: 'Select at least one provider.' }, 400);
  }

  const allKeys: Record<string, string> = {};
  const services: Record<string, ProjectService> = {};
  const errors: Array<{ providerId: string; error: string }> = [];

  for (const providerId of providerIds) {
    const provider = getProvider(providerId);
    if (!provider) {
      errors.push({ providerId, error: 'Unknown provider' });
      continue;
    }

    const stored = await getCredential(providerId);
    if (!stored) {
      errors.push({ providerId, error: 'Not connected. Connect this service first.' });
      continue;
    }

    try {
      if (provider.canCreateKeys && provider.createKey) {
        // Merge metadata into creds for providers that need it (e.g., supabase orgId)
        const mergedCreds = { ...stored.credentials };
        if (stored.metadata) {
          for (const [k, v] of Object.entries(stored.metadata)) {
            mergedCreds[`_${k}`] = v;
          }
        }

        const result = await provider.createKey(projectName, mergedCreds);
        Object.assign(allKeys, result.keys);
        services[providerId] = { method: 'api', keyId: result.keyId, envVars: Object.keys(result.keys) };
        logAudit({ event: 'key_created', providerId, projectName });
      } else {
        // Copy stored credentials to .env
        const envMap: Record<string, string> = {};
        for (let i = 0; i < provider.envVars.length; i++) {
          const field = provider.credentialFields[i];
          if (field && stored.credentials[field.key]) {
            envMap[provider.envVars[i]] = stored.credentials[field.key];
          }
        }
        if (Object.keys(envMap).length === 0) {
          errors.push({ providerId, error: 'No credentials found to copy' });
          continue;
        }
        Object.assign(allKeys, envMap);
        services[providerId] = { method: 'copy', envVars: Object.keys(envMap) };
        logAudit({ event: 'key_copied', providerId, projectName });
      }
    } catch (e) {
      errors.push({ providerId, error: (e as Error).message });
    }
  }

  // Only create project if we got at least some keys
  if (Object.keys(allKeys).length === 0) {
    return c.json({
      success: false,
      error: 'All providers failed. No keys were provisioned.',
      errors,
    }, 400);
  }

  createProject(projectName, services);
  writeEnv(projectName, allKeys);
  logAudit({ event: 'project_created', projectName });

  const maskedVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(allKeys)) {
    maskedVars[k] = maskKey(v);
  }

  return c.json({
    success: true,
    project: {
      name: projectName,
      services: Object.fromEntries(
        Object.entries(services).map(([k, v]) => [k, { method: v.method }])
      ),
      envVars: maskedVars,
    },
    errors: errors.length > 0 ? errors : undefined,
  });
});

export default provision;
