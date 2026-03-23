import React, { useEffect, useState, useRef } from 'react';
import { fetchProviders, provision, fetchEnv, type ProviderInfo, type ProvisionResult } from '../lib/api';
import { toast } from './Toast';

interface Props {
  onCreated: () => void;
}

export default function ProvisionFlow({ onCreated }: Props) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [projectName, setProjectName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProviders().then((all) => setProviders(all.filter((p) => p.connected)));
    nameRef.current?.focus();
  }, []);

  const nameValid = /^[a-z0-9][a-z0-9-]{0,49}$/.test(projectName);
  const canSubmit = nameValid && selected.size > 0 && !loading;

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await provision(projectName, Array.from(selected));
      setResult(res);
      toast(`Project "${projectName}" created!`, 'success');
      onCreated();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const env = await fetchEnv(result.project.name);
      const blob = new Blob([env], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '.env';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      const env = await fetchEnv(result.project.name);
      await navigator.clipboard.writeText(env);
      toast('Copied .env to clipboard', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-emerald-400 text-xl">✓</span>
            <h2 className="text-lg font-semibold">Project "{result.project.name}" created</h2>
          </div>

          <div className="space-y-2 mb-6">
            {Object.entries(result.project.envVars).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 font-mono text-sm">
                <span className="text-zinc-400 min-w-0">{key}</span>
                <span className="text-zinc-600">=</span>
                <span className="text-emerald-400/70">{val}</span>
              </div>
            ))}
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-900/20 border border-yellow-800/50 text-sm text-yellow-300">
              {result.errors.map((e) => (
                <div key={e.providerId}>{e.providerId}: {e.error}</div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={handleDownload} className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
              Download .env
            </button>
            <button onClick={handleCopy} className="px-4 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg transition-colors">
              Copy to clipboard
            </button>
          </div>

          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 font-mono text-xs text-zinc-400">
            keyforge export {result.project.name} --to ./
          </div>

          <button
            onClick={() => { setResult(null); setProjectName(''); setSelected(new Set()); }}
            className="mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Create another project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Project name</label>
          <input
            ref={nameRef}
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="my-project"
            className={`w-full bg-zinc-900 border rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
              projectName && !nameValid ? 'border-red-500' : 'border-zinc-800 focus:border-emerald-500'
            }`}
          />
          {projectName && !nameValid && (
            <p className="mt-1 text-xs text-red-400">Lowercase letters, numbers, and hyphens only (1-50 chars)</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-3">Services</label>
          {providers.length === 0 ? (
            <p className="text-sm text-zinc-500 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
              Connect services in the Services tab first.
            </p>
          ) : (
            <div className="space-y-2">
              {providers.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 p-3 bg-zinc-900 border rounded-lg cursor-pointer transition-colors ${
                    selected.has(p.id) ? 'border-emerald-600/50 bg-emerald-950/20' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => handleToggle(p.id)}
                    className="w-4 h-4 rounded border-zinc-600 text-emerald-500 bg-zinc-800 focus:ring-emerald-500/50"
                  />
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm font-medium text-zinc-200 flex-1">{p.name}</span>
                  {p.canCreateKeys ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800/50">
                      Creates new key
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-500 border border-zinc-700">
                      Uses stored key
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating keys...
            </span>
          ) : (
            `Create keys${projectName ? ` for ${projectName}` : ''}`
          )}
        </button>
      </form>
    </div>
  );
}
