import type { ProviderDefinition } from './types.js';

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
    if (!creds.apiKey.startsWith('sk-ant-')) {
      return { valid: false, error: 'Key should start with sk-ant-' };
    }
    return { valid: true, account: 'Anthropic Account' };
  },
};
