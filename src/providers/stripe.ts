import type { ProviderDefinition } from './types.js';

const TIMEOUT = 15000;

export const stripe: ProviderDefinition = {
  id: 'stripe',
  name: 'Stripe',
  color: '#635BFF',
  icon: '💳',
  credentialFields: [
    { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_live_... or sk_test_...' },
    { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_... or pk_test_...' },
  ],
  credentialHelpUrl: 'https://dashboard.stripe.com/apikeys',
  canCreateKeys: false,
  note: "Stripe doesn't support API key creation via API. Your keys are copied to each project's .env.",
  envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],

  async validateCredential(creds) {
    if (!creds.secretKey || !creds.publishableKey) {
      return { valid: false, error: 'Both secret key and publishable key are required' };
    }

    const skValid = creds.secretKey.startsWith('sk_live_') || creds.secretKey.startsWith('sk_test_') || creds.secretKey.startsWith('rk_live_') || creds.secretKey.startsWith('rk_test_');
    if (!skValid) {
      return { valid: false, error: 'Secret key should start with sk_live_, sk_test_, rk_live_, or rk_test_' };
    }

    const pkValid = creds.publishableKey.startsWith('pk_live_') || creds.publishableKey.startsWith('pk_test_');
    if (!pkValid) {
      return { valid: false, error: 'Publishable key should start with pk_live_ or pk_test_' };
    }

    try {
      // Stripe accepts Bearer auth with secret keys
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${creds.secretKey}` },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
        return { valid: false, error: err.error?.message || `Stripe returned ${res.status}` };
      }

      // Get account name
      const acctRes = await fetch('https://api.stripe.com/v1/account', {
        headers: { Authorization: `Bearer ${creds.secretKey}` },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      let accountName = 'Stripe Account';
      if (acctRes.ok) {
        const acct = await acctRes.json() as { settings?: { dashboard?: { display_name?: string } }; business_profile?: { name?: string } };
        accountName = acct.settings?.dashboard?.display_name || acct.business_profile?.name || 'Stripe Account';
      }

      const mode = creds.secretKey.includes('_test_') ? ' (test mode)' : '';
      return { valid: true, account: accountName + mode };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },
};
