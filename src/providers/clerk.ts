import type { ProviderDefinition } from './types.js';

const TIMEOUT = 15000;

export const clerk: ProviderDefinition = {
  id: 'clerk',
  name: 'Clerk',
  color: '#6C47FF',
  icon: '🔐',
  credentialFields: [
    { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_... or pk_test_...' },
    { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_live_... or sk_test_...' },
  ],
  credentialHelpUrl: 'https://dashboard.clerk.com',
  canCreateKeys: false,
  note: "Clerk doesn't support per-project key creation. Your stored credentials will be shared across projects.",
  envVars: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],

  async validateCredential(creds) {
    if (!creds.secretKey || !creds.publishableKey) {
      return { valid: false, error: 'Both publishable key and secret key are required' };
    }

    const skValid = creds.secretKey.startsWith('sk_live_') || creds.secretKey.startsWith('sk_test_');
    const pkValid = creds.publishableKey.startsWith('pk_live_') || creds.publishableKey.startsWith('pk_test_');
    if (!skValid) return { valid: false, error: 'Secret key should start with sk_live_ or sk_test_' };
    if (!pkValid) return { valid: false, error: 'Publishable key should start with pk_live_ or pk_test_' };

    try {
      // Validate by calling the Clerk Backend API - list clients endpoint is lightweight
      const res = await fetch('https://api.clerk.com/v1/clients', {
        headers: { Authorization: `Bearer ${creds.secretKey}` },
        signal: AbortSignal.timeout(TIMEOUT),
      });

      if (!res.ok) {
        if (res.status === 401) return { valid: false, error: 'Invalid secret key' };
        if (res.status === 403) return { valid: false, error: 'Secret key lacks permissions' };
        // Accept if it's a server error on Clerk's side
        if (res.status >= 500) return { valid: true, account: 'Clerk' };
        return { valid: false, error: `Clerk returned ${res.status}` };
      }

      const mode = creds.secretKey.includes('_test_') ? ' (test mode)' : '';
      return { valid: true, account: 'Clerk' + mode };
    } catch (e) {
      if ((e as Error).name === 'TimeoutError') {
        return { valid: false, error: 'Clerk API timed out' };
      }
      // Network error - accept if format is valid
      return { valid: true, account: 'Clerk (offline validation)' };
    }
  },
};
