import React, { useState, useEffect, useRef } from 'react';
import { connectProvider, type ProviderInfo } from '../lib/api';
import ProviderIcon from './ProviderIcon';
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
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

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
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="h-1 rounded-t-2xl" style={{ backgroundColor: provider.color }} />

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${provider.color}12`, color: provider.color }}
            >
              <ProviderIcon providerId={provider.id} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Connect {provider.name}</h2>
              <a
                href={provider.credentialHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
              >
                Where do I find this? &#8599;
              </a>
            </div>
          </div>

          {provider.note && !provider.canCreateKeys && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
              {provider.note}
            </div>
          )}

          <div className="space-y-4">
            {provider.credentialFields.map((field, i) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                <div className="relative">
                  <input
                    ref={i === 0 ? firstRef : undefined}
                    type={showFields[field.key] ? 'text' : 'password'}
                    placeholder={field.placeholder}
                    value={values[field.key] || ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pr-14 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowFields((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                    aria-label={showFields[field.key] ? `Hide ${field.label}` : `Show ${field.label}`}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                  >
                    {showFields[field.key] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: provider.color || '#059669' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Validating...
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
