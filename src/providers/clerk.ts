import type { ProviderDefinition } from './types.js';

export const clerk: ProviderDefinition = {
  id: 'clerk',
  name: 'Clerk',
  color: '#6C47FF',
  icon: '🔐',
  credentialFields: [
    { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_...' },
    { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_live_...' },
  ],
  credentialHelpUrl: 'https://dashboard.clerk.com',
  canCreateKeys: false,
  note: "Clerk doesn't support per-project key creation. Your stored credentials will be shared across projects.",
  envVars: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],

  async validateCredential(creds) {
    const skValid = creds.secretKey.startsWith('sk_live_') || creds.secretKey.startsWith('sk_test_');
    const pkValid = creds.publishableKey.startsWith('pk_live_') || creds.publishableKey.startsWith('pk_test_');
    if (!skValid) return { valid: false, error: 'Secret key should start with sk_live_ or sk_test_' };
    if (!pkValid) return { valid: false, error: 'Publishable key should start with pk_live_ or pk_test_' };
    return { valid: true, account: 'Clerk Account' };
  },
};
