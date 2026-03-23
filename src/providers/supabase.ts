import crypto from 'node:crypto';
import type { ProviderDefinition } from './types.js';

const TIMEOUT = 15000;

export const supabase: ProviderDefinition = {
  id: 'supabase',
  name: 'Supabase',
  color: '#3FCF8E',
  icon: '⚡',
  credentialFields: [
    { key: 'accessToken', label: 'Personal Access Token', placeholder: 'sbp_...' },
  ],
  credentialHelpUrl: 'https://supabase.com/dashboard/account/tokens',
  canCreateKeys: true,
  envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],

  async validateCredential(creds) {
    try {
      const [projRes, orgRes] = await Promise.all([
        fetch('https://api.supabase.com/v1/projects', {
          headers: { Authorization: `Bearer ${creds.accessToken}` },
          signal: AbortSignal.timeout(TIMEOUT),
        }),
        fetch('https://api.supabase.com/v1/organizations', {
          headers: { Authorization: `Bearer ${creds.accessToken}` },
          signal: AbortSignal.timeout(TIMEOUT),
        }),
      ]);
      if (!projRes.ok) return { valid: false, error: `Supabase returned ${projRes.status}` };
      const orgs = await orgRes.json() as Array<{ id: string; name: string }>;
      const orgId = orgs[0]?.id || '';
      const orgName = orgs[0]?.name || 'Supabase Account';
      return { valid: true, account: orgName, metadata: { orgId } };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },

  async createKey(projectName, creds) {
    const dbPass = crypto.randomBytes(18).toString('base64url').slice(0, 24);
    const orgId = creds._orgId || creds.orgId;
    if (!orgId) throw new Error('Supabase org ID not found. Please reconnect.');

    const createRes = await fetch('https://api.supabase.com/v1/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        organization_id: orgId,
        plan: 'free',
        region: 'us-east-1',
        db_pass: dbPass,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!createRes.ok) throw new Error(`Supabase project creation failed: ${createRes.status}`);
    const project = await createRes.json() as { id: string; ref?: string };
    const ref = project.ref || project.id;

    // Poll for readiness (up to 60s)
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
        headers: { Authorization: `Bearer ${creds.accessToken}` },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (statusRes.ok) {
        const s = await statusRes.json() as { status: string };
        if (s.status === 'ACTIVE_HEALTHY') break;
      }
    }

    const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
      headers: { Authorization: `Bearer ${creds.accessToken}` },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!keysRes.ok) throw new Error('Failed to fetch Supabase API keys');
    const apiKeys = await keysRes.json() as Array<{ name: string; api_key: string }>;

    const anonKey = apiKeys.find((k) => k.name === 'anon')?.api_key || '';
    const serviceKey = apiKeys.find((k) => k.name === 'service_role')?.api_key || '';
    const url = `https://${ref}.supabase.co`;

    return {
      keys: {
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
        SUPABASE_SERVICE_ROLE_KEY: serviceKey,
      },
      keyId: ref,
    };
  },
};
