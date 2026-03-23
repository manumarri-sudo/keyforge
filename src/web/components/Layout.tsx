import React, { useState } from 'react';
import ServiceGrid from './ServiceGrid';
import ProvisionFlow from './ProvisionFlow';
import ProjectList from './ProjectList';

const tabs = [
  { id: 'services', label: 'Services' },
  { id: 'new', label: 'New Project' },
  { id: 'projects', label: 'Projects' },
] as const;
type Tab = typeof tabs[number]['id'];

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>K</span>
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-tight text-gray-900"
                style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace" }}
              >
                KeyForge
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              Running locally
            </span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="bg-white border-b border-gray-200 px-6 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6 max-w-6xl mx-auto animate-fade-in">
        {activeTab === 'services' && <ServiceGrid key={refreshKey} />}
        {activeTab === 'new' && <ProvisionFlow key={refreshKey} onCreated={refresh} />}
        {activeTab === 'projects' && <ProjectList key={refreshKey} />}
      </main>
    </div>
  );
}
