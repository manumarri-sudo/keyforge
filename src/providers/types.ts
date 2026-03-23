export interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  color: string;
  icon: string;

  // Connection config
  credentialFields: CredentialField[];
  credentialHelpUrl: string;

  // Capabilities
  canCreateKeys: boolean;

  // Note for UI when canCreateKeys is false
  note?: string;

  // Validation
  validateCredential: (creds: Record<string, string>) => Promise<{
    valid: boolean;
    account?: string;
    error?: string;
    metadata?: Record<string, string>;
  }>;

  // Key creation (only called if canCreateKeys is true)
  createKey?: (projectName: string, creds: Record<string, string>) => Promise<{
    keys: Record<string, string>;
    keyId?: string;
  }>;

  // What goes in .env
  envVars: string[];

  // Cleanup
  revokeKey?: (keyId: string, creds: Record<string, string>) => Promise<void>;
}
