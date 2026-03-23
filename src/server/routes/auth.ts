import { Hono } from 'hono';
import { providers, getProvider } from '../../providers/registry.js';
import { saveCredential, getCredential, deleteCredential, listConnected } from '../../store/keychain.js';
import { logAudit } from '../../store/audit.js';

const auth = new Hono();

// GET /api/providers — list all with connection status
auth.get('/providers', async (c) => {
  const connected = await listConnected();
  const result = await Promise.all(
    providers.map(async (p) => {
      const isConnected = connected.includes(p.id);
      let account: string | undefined;
      if (isConnected) {
        const cred = await getCredential(p.id);
        account = cred?.account;
      }
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        icon: p.icon,
        connected: isConnected,
        account,
        canCreateKeys: p.canCreateKeys,
        credentialFields: p.credentialFields,
        credentialHelpUrl: p.credentialHelpUrl,
        envVars: p.envVars,
        note: p.note,
      };
    })
  );
  return c.json(result);
});

// POST /api/connect/:providerId
auth.post('/connect/:providerId', async (c) => {
  const { providerId } = c.req.param();
  const provider = getProvider(providerId);
  if (!provider) return c.json({ error: 'Unknown provider' }, 404);

  const body = await c.req.json<{ credentials: Record<string, string> }>();
  if (!body.credentials) return c.json({ error: 'Missing credentials' }, 400);

  try {
    const result = await provider.validateCredential(body.credentials);
    if (!result.valid) {
      return c.json({ error: result.error || 'Invalid credentials' }, 400);
    }

    await saveCredential(providerId, {
      credentials: body.credentials,
      account: result.account,
      connectedAt: new Date().toISOString(),
      metadata: result.metadata,
    });

    logAudit({ event: 'provider_connected', providerId });
    return c.json({ success: true, account: result.account });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

// DELETE /api/connect/:providerId
auth.delete('/connect/:providerId', async (c) => {
  const { providerId } = c.req.param();
  await deleteCredential(providerId);
  logAudit({ event: 'provider_disconnected', providerId });
  return c.json({ success: true });
});

export default auth;
