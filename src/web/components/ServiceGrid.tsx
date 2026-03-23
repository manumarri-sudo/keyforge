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
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => (
          <div
            key={p.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
          >
            <div className="h-1" style={{ backgroundColor: p.color }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{p.icon}</span>
                  <h3 className="font-semibold text-zinc-100">{p.name}</h3>
                </div>
                {p.connected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-500 border border-zinc-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    Not connected
                  </span>
                )}
              </div>

              {p.connected && p.account && (
                <p className="text-xs text-zinc-400 mb-3">{p.account}</p>
              )}

              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.envVars.map((v) => (
                  <span key={v} className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-500 border border-zinc-700">
                    {v}
                  </span>
                ))}
              </div>

              {p.connected ? (
                <button
                  onClick={() => handleDisconnect(p)}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => setConnectTarget(p)}
                  className="px-4 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
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
