import type { ProviderDefinition } from './types.js';

const TIMEOUT = 15000;

export const anthropic: ProviderDefinition = {
  id: 'anthropic',
  name: 'Anthropic',
  color: '#D4A574',
  icon: '🧠',
  credentialFields: [
    { key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...' },
  ],
  credentialHelpUrl: 'https://console.anthropic.com/settings/keys',
  canCreateKeys: false,
  note: "Anthropic doesn't support per-project key creation. Your stored key will be shared across projects.",
  envVars: ['ANTHROPIC_API_KEY'],

  async validateCredential(creds) {
    if (!creds.apiKey) {
      return { valid: false, error: 'API key is required' };
    }
    if (!creds.apiKey.startsWith('sk-ant-')) {
      return { valid: false, error: 'Key should start with sk-ant-' };
    }

    try {
      // Use the models list endpoint - lightweight, no cost
      const res = await fetch('https://api.anthropic.com/v1/models?limit=1', {
        headers: {
          'x-api-key': creds.apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: AbortSignal.timeout(TIMEOUT),
      });

      if (!res.ok) {
        if (res.status === 401) return { valid: false, error: 'Invalid API key' };
        if (res.status === 403) return { valid: false, error: 'API key lacks permissions' };
        // Some keys may not have models:read, fall back to format validation
        return { valid: true, account: 'Anthropic' };
      }

      return { valid: true, account: 'Anthropic' };
    } catch (e) {
      // Network error - accept key if format is valid (offline validation)
      if ((e as Error).name === 'TimeoutError') {
        return { valid: false, error: 'Anthropic API timed out' };
      }
      return { valid: true, account: 'Anthropic (offline validation)' };
    }
  },
};
