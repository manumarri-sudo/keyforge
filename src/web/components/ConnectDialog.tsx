import React, { useState, useEffect, useRef } from 'react';
import { connectProvider, type ProviderInfo } from '../lib/api';
import { toast } from './Toast';

interface Props {
  provider: ProviderInfo;
  onClose: () => void;
  onConnected: () => void;
}

export default function ConnectDialog({ provider, onClose, onConnected }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [showFields, setShowFields] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await connectProvider(provider.id, values);
      toast(`Connected to ${provider.name}${result.account ? ` (${result.account})` : ''}`, 'success');
      onConnected();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header accent */}
        <div className="h-1 rounded-t-xl" style={{ backgroundColor: provider.color }} />

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{provider.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Connect {provider.name}</h2>
              <a
                href={provider.credentialHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Where do I find this? ↗
              </a>
            </div>
          </div>

          {provider.note && !provider.canCreateKeys && (
            <div className="mb-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-xs text-zinc-400">
              {provider.note}
            </div>
          )}

          <div className="space-y-4">
            {provider.credentialFields.map((field, i) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">{field.label}</label>
                <div className="relative">
                  <input
                    ref={i === 0 ? firstRef : undefined}
                    type={showFields[field.key] ? 'text' : 'password'}
                    placeholder={field.placeholder}
                    value={values[field.key] || ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowFields((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                  >
                    {showFields[field.key] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: provider.color || '#10b981' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                'Connect'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
