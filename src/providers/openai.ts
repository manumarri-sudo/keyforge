import type { ProviderDefinition } from './types.js';

const TIMEOUT = 15000;

export const openai: ProviderDefinition = {
  id: 'openai',
  name: 'OpenAI',
  color: '#10A37F',
  icon: '🤖',
  credentialFields: [
    { key: 'adminKey', label: 'Admin API Key', placeholder: 'sk-admin-...' },
  ],
  credentialHelpUrl: 'https://platform.openai.com/settings/organization/admin-keys',
  canCreateKeys: true,
  envVars: ['OPENAI_API_KEY'],

  async validateCredential(creds) {
    try {
      const res = await fetch('https://api.openai.com/v1/organization/me', {
        headers: { Authorization: `Bearer ${creds.adminKey}` },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) return { valid: false, error: `OpenAI returned ${res.status}` };
      const data = await res.json() as { name?: string; id?: string };
      return { valid: true, account: data.name || data.id || 'OpenAI Org' };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },

  async createKey(projectName, creds) {
    const res = await fetch('https://api.openai.com/v1/organization/admin_api_keys', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.adminKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: projectName }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`OpenAI key creation failed: ${res.status}`);
    const data = await res.json() as { value: string; id: string };
    return { keys: { OPENAI_API_KEY: data.value }, keyId: data.id };
  },

  async revokeKey(keyId, creds) {
    const res = await fetch(`https://api.openai.com/v1/organization/admin_api_keys/${keyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${creds.adminKey}` },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`OpenAI key revocation failed: ${res.status}`);
  },
};
