import React, { useEffect, useState } from 'react';
import { fetchProviders, disconnectProvider, type ProviderInfo } from '../lib/api';
import ConnectDialog from './ConnectDialog';
import { toast } from './Toast';

export default function ServiceGrid() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectTarget, setConnectTarget] = useState<ProviderInfo | null>(null);

  const load = async () => {
    try {
      const data = await fetchProviders();
      setProviders(data);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDisconnect = async (provider: ProviderInfo) => {
    if (!confirm(`Disconnect ${provider.name}?`)) return;
    try {
      await disconnectProvider(provider.id);
      toast(`Disconnected ${provider.name}`, 'success');
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  const connected = providers.filter((p) => p.connected);

  return (
    <>
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-sm font-medium text-gray-500 whitespace-nowrap">
          {connected.length} of {providers.length} connected
        </h2>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(connected.length / providers.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-grid">
        {providers.map((p) => (
          <div
            key={p.id}
            className="group bg-white border border-gray-200 rounded-xl overflow-hidden card-hover"
          >
            {/* Color accent */}
            <div
              className="h-1 transition-all duration-300"
              style={{ backgroundColor: p.color }}
            />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">{p.name}</h3>
                    {p.connected && p.account && (
                      <p className="text-xs text-gray-400 mt-0.5">{p.account}</p>
                    )}
                  </div>
                </div>

                {p.connected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-50 text-gray-400 border border-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    Not connected
                  </span>
                )}
              </div>

              {/* Env vars */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.envVars.map((v) => (
                  <span
                    key={v}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-50 text-gray-400 border border-gray-100 truncate max-w-[180px]"
                    title={v}
                  >
                    {v}
                  </span>
                ))}
              </div>

              {/* Capability */}
              {p.canCreateKeys && (
                <div className="mb-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                    Per-project key creation
                  </span>
                </div>
              )}

              {/* Action */}
              {p.connected ? (
                <button
                  onClick={() => handleDisconnect(p)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors duration-200"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => setConnectTarget(p)}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300 transition-all duration-200"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {connectTarget && (
        <ConnectDialog
          provider={connectTarget}
          onClose={() => setConnectTarget(null)}
          onConnected={() => { setConnectTarget(null); load(); }}
        />
      )}
    </>
  );
}
