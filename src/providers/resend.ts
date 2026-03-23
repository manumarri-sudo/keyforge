import type { ProviderDefinition } from './types.js';

const TIMEOUT = 15000;

export const resend: ProviderDefinition = {
  id: 'resend',
  name: 'Resend',
  color: '#000000',
  icon: '✉️',
  credentialFields: [
    { key: 'apiKey', label: 'API Key', placeholder: 're_...' },
  ],
  credentialHelpUrl: 'https://resend.com/api-keys',
  canCreateKeys: true,
  envVars: ['RESEND_API_KEY'],

  async validateCredential(creds) {
    if (!creds.apiKey) {
      return { valid: false, error: 'API key is required' };
    }
    if (!creds.apiKey.startsWith('re_')) {
      return { valid: false, error: 'Key should start with re_' };
    }

    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${creds.apiKey}` },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) return { valid: false, error: 'Invalid API key' };
        return { valid: false, error: `Resend returned ${res.status}` };
      }
      return { valid: true, account: 'Resend' };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },

  async createKey(projectName, creds) {
    const res = await fetch('https://api.resend.com/api-keys', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: `keyforge-${projectName}` }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message || `Resend key creation failed: ${res.status}`);
    }
    const data = await res.json() as { id: string; token: string };
    return { keys: { RESEND_API_KEY: data.token }, keyId: data.id };
  },

  async revokeKey(keyId, creds) {
    const res = await fetch(`https://api.resend.com/api-keys/${keyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Resend key revocation failed: ${res.status}`);
    }
  },
};
