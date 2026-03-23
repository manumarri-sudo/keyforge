const BASE = '/api';

let _apiAvailable: boolean | null = null;

export async function checkApiAvailable(): Promise<boolean> {
  if (_apiAvailable !== null) return _apiAvailable;
  try {
    const res = await fetch(`${BASE}/providers`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) { _apiAvailable = false; return false; }
    // Verify it's actual JSON from the API, not HTML from SPA fallback
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) { _apiAvailable = false; return false; }
    const data = await res.json();
    _apiAvailable = Array.isArray(data) && data.length > 0;
  } catch {
    _apiAvailable = false;
  }
  return _apiAvailable;
}

export interface ProviderInfo {
  id: string;
  name: string;
  color: string;
  icon: string;
  connected: boolean;
  account?: string;
  canCreateKeys: boolean;
  credentialFields: Array<{ key: string; label: string; placeholder: string }>;
  credentialHelpUrl: string;
  envVars: string[];
  note?: string;
}

export interface ProjectInfo {
  name: string;
  createdAt: string;
  services: Record<string, { method: string; keyId?: string; envVars: string[] }>;
}

export interface ProvisionResult {
  success: boolean;
  project: {
    name: string;
    services: Record<string, { method: string }>;
    envVars: Record<string, string>;
  };
  errors?: Array<{ providerId: string; error: string }>;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchProviders(): Promise<ProviderInfo[]> {
  return request('/providers');
}

export async function connectProvider(providerId: string, credentials: Record<string, string>): Promise<{ success: boolean; account?: string }> {
  return request(`/connect/${providerId}`, {
    method: 'POST',
    body: JSON.stringify({ credentials }),
  });
}

export async function disconnectProvider(providerId: string): Promise<{ success: boolean }> {
  return request(`/connect/${providerId}`, { method: 'DELETE' });
}

export async function provision(projectName: string, providerIds: string[]): Promise<ProvisionResult> {
  return request('/provision', {
    method: 'POST',
    body: JSON.stringify({ projectName, providerIds }),
  });
}

export async function fetchProjects(): Promise<ProjectInfo[]> {
  return request('/projects');
}

export async function fetchEnv(name: string): Promise<string> {
  const res = await fetch(`${BASE}/projects/${name}/env`);
  if (!res.ok) {
    throw new Error(`Failed to fetch .env for "${name}"`);
  }
  return res.text();
}

export async function exportProject(name: string, targetPath: string): Promise<{ success: boolean; path: string }> {
  return request(`/projects/${name}/export`, {
    method: 'POST',
    body: JSON.stringify({ targetPath }),
  });
}

export async function deleteProject(name: string): Promise<{ success: boolean }> {
  return request(`/projects/${name}`, { method: 'DELETE' });
}
