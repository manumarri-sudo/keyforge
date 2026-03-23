import type { ProviderDefinition } from './types.js';

const TIMEOUT = 15000;

export const stripe: ProviderDefinition = {
  id: 'stripe',
  name: 'Stripe',
  color: '#635BFF',
  icon: '💳',
  credentialFields: [
    { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_live_...' },
    { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_...' },
  ],
  credentialHelpUrl: 'https://dashboard.stripe.com/apikeys',
  canCreateKeys: false,
  note: 'Stripe OAuth integration coming soon. For now, your keys are shared across projects.',
  envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],

  async validateCredential(creds) {
    try {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${creds.secretKey}` },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) return { valid: false, error: `Stripe returned ${res.status}` };
      return { valid: true, account: 'Stripe Account' };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },
};
