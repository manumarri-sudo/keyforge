import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.log');

export type AuditEvent =
  | 'provider_connected'
  | 'provider_disconnected'
  | 'key_created'
  | 'key_copied'
  | 'project_created'
  | 'project_exported'
  | 'project_deleted'
  | 'key_revoked';

export interface AuditEntry {
  timestamp: string;
  event: AuditEvent;
  providerId?: string;
  projectName?: string;
  detail?: string;
}

export function logAudit(entry: Omit<AuditEntry, 'timestamp'>): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const full: AuditEntry = { timestamp: new Date().toISOString(), ...entry };
  fs.appendFileSync(AUDIT_FILE, JSON.stringify(full) + '\n');
}

export function readAuditLog(): AuditEntry[] {
  if (!fs.existsSync(AUDIT_FILE)) return [];
  const lines = fs.readFileSync(AUDIT_FILE, 'utf-8').trim().split('\n');
  return lines.filter(Boolean).map((l) => JSON.parse(l));
}
