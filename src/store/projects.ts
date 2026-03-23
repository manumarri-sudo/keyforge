import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');

export interface ProjectService {
  method: 'api' | 'copy';
  keyId?: string;
  envVars: string[];
}

export interface ProjectManifest {
  name: string;
  createdAt: string;
  services: Record<string, ProjectService>;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function createProject(name: string, services: Record<string, ProjectService>): ProjectManifest {
  const projectDir = path.join(PROJECTS_DIR, name);
  ensureDir(projectDir);
  const manifest: ProjectManifest = {
    name,
    createdAt: new Date().toISOString(),
    services,
  };
  fs.writeFileSync(path.join(projectDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

export function writeEnv(name: string, keys: Record<string, string>): void {
  const projectDir = path.join(PROJECTS_DIR, name);
  ensureDir(projectDir);

  const envLines = Object.entries(keys).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(path.join(projectDir, '.env'), envLines.join('\n') + '\n');

  const exampleLines = Object.keys(keys).map((k) => `${k}=your_${k.toLowerCase()}_here`);
  fs.writeFileSync(path.join(projectDir, '.env.example'), exampleLines.join('\n') + '\n');
}

export function getProject(name: string): ProjectManifest | null {
  const manifestPath = path.join(PROJECTS_DIR, name, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

export function listProjects(): ProjectManifest[] {
  ensureDir(PROJECTS_DIR);
  const dirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());
  const manifests: ProjectManifest[] = [];
  for (const dir of dirs) {
    const m = getProject(dir.name);
    if (m) manifests.push(m);
  }
  return manifests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function deleteProject(name: string): void {
  const projectDir = path.join(PROJECTS_DIR, name);
  if (fs.existsSync(projectDir)) {
    try {
      fs.rmSync(projectDir, { recursive: true, force: true });
    } catch {
      // Fallback: delete files individually then directory
      const files = fs.readdirSync(projectDir);
      for (const f of files) {
        try { fs.unlinkSync(path.join(projectDir, f)); } catch { /* best effort */ }
      }
      try { fs.rmdirSync(projectDir); } catch { /* best effort */ }
    }
  }
}

export function getEnvContent(name: string): string | null {
  const envPath = path.join(PROJECTS_DIR, name, '.env');
  if (!fs.existsSync(envPath)) return null;
  return fs.readFileSync(envPath, 'utf-8');
}

export function exportProject(name: string, targetPath: string): void {
  const projectDir = path.join(PROJECTS_DIR, name);
  const envFile = path.join(projectDir, '.env');
  const exampleFile = path.join(projectDir, '.env.example');

  if (!fs.existsSync(envFile)) throw new Error(`No .env found for project "${name}"`);

  ensureDir(targetPath);
  fs.copyFileSync(envFile, path.join(targetPath, '.env'));
  if (fs.existsSync(exampleFile)) {
    fs.copyFileSync(exampleFile, path.join(targetPath, '.env.example'));
  }

  // Create/update .gitignore
  const gitignorePath = path.join(targetPath, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    if (!content.includes('.env')) {
      fs.appendFileSync(gitignorePath, '\n.env\n');
    }
  } else {
    fs.writeFileSync(gitignorePath, '.env\n');
  }
}
