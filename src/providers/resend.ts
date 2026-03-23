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
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${creds.apiKey}` },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) return { valid: false, error: `Resend returned ${res.status}` };
      return { valid: true, account: 'Resend Account' };
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
      body: JSON.stringify({ name: projectName }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`Resend key creation failed: ${res.status}`);
    const data = await res.json() as { id: string; token: string };
    return { keys: { RESEND_API_KEY: data.token }, keyId: data.id };
  },

  async revokeKey(keyId, creds) {
    const res = await fetch(`https://api.resend.com/api-keys/${keyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${creds.apiKey}` },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(`Resend key revocation failed: ${res.status}`);
  },
};
