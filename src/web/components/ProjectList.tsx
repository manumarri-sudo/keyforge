import React, { useEffect, useState } from 'react';
import { fetchProjects, deleteProject, fetchEnv, type ProjectInfo } from '../lib/api';
import { toast } from './Toast';

export default function ProjectList() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [envCache, setEnvCache] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete project "${name}" and all its files?`)) return;
    try {
      await deleteProject(name);
      toast(`Deleted "${name}"`, 'success');
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const handleExpand = async (name: string) => {
    if (expanded === name) {
      setExpanded(null);
      return;
    }
    setExpanded(name);
    if (!envCache[name]) {
      try {
        const env = await fetchEnv(name);
        setEnvCache((prev) => ({ ...prev, [name]: env }));
      } catch { /* ignore */ }
    }
  };

  const handleDownload = async (name: string) => {
    const env = envCache[name] || await fetchEnv(name);
    const blob = new Blob([env], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <p className="text-sm text-zinc-500 text-center py-20">
        No projects yet. Create one in the "New Project" tab.
      </p>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {projects.map((proj) => {
        const serviceIds = Object.keys(proj.services);
        const isExpanded = expanded === proj.name;

        return (
          <div key={proj.name} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
              onClick={() => handleExpand(proj.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-100">{proj.name}</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(proj.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {serviceIds.length} service{serviceIds.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(proj.name); }}
                    className="px-3 py-1 text-xs font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(proj.name); }}
                    className="px-3 py-1 text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                  <span className={`text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-zinc-800">
                <div className="mt-3 space-y-2">
                  {serviceIds.map((sid) => {
                    const svc = proj.services[sid];
                    return (
                      <div key={sid} className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-400 font-medium">{sid}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          svc.method === 'api'
                            ? 'bg-emerald-900/40 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {svc.method === 'api' ? 'API created' : 'Copied'}
                        </span>
                        <span className="text-zinc-600 font-mono text-xs">{svc.envVars?.join(', ')}</span>
                      </div>
                    );
                  })}
                </div>
                {envCache[proj.name] && (
                  <pre className="mt-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-xs text-zinc-400 font-mono overflow-x-auto">
                    {envCache[proj.name]}
                  </pre>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
