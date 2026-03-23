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
      } catch (err) {
        toast(`Failed to load .env: ${(err as Error).message}`, 'error');
      }
    }
  };

  const handleDownload = async (name: string) => {
    try {
      const env = envCache[name] || await fetchEnv(name);
      const blob = new Blob([env], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.env`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Downloaded ${name}.env`, 'success');
    } catch (err) {
      toast(`Download failed: ${(err as Error).message}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="text-4xl mb-4">&#128477;&#65039;</div>
        <p className="text-sm text-gray-500 mb-1">No projects yet</p>
        <p className="text-xs text-gray-400">Create one in the "New Project" tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl animate-fade-in">
      {projects.map((proj) => {
        const serviceIds = Object.keys(proj.services);
        const isExpanded = expanded === proj.name;

        return (
          <div
            key={proj.name}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden card-hover"
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => handleExpand(proj.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-mono font-medium text-gray-500">
                    {proj.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{proj.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">
                        {new Date(proj.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] text-gray-300">&#183;</span>
                      <span className="text-[11px] text-gray-400">
                        {serviceIds.length} service{serviceIds.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(proj.name); }}
                    aria-label={`Export .env for ${proj.name}`}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all"
                  >
                    Export .env
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(proj.name); }}
                    aria-label={`Delete project ${proj.name}`}
                    className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                  <span className={`text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    &#9662;
                  </span>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100 animate-fade-in">
                <div className="mt-3 space-y-2">
                  {serviceIds.map((sid) => {
                    const svc = proj.services[sid];
                    return (
                      <div key={sid} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-700 font-medium capitalize">{sid}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          svc.method === 'api'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-gray-50 text-gray-400'
                        }`}>
                          {svc.method === 'api' ? 'API created' : 'Copied'}
                        </span>
                        <span className="text-gray-400 font-mono text-xs">{svc.envVars?.join(', ')}</span>
                      </div>
                    );
                  })}
                </div>
                {envCache[proj.name] && (
                  <pre className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600 font-mono overflow-x-auto">
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
