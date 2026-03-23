import React, { useState } from 'react';
import ServiceGrid from './ServiceGrid';
import ProvisionFlow from './ProvisionFlow';
import ProjectList from './ProjectList';

const tabs = ['Services', 'New Project', 'Projects'] as const;
type Tab = typeof tabs[number];

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('Services');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace" }}>
          ⚿ KeyForge
        </h1>
      </header>

      {/* Tab bar */}
      <nav className="border-b border-zinc-800 px-6">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6 max-w-6xl mx-auto">
        {activeTab === 'Services' && <ServiceGrid key={refreshKey} />}
        {activeTab === 'New Project' && <ProvisionFlow key={refreshKey} onCreated={refresh} />}
        {activeTab === 'Projects' && <ProjectList key={refreshKey} />}
      </main>

    </div>
  );
}
