import React, { useEffect, useState, useRef } from 'react';
import { fetchProviders, provision, fetchEnv, type ProviderInfo, type ProvisionResult } from '../lib/api';
import ProviderIcon from './ProviderIcon';
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

  // Success state
  if (result) {
    return (
      <div className="max-w-2xl animate-fade-in-up">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {/* Success header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Project created</h2>
              <p className="text-sm text-gray-500">{result.project.name}</p>
            </div>
          </div>

          {/* Env vars */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-5">
            <div className="space-y-1.5">
              {Object.entries(result.project.envVars).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-gray-500">{key}</span>
                  <span className="text-gray-300">=</span>
                  <span className="text-emerald-600">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              {result.errors.map((e) => (
                <div key={e.providerId}>{e.providerId}: {e.error}</div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={handleDownload}
              className="px-4 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
            >
              Download .env
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg transition-colors"
            >
              Copy to clipboard
            </button>
          </div>

          {/* CLI hint */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 font-mono text-xs text-gray-500">
            <span className="text-gray-400">$</span> keyforge export {result.project.name} --to ./
          </div>

          <button
            onClick={() => { setResult(null); setProjectName(''); setSelected(new Set()); }}
            className="mt-5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            &#8592; Create another project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <form onSubmit={handleSubmit}>
        {/* Project name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Project name</label>
          <input
            ref={nameRef}
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="my-project"
            className={`w-full bg-white border rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono ${
              projectName && !nameValid ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-emerald-500'
            }`}
          />
          {projectName && !nameValid && (
            <p className="mt-1.5 text-xs text-red-500">Lowercase letters, numbers, and hyphens only (1-50 chars)</p>
          )}
        </div>

        {/* Service selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Services</label>
          {providers.length === 0 ? (
            <div className="text-center py-10 bg-white border border-gray-200 rounded-xl">
              <div className="text-3xl mb-3">&#128268;</div>
              <p className="text-sm text-gray-500 mb-1">No services connected yet</p>
              <p className="text-xs text-gray-400">Connect services in the Services tab first</p>
            </div>
          ) : (
            <div className="space-y-2">
              {providers.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 p-3.5 bg-white border rounded-xl cursor-pointer transition-all duration-200 ${
                    selected.has(p.id)
                      ? 'border-emerald-300 bg-emerald-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => handleToggle(p.id)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500/30"
                  />
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${p.color}12`, color: p.color }}
                  >
                    <ProviderIcon providerId={p.id} className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-gray-800 flex-1">{p.name}</span>
                  {p.canCreateKeys ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Creates new key
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-400 border border-gray-100">
                      Uses stored key
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
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
