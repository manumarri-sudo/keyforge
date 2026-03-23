import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const ENC_FILE = path.join(DATA_DIR, 'auth.enc');
const SERVICE = 'keyforge';

export interface StoredCredential {
  credentials: Record<string, string>;
  account?: string;
  connectedAt: string;
  metadata?: Record<string, string>;
}

// Derive a machine-specific encryption key
function deriveKey(): Buffer {
  const raw = `${os.hostname()}:${os.userInfo().username}:keyforge-local`;
  return crypto.createHash('sha256').update(raw).digest();
}

// --- Encrypted file fallback ---
function readEncFile(): Record<string, StoredCredential> {
  try {
    if (!fs.existsSync(ENC_FILE)) return {};
    const raw = fs.readFileSync(ENC_FILE, 'utf-8');
    const { iv, tag, data } = JSON.parse(raw) as { iv: string; tag: string; data: string };
    const key = deriveKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    const decrypted = decipher.update(data, 'hex', 'utf-8') + decipher.final('utf-8');
    return JSON.parse(decrypted);
  } catch {
    return {};
  }
}

function writeEncFile(store: Record<string, StoredCredential>): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = cipher.update(JSON.stringify(store), 'utf-8', 'hex') + cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  fs.writeFileSync(ENC_FILE, JSON.stringify({ iv: iv.toString('hex'), tag, data: encrypted }));
}

// --- Keytar with fallback ---
let keytarModule: {
  setPassword(service: string, account: string, password: string): Promise<void>;
  getPassword(service: string, account: string): Promise<string | null>;
  deletePassword(service: string, account: string): Promise<boolean>;
  findCredentials(service: string): Promise<Array<{ account: string; password: string }>>;
} | null = null;

let keytarLoaded = false;
let useKeytar = false;

async function loadKeytar(): Promise<boolean> {
  if (keytarLoaded) return useKeytar;
  keytarLoaded = true;
  try {
    keytarModule = await import('keytar');
    useKeytar = true;
  } catch {
    console.warn('[KeyForge] System keychain unavailable, using encrypted file fallback.');
    useKeytar = false;
  }
  return useKeytar;
}

export async function saveCredential(providerId: string, data: StoredCredential): Promise<void> {
  const json = JSON.stringify(data);
  if (await loadKeytar()) {
    await keytarModule!.setPassword(SERVICE, `provider:${providerId}`, json);
  } else {
    const store = readEncFile();
    store[providerId] = data;
    writeEncFile(store);
  }
}

export async function getCredential(providerId: string): Promise<StoredCredential | null> {
  if (await loadKeytar()) {
    const raw = await keytarModule!.getPassword(SERVICE, `provider:${providerId}`);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  } else {
    const store = readEncFile();
    return store[providerId] || null;
  }
}

export async function deleteCredential(providerId: string): Promise<void> {
  if (await loadKeytar()) {
    await keytarModule!.deletePassword(SERVICE, `provider:${providerId}`);
  } else {
    const store = readEncFile();
    delete store[providerId];
    writeEncFile(store);
  }
}

export async function listConnected(): Promise<string[]> {
  if (await loadKeytar()) {
    const creds = await keytarModule!.findCredentials(SERVICE);
    return creds
      .filter((c) => c.account.startsWith('provider:'))
      .map((c) => c.account.replace('provider:', ''));
  } else {
    return Object.keys(readEncFile());
  }
}
