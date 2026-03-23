import type { ProviderDefinition } from './types.js';
import { openai } from './openai.js';
import { supabase } from './supabase.js';
import { resend } from './resend.js';
import { anthropic } from './anthropic.js';
import { stripe } from './stripe.js';
import { clerk } from './clerk.js';

export const providers: ProviderDefinition[] = [
  openai,
  supabase,
  resend,
  anthropic,
  stripe,
  clerk,
];

export function getProvider(id: string): ProviderDefinition | undefined {
  return providers.find((p) => p.id === id);
}
